/**
 * Shared waveform visualizer for recording canvases.
 *
 * Previously duplicated in NachsprechenPlayer (gradient stroke style)
 * and TurnBasedSpeakingPlayer (filled bars style). This module provides
 * both styles via an `options` parameter.
 */

export interface WaveformOptions {
    /** Drawing style. 'gradient-stroke' = round-cap lines, 'bars' = filled rectangles */
    style?: 'gradient-stroke' | 'bars'
    /** Bar/line color. Used for 'bars' style. Default: '#10B981' */
    barColor?: string
    /** Gradient colors for 'gradient-stroke' style */
    gradientColors?: [string, string, string]
}

/**
 * Start a requestAnimationFrame loop that draws frequency data.
 * Returns a cleanup function to cancel the animation.
 */
export function startWaveformAnimation(
    canvas: HTMLCanvasElement,
    analyser: AnalyserNode,
    options: WaveformOptions = {},
): () => void {
    const {
        style = 'gradient-stroke',
        barColor = '#10B981',
        gradientColors = ['#3B82F6', '#6366f1', '#8B5CF6'],
    } = options

    const ctx = canvas.getContext('2d')
    if (!ctx) return () => {}

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let animFrameId = 0

    const draw = () => {
        animFrameId = requestAnimationFrame(draw)
        analyser.getByteFrequencyData(dataArray)
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const barWidth = (canvas.width / bufferLength) * 2.5
        let x = 0

        if (style === 'gradient-stroke') {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
            gradient.addColorStop(0, gradientColors[0])
            gradient.addColorStop(0.5, gradientColors[1])
            gradient.addColorStop(1, gradientColors[2])

            ctx.strokeStyle = gradient
            ctx.lineCap = 'round'
            ctx.lineWidth = Math.max(2, barWidth - 2)

            for (let i = 0; i < bufferLength; i++) {
                const v = (dataArray[i] ?? 0) / 255.0
                const barHeight = Math.max(4, v * v * canvas.height * 0.9)
                const y = (canvas.height - barHeight) / 2

                ctx.beginPath()
                ctx.moveTo(x + barWidth / 2, y)
                ctx.lineTo(x + barWidth / 2, y + barHeight)
                ctx.stroke()
                x += barWidth
            }
        } else {
            // 'bars' style
            ctx.fillStyle = barColor
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = Math.max(2, ((dataArray[i] ?? 0) / 255.0) * canvas.height * 0.8)
                ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight)
                x += barWidth
            }
        }
    }

    draw()

    return () => {
        if (animFrameId) cancelAnimationFrame(animFrameId)
    }
}
