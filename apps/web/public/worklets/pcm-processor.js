class PCMProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0]
        if (!input || input.length === 0) return true
        
        const channelData = input[0] // We are using 1 channel (mono)
        if (!channelData) return true

        // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767) PCM
        const pcmBuffer = new ArrayBuffer(channelData.length * 2)
        const view = new DataView(pcmBuffer)
        let offset = 0
        
        for (let i = 0; i < channelData.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, channelData[i]))
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true) // true for little-endian
        }

        // Post the PCM buffer to the main thread
        this.port.postMessage(pcmBuffer)

        return true // Keep processor alive
    }
}

registerProcessor('pcm-processor', PCMProcessor)
