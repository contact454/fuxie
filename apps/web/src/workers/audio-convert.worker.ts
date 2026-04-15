/**
 * Web Worker for converting WebM audio blobs to WAV format.
 *
 * Runs the PCM sample conversion off the main thread to avoid
 * blocking the UI during stop-recording → evaluate transitions.
 * With 30s @ 16kHz that's 480k samples — ~50-100ms saved on main thread.
 *
 * Communication protocol:
 *   Main → Worker: { type: 'CONVERT', arrayBuffer: ArrayBuffer } (transferred)
 *   Worker → Main: { type: 'RESULT', wavBuffer: ArrayBuffer }   (transferred)
 *   Worker → Main: { type: 'ERROR', message: string }
 */

// We can't use decodeAudioData in a worker without OfflineAudioContext,
// so the main thread decodes and sends raw PCM Float32 data.
export interface ConvertMessage {
    type: 'CONVERT'
    /** Raw Float32 PCM samples (mono, already decoded by main thread) */
    samples: Float32Array
    sampleRate: number
}

export interface ConvertResult {
    type: 'RESULT'
    wavBuffer: ArrayBuffer
}

export interface ConvertError {
    type: 'ERROR'
    message: string
}

self.addEventListener('message', (event: MessageEvent<ConvertMessage>) => {
    if (event.data?.type !== 'CONVERT') return

    try {
        const { samples, sampleRate } = event.data
        const numSamples = samples.length
        const numChannels = 1
        const wavBuffer = new ArrayBuffer(44 + numSamples * 2)
        const view = new DataView(wavBuffer)

        // WAV header
        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i))
            }
        }
        writeString(0, 'RIFF')
        view.setUint32(4, 36 + numSamples * 2, true)
        writeString(8, 'WAVE')
        writeString(12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true) // PCM
        view.setUint16(22, numChannels, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * numChannels * 2, true)
        view.setUint16(32, numChannels * 2, true)
        view.setUint16(34, 16, true)
        writeString(36, 'data')
        view.setUint32(40, numSamples * 2, true)

        // Float32 → Int16 PCM samples
        for (let i = 0; i < numSamples; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]!))
            view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
        }

        const response: ConvertResult = { type: 'RESULT', wavBuffer }
        self.postMessage(response, { transfer: [wavBuffer] }) // Transfer ownership
    } catch (err) {
        const response: ConvertError = {
            type: 'ERROR',
            message: err instanceof Error ? err.message : String(err),
        }
        self.postMessage(response)
    }
})
