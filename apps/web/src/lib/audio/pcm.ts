/**
 * Converts a Float32Array (from Web Audio API) to a 16-bit PCM ArrayBuffer.
 */
export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2)
    const view = new DataView(buffer)
    for (let i = 0; i < input.length; i++) {
        const sample = input[i] ?? 0
        let s = Math.max(-1, Math.min(1, sample))
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true) // little-endian
    }
    return buffer
}

/**
 * Converts a 16-bit PCM ArrayBuffer to a Float32Array (for Web Audio API playback).
 */
export function pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
    const int16Array = new Int16Array(buffer)
    const float32Array = new Float32Array(int16Array.length)
    for (let i = 0; i < int16Array.length; i++) {
        const s = int16Array[i] ?? 0
        float32Array[i] = s < 0 ? s / 0x8000 : s / 0x7fff
    }
    return float32Array
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i] ?? 0)
    }
    return typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(buffer).toString('base64')
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary')
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}
