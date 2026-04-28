// ─── Types & Constants for Reading Player ──────────────
// Extracted from reading-player.tsx to keep the main component focused on logic

import { CEFR_THEME } from '@/lib/constants/cefr'
import type { ReadingImage, ReadingTextEntry } from './reading-renderer-types'

// ─── Types ──────────────────────────────────────────
export interface Question {
    id: string
    questionNumber: number
    questionType: string
    linkedText: string | null
    statement: string
    options: string[] | null
    sortOrder: number
}

export interface ExplanationData {
    key_evidence?: string
    reasoning?: string
    vocabulary_help?: Record<string, string>
    [key: string]: unknown
}

export interface QuestionResult {
    questionId: string
    questionNumber: number
    questionType: string
    statement: string
    linkedText: string | null
    options: string[]
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: ExplanationData | string | null
}

export interface ReadingPlayerProps {
    exerciseId: string
    cefrLevel: string
    teil: number
    teilName: string
    topic: string
    textsJson: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma Json field, shape varies by exercise type
    imagesJson: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma Json field
    questions: Question[]
}

export type Phase = 'intro' | 'warmup' | 'exercise' | 'results'

export type LookedUpWord = {
    word: string
    translation: string
    context?: string
    timestamp: number
}

export type TooltipState = {
    word: string
    translation: string | null
    loading: boolean
    x: number
    y: number
}

export type TextHighlight = { textIndex: number; text: string; color: string }

// ─── Constants ──────────────────────────────────────
// Re-export from shared CEFR theme — legacy alias kept for backward compat
export const CEFR_COLORS = CEFR_THEME

export const TEIL_DESCRIPTIONS: Record<string, Record<number, { icon: string; strategy: string; genre: string }>> = {
    beginner: {
        1: { icon: '📧', strategy: 'Đọc lướt một lần để nắm ý chính, sau đó chú ý các từ khóa.', genre: 'Văn bản ngắn' },
        2: { icon: '📋', strategy: 'So sánh từng thông báo và để ý chi tiết như giá, địa điểm, thời gian.', genre: 'Thông báo' },
        3: { icon: '🪧', strategy: 'Đọc từng biển báo thật kỹ, đặc biệt là số liệu và điều cấm.', genre: 'Biển báo' },
        4: { icon: '🗓️', strategy: 'Tìm thông tin quan trọng trước: ngày, giờ, địa điểm.', genre: 'Văn bản thông tin' },
    },
    advanced: {
        1: { icon: '📰', strategy: 'Đọc lướt toàn văn trước, rồi mới quay lại câu hỏi.', genre: 'Bài thông tin' },
        2: { icon: '📝', strategy: 'Chú ý từ nối và tín hiệu lập luận như jedoch, dennoch, außerdem, folglich.', genre: 'Điền khuyết' },
        3: { icon: '🔬', strategy: 'Gạch ý chính của từng đoạn trước khi trả lời.', genre: 'Văn bản học thuật' },
        4: { icon: '💬', strategy: 'Các ý kiến có thể khá giống nhau, hãy chú ý sắc thái khác biệt.', genre: 'Ý kiến' },
        5: { icon: '📖', strategy: 'Đọc từng đoạn ngắn rồi trả lời từng nhóm câu hỏi.', genre: 'Bài tư vấn' },
    },
}

export const DIFFICULTY: Record<string, { label: string; dots: number; color: string }> = {
    A1: { label: 'Dễ', dots: 1, color: '#22C55E' },
    A2: { label: 'Dễ', dots: 2, color: '#84CC16' },
    B1: { label: 'Vừa', dots: 3, color: '#F97316' },
    B2: { label: 'Khó', dots: 4, color: '#EF4444' },
    C1: { label: 'Nâng cao', dots: 5, color: '#A855F7' },
    C2: { label: 'Chuyên sâu', dots: 5, color: '#7C3AED' },
}

