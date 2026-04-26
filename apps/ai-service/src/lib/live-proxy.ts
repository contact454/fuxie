import type { IncomingMessage } from 'node:http'
import type { Socket } from 'node:net'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { WebSocket, WebSocketServer, type RawData } from 'ws'
import { getGeminiApiKey } from './gemini.js'
import {
    recordLiveProxyAccepted,
    recordLiveProxyClosed,
    recordLiveProxyError,
    recordLiveProxyMessage,
    recordLiveProxyRejected,
} from './observability.js'
import { checkRateLimit, getRateLimitNumber } from './rate-limit.js'

type UpgradeServer = {
    on(event: 'upgrade', listener: (request: IncomingMessage, socket: Socket, head: Buffer) => void): unknown
}

const LIVE_PATH = '/live'
const MAX_MESSAGE_BYTES = 2 * 1024 * 1024
const TOKEN_MAX_AGE_SKEW_SECONDS = 30
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000']
const GEMINI_LIVE_URL =
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

export function attachLiveProxy(server: UpgradeServer) {
    const wss = new WebSocketServer({
        noServer: true,
        maxPayload: MAX_MESSAGE_BYTES,
    })

    server.on('upgrade', (request, socket, head) => {
        const url = parseRequestUrl(request)
        if (url.pathname !== LIVE_PATH) {
            return
        }

        if (!isOriginAllowed(request.headers.origin) || !isAuthorized(url)) {
            recordLiveProxyRejected()
            socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
            socket.destroy()
            return
        }

        const rateLimit = checkRateLimit(getUpgradeClientKey(request), {
            keyPrefix: 'live-proxy',
            windowMs: getRateLimitNumber('AI_SERVICE_LIVE_RATE_LIMIT_WINDOW_MS', 60_000),
            max: getRateLimitNumber('AI_SERVICE_LIVE_RATE_LIMIT_MAX', 20),
        })
        if (!rateLimit.allowed) {
            recordLiveProxyRejected()
            socket.write(`HTTP/1.1 429 Too Many Requests\r\nRetry-After: ${rateLimit.retryAfterSeconds}\r\n\r\n`)
            socket.destroy()
            return
        }

        wss.handleUpgrade(request, socket, head, (client) => {
            wss.emit('connection', client, request)
        })
    })

    wss.on('connection', (client) => {
        bridgeLiveConnection(client)
    })

    return wss
}

function bridgeLiveConnection(client: WebSocket) {
    recordLiveProxyAccepted()

    let upstream: WebSocket
    try {
        const apiKey = getGeminiApiKey()
        upstream = new WebSocket(`${GEMINI_LIVE_URL}?key=${encodeURIComponent(apiKey)}`)
    } catch (error) {
        recordLiveProxyError('upstream', error instanceof Error ? error.message : 'Gemini Live configuration error')
        recordLiveProxyClosed()
        client.close(1011, error instanceof Error ? error.message : 'Gemini Live configuration error')
        return
    }

    const queue: Array<{ data: RawData; isBinary: boolean }> = []
    let closed = false

    const closeBoth = (code = 1000, reason = 'Live proxy closed') => {
        if (closed) {
            return
        }
        closed = true
        recordLiveProxyClosed()
        safeClose(client, code, reason)
        safeClose(upstream, code, reason)
    }

    client.on('message', (data, isBinary) => {
        if (getRawDataLength(data) > MAX_MESSAGE_BYTES) {
            closeBoth(1009, 'Message too large')
            return
        }

        if (upstream.readyState === WebSocket.OPEN) {
            forward(upstream, data, isBinary)
            recordLiveProxyMessage('to_upstream', getRawDataLength(data))
            return
        }

        queue.push({ data, isBinary })
    })

    upstream.on('open', () => {
        for (const item of queue.splice(0)) {
            forward(upstream, item.data, item.isBinary)
            recordLiveProxyMessage('to_upstream', getRawDataLength(item.data))
        }
    })

    upstream.on('message', (data, isBinary) => {
        if (client.readyState === WebSocket.OPEN) {
            forward(client, data, isBinary)
            recordLiveProxyMessage('to_client', getRawDataLength(data))
        }
    })

    client.on('close', (code, buffer) => closeBoth(code, buffer.toString() || 'Client closed'))
    upstream.on('close', (code, buffer) => closeBoth(code, buffer.toString() || 'Gemini Live closed'))
    client.on('error', (error) => {
        recordLiveProxyError('client', error.message)
        closeBoth(1011, 'Client WebSocket error')
    })
    upstream.on('error', (error) => {
        recordLiveProxyError('upstream', error.message)
        closeBoth(1011, 'Gemini Live WebSocket error')
    })
}

function parseRequestUrl(request: IncomingMessage): URL {
    return new URL(request.url ?? '/', 'http://localhost')
}

function getUpgradeClientKey(request: IncomingMessage): string {
    const forwardedFor = request.headers['x-forwarded-for']
    const realIp = request.headers['x-real-ip']
    const cloudflareIp = request.headers['cf-connecting-ip']

    return (
        headerValue(cloudflareIp) ||
        headerValue(realIp) ||
        headerValue(forwardedFor)?.split(',')[0]?.trim() ||
        request.socket.remoteAddress ||
        'unknown'
    )
}

function headerValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value
}

function isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) {
        return process.env.NODE_ENV !== 'production'
    }

    const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') ?? DEFAULT_ALLOWED_ORIGINS)
        .map((value) => value.trim())
        .filter(Boolean)

    return allowedOrigins.includes('*') || allowedOrigins.includes(origin)
}

function isAuthorized(url: URL): boolean {
    const secret = process.env.AI_SERVICE_PROXY_SECRET?.trim()
    if (!secret) {
        return process.env.NODE_ENV !== 'production'
    }

    const token = url.searchParams.get('token')
    if (!token || token.length > 4096) {
        return false
    }

    return verifyLiveProxyToken(token, secret)
}

export function createLiveProxyToken(subject: string, secret: string, ttlSeconds = 60, nowSeconds = Math.floor(Date.now() / 1000)) {
    const payload = Buffer.from(JSON.stringify({
        sub: subject,
        exp: nowSeconds + ttlSeconds,
    })).toString('base64url')
    const signature = createHmac('sha256', secret).update(payload).digest('base64url')
    return `${payload}.${signature}`
}

export function verifyLiveProxyToken(token: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
    const [payload, signature] = token.split('.')
    if (!payload || !signature) {
        return false
    }

    const expectedSignature = createHmac('sha256', secret).update(payload).digest('base64url')
    const signatureBuffer = Buffer.from(signature, 'base64url')
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url')

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return false
    }

    try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: unknown; sub?: unknown }
        if (typeof parsed.sub !== 'string' || typeof parsed.exp !== 'number') {
            return false
        }

        return parsed.exp + TOKEN_MAX_AGE_SKEW_SECONDS >= nowSeconds
    } catch {
        return false
    }
}

function forward(target: WebSocket, data: RawData, isBinary: boolean) {
    if (Array.isArray(data)) {
        target.send(Buffer.concat(data), { binary: true })
        return
    }

    target.send(data, { binary: isBinary })
}

function getRawDataLength(data: RawData): number {
    if (Array.isArray(data)) {
        return data.reduce((total, buffer) => total + buffer.length, 0)
    }

    return data instanceof ArrayBuffer ? data.byteLength : data.length
}

function safeClose(socket: WebSocket, code: number, reason: string) {
    if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        return
    }

    socket.close(code, reason.slice(0, 123))
}
