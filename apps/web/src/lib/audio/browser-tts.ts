/**
 * Shared browser SpeechSynthesis utility.
 *
 * Previously duplicated in NachsprechenPlayer (detailed voice selection)
 * and TurnBasedSpeakingPlayer (minimal). This module provides the
 * high-quality version for all consumers.
 */

export interface BrowserTTSOptions {
    /** BCP-47 language tag. Default: 'de-DE' */
    lang?: string
    /** Speech rate (0.1–10). Default: 0.85 for learner-friendly pace */
    rate?: number
    /** Pitch (0–2). Default: 1.0 */
    pitch?: number
    /** Called when speech finishes or errors */
    onEnd?: () => void
}

/**
 * Speak text using the browser's SpeechSynthesis API.
 * Automatically selects the best available German voice.
 *
 * @returns `true` if speech was started, `false` if SpeechSynthesis is unavailable.
 */
export function speakWithBrowserTTS(
    text: string,
    options: BrowserTTSOptions = {},
): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        options.onEnd?.()
        return false
    }

    const {
        lang = 'de-DE',
        rate = 0.85,
        pitch = 1.0,
        onEnd,
    } = options

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch

    // Select the best available German voice
    const voices = window.speechSynthesis.getVoices()
    const langPrefix = lang.split('-')[0] ?? lang
    const langVoices = voices.filter(v => v.lang.startsWith(langPrefix))

    // Priority: Google Deutsch > any Google voice > exact lang match > any lang voice
    const preferred =
        langVoices.find(v => v.name.includes('Google Deutsch')) ??
        langVoices.find(v => v.name.includes('Google')) ??
        langVoices.find(v => v.lang === lang) ??
        langVoices[0]
    if (preferred) utterance.voice = preferred

    utterance.onend = () => onEnd?.()
    utterance.onerror = () => onEnd?.()

    window.speechSynthesis.speak(utterance)
    return true
}

/** Cancel any ongoing browser TTS speech */
export function cancelBrowserTTS(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
    }
}