export const WARMUP_QUESTIONS: Record<string, string[]> = {
    A1: [
        'Em nhìn thấy gì trong hình?',
        'Em đã biết những từ nào về chủ đề này?',
        'Em đoán văn bản sẽ nói về điều gì?',
    ],
    A2: [
        'Em đã biết gì về chủ đề này?',
        'Những từ nào xuất hiện trong đầu em khi nghĩ đến chủ đề này?',
        'Em muốn tìm được thông tin gì trong bài?',
    ],
    B1: [
        'Quan điểm của em về chủ đề này là gì?',
        'Em dự đoán sẽ gặp những từ khóa nào?',
        'Em đã biết gì về bối cảnh này?',
    ],
    B2: [
        'Hãy dự đoán luận điểm chính của bài.',
        'Em nghĩ bài sẽ đưa ra những lập luận nào?',
        'Bối cảnh của chủ đề này là gì?',
    ],
    C1: [
        'Tác giả có thể đang bảo vệ quan điểm nào?',
        'Em dự đoán sẽ gặp thuật ngữ chuyên môn nào?',
        'Vì sao chủ đề này đáng chú ý ở hiện tại?',
    ],
    C2: [
        'Phân tích tiêu đề: luận đề ẩn phía sau là gì?',
        'Em dự đoán bài dùng góc nhìn học thuật nào?',
        'Em sẽ xếp chủ đề này vào nhóm vấn đề nào?',
    ],
}

export const POST_READING_TIPS: Record<string, string[]> = {
    A1: [
        'Đọc lại văn bản thành tiếng để nhớ từ tốt hơn.',
        'Ghi 3 từ mới và đặt câu đơn giản với mỗi từ.',
        'Ngày mai thử đọc lại bài mà không cần gợi ý.',
    ],
    A2: [
        'Đánh dấu các thông tin quan trọng nhất trong bài.',
        'Kể lại nội dung bài bằng 2-3 câu của em.',
        'Ôn từ mới bằng flashcard.',
    ],
    B1: [
        'Tóm tắt bài bằng 3-4 câu.',
        'Ghi lại các luận điểm chính của tác giả.',
        'Tìm một văn bản tương tự và so sánh thông tin.',
    ],
    B2: [
        'Phân tích cấu trúc bài: mở bài, thân bài, kết luận.',
        'Nhận diện cách tác giả dẫn dắt và nhấn mạnh ý.',
        'Viết một đoạn ngắn nêu quan điểm về chủ đề.',
    ],
    C1: [
        'Đánh giá lập luận: bằng chứng có thuyết phục không?',
        'So sánh nhiều góc nhìn khác nhau về chủ đề.',
        'Tự viết một phản biện ngắn.',
    ],
    C2: [
        'Phân tích vị trí của văn bản trong diễn ngôn rộng hơn.',
        'Nhận diện các giả định ngầm và tiền đề của tác giả.',
        'Viết một bài nhận xét phê bình khoảng 200 từ.',
    ],
}

// ─── Helpers ────────────────────────────────────────
export function extractKeyWords(textsJson: any, cefrLevel: string): string[] {
    if (!textsJson) return []
    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    const allText = texts.map((t: any) => t.text || t.content || t.body || '').join(' ')
    const minLength = ['A1', 'A2'].includes(cefrLevel) ? 5 : 7
    const words = allText.split(/\s+/)
        .filter((w: string) => w.length >= minLength && /^[A-ZÄÖÜa-zäöüß]/.test(w))
        .map((w: string) => w.replace(/[.,!?;:()\"]/g, ''))
        .filter((w: string, i: number, arr: string[]) => arr.indexOf(w) === i)
    return words.sort(() => Math.random() - 0.5).slice(0, 8)
}

export function getImageUrl(filename: string, cefrLevel: string) {
    return `/images/reading/${cefrLevel.toLowerCase()}/${filename}`
}

export function getHeroImage(imagesJson: any, cefrLevel: string): string | null {
    if (!imagesJson || !Array.isArray(imagesJson)) return null
    const hero = imagesJson.find((img: any) => img.placement === 'header' || img.placement === 'anzeige_a' || img.placement === 'schild_1')
    return hero ? getImageUrl(hero.filename, cefrLevel) : null
}
