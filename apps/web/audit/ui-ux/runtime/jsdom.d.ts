declare module 'jsdom' {
    export class JSDOM {
        constructor(html?: string, options?: unknown)
        readonly window: Window & typeof globalThis & { close: () => void }
    }

    export class VirtualConsole {
        sendTo(console: Console, options?: unknown): this
    }
}
