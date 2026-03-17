/**
 * Generate A2 Vocabulary Content — ~800 words across 20 themes
 * Follows exact same JSON format as A1
 */
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const A2_DIR = 'content/a2/vocabulary'
mkdirSync(A2_DIR, { recursive: true })

// Helper to write theme file
function writeTheme(filename: string, theme: any, words: any[]) {
    const filePath = path.join(A2_DIR, filename)
    writeFileSync(filePath, JSON.stringify({ theme, words }, null, 4) + '\n', 'utf8')
    console.log(`  ✅ ${filename}: ${words.length} words — ${theme.name}`)
    return words.length
}

function main() {
    console.log('🦊 Generating A2 Vocabulary Content\n')
    let total = 0

    // ═══════════════════════════════════════════════════════════
    // Theme 01: Person & Identität (Extended Personal Information)
    // ═══════════════════════════════════════════════════════════
    total += writeTheme('01-person-identitaet.json', {
        slug: 'a2-person-identitaet',
        name: 'Person & Identität',
        nameVi: 'Thông tin cá nhân mở rộng',
        nameEn: 'Personal Identity',
        sortOrder: 1,
    }, [
        { word: 'Persönlichkeit', article: 'FEMININ', plural: 'die Persönlichkeiten', wordType: 'NOMEN', meaningVi: 'tính cách', meaningEn: 'personality', exampleSentence1: 'Sie hat eine starke Persönlichkeit.', exampleTranslation1: 'Cô ấy có tính cách mạnh mẽ.', exampleSentence2: 'Deine Persönlichkeit ist wichtig.', exampleTranslation2: 'Tính cách bạn quan trọng.' },
        { word: 'Eigenschaft', article: 'FEMININ', plural: 'die Eigenschaften', wordType: 'NOMEN', meaningVi: 'đặc điểm, tính chất', meaningEn: 'characteristic, quality', exampleSentence1: 'Welche Eigenschaften hat er?', exampleTranslation1: 'Anh ấy có đặc điểm gì?', exampleSentence2: 'Das ist eine gute Eigenschaft.', exampleTranslation2: 'Đó là đặc điểm tốt.' },
        { word: 'Charakter', article: 'MASKULIN', plural: 'die Charaktere', wordType: 'NOMEN', meaningVi: 'tính cách, nhân cách', meaningEn: 'character', exampleSentence1: 'Er hat einen guten Charakter.', exampleTranslation1: 'Anh ấy có tính cách tốt.', exampleSentence2: 'Das zeigt seinen Charakter.', exampleTranslation2: 'Điều đó thể hiện tính cách anh ấy.' },
        { word: 'Aussehen', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'ngoại hình', meaningEn: 'appearance', exampleSentence1: 'Das Aussehen ist nicht alles.', exampleTranslation1: 'Ngoại hình không phải tất cả.', exampleSentence2: 'Er achtet auf sein Aussehen.', exampleTranslation2: 'Anh ấy chú ý ngoại hình.' },
        { word: 'Ausweis', article: 'MASKULIN', plural: 'die Ausweise', wordType: 'NOMEN', meaningVi: 'thẻ căn cước', meaningEn: 'ID card', exampleSentence1: 'Zeigen Sie bitte Ihren Ausweis.', exampleTranslation1: 'Xin cho xem thẻ căn cước.', exampleSentence2: 'Mein Ausweis ist abgelaufen.', exampleTranslation2: 'Thẻ căn cước của tôi hết hạn.' },
        { word: 'Reisepass', article: 'MASKULIN', plural: 'die Reisepässe', wordType: 'NOMEN', meaningVi: 'hộ chiếu', meaningEn: 'passport', exampleSentence1: 'Haben Sie Ihren Reisepass?', exampleTranslation1: 'Bạn có hộ chiếu không?', exampleSentence2: 'Der Reisepass ist gültig.', exampleTranslation2: 'Hộ chiếu hợp lệ.' },
        { word: 'Staatsangehörigkeit', article: 'FEMININ', plural: 'die Staatsangehörigkeiten', wordType: 'NOMEN', meaningVi: 'quốc tịch', meaningEn: 'nationality, citizenship', exampleSentence1: 'Welche Staatsangehörigkeit haben Sie?', exampleTranslation1: 'Bạn mang quốc tịch nào?', exampleSentence2: 'Ich habe die deutsche Staatsangehörigkeit.', exampleTranslation2: 'Tôi có quốc tịch Đức.' },
        { word: 'Erfahrung', article: 'FEMININ', plural: 'die Erfahrungen', wordType: 'NOMEN', meaningVi: 'kinh nghiệm', meaningEn: 'experience', exampleSentence1: 'Haben Sie Erfahrung?', exampleTranslation1: 'Bạn có kinh nghiệm không?', exampleSentence2: 'Das war eine gute Erfahrung.', exampleTranslation2: 'Đó là kinh nghiệm tốt.' },
        { word: 'Ziel', article: 'NEUTRUM', plural: 'die Ziele', wordType: 'NOMEN', meaningVi: 'mục tiêu', meaningEn: 'goal, target', exampleSentence1: 'Was ist dein Ziel?', exampleTranslation1: 'Mục tiêu của bạn là gì?', exampleSentence2: 'Ich habe viele Ziele.', exampleTranslation2: 'Tôi có nhiều mục tiêu.' },
        { word: 'Gewohnheit', article: 'FEMININ', plural: 'die Gewohnheiten', wordType: 'NOMEN', meaningVi: 'thói quen', meaningEn: 'habit', exampleSentence1: 'Das ist eine schlechte Gewohnheit.', exampleTranslation1: 'Đó là thói quen xấu.', exampleSentence2: 'Alte Gewohnheiten ändern sich schwer.', exampleTranslation2: 'Thói quen cũ khó thay đổi.' },
        { word: 'beschreiben', wordType: 'VERB', meaningVi: 'mô tả', meaningEn: 'to describe', conjugation: { praesens: { ich: 'beschreibe', du: 'beschreibst', er_sie_es: 'beschreibt', wir: 'beschreiben', ihr: 'beschreibt', sie_Sie: 'beschreiben' }, isIrregular: true, isSeparable: false }, exampleSentence1: 'Beschreiben Sie die Person.', exampleTranslation1: 'Hãy mô tả người đó.', exampleSentence2: 'Kannst du dich beschreiben?', exampleTranslation2: 'Bạn có thể mô tả mình?' },
        { word: 'vorstellen', wordType: 'VERB', meaningVi: 'giới thiệu, tưởng tượng', meaningEn: 'to introduce, to imagine', conjugation: { praesens: { ich: 'stelle vor', du: 'stellst vor', er_sie_es: 'stellt vor', wir: 'stellen vor', ihr: 'stellt vor', sie_Sie: 'stellen vor' }, isIrregular: false, isSeparable: true }, exampleSentence1: 'Darf ich mich vorstellen?', exampleTranslation1: 'Tôi được phép giới thiệu không?', exampleSentence2: 'Stell dir das vor!', exampleTranslation2: 'Tưởng tượng xem!' },
        { word: 'ehrlich', wordType: 'ADJEKTIV', meaningVi: 'trung thực', meaningEn: 'honest', exampleSentence1: 'Er ist sehr ehrlich.', exampleTranslation1: 'Anh ấy rất trung thực.', exampleSentence2: 'Sei ehrlich!', exampleTranslation2: 'Hãy trung thực!' },
        { word: 'freundlich', wordType: 'ADJEKTIV', meaningVi: 'thân thiện', meaningEn: 'friendly', exampleSentence1: 'Sie ist immer freundlich.', exampleTranslation1: 'Cô ấy luôn thân thiện.', exampleSentence2: 'Das war sehr freundlich von Ihnen.', exampleTranslation2: 'Bạn thật thân thiện.' },
        { word: 'geduldig', wordType: 'ADJEKTIV', meaningVi: 'kiên nhẫn', meaningEn: 'patient', exampleSentence1: 'Bitte sei geduldig!', exampleTranslation1: 'Xin hãy kiên nhẫn!', exampleSentence2: 'Er ist sehr geduldig.', exampleTranslation2: 'Anh ấy rất kiên nhẫn.' },
        { word: 'neugierig', wordType: 'ADJEKTIV', meaningVi: 'tò mò', meaningEn: 'curious', exampleSentence1: 'Kinder sind neugierig.', exampleTranslation1: 'Trẻ em hay tò mò.', exampleSentence2: 'Ich bin neugierig.', exampleTranslation2: 'Tôi tò mò.' },
        { word: 'pünktlich', wordType: 'ADJEKTIV', meaningVi: 'đúng giờ', meaningEn: 'punctual', exampleSentence1: 'Bitte kommen Sie pünktlich.', exampleTranslation1: 'Xin đến đúng giờ.', exampleSentence2: 'Der Zug ist pünktlich.', exampleTranslation2: 'Tàu đúng giờ.' },
        { word: 'zuverlässig', wordType: 'ADJEKTIV', meaningVi: 'đáng tin cậy', meaningEn: 'reliable', exampleSentence1: 'Er ist ein zuverlässiger Kollege.', exampleTranslation1: 'Anh ấy là đồng nghiệp đáng tin cậy.', exampleSentence2: 'Das Auto ist zuverlässig.', exampleTranslation2: 'Xe hơi đáng tin cậy.' },
        { word: 'schüchtern', wordType: 'ADJEKTIV', meaningVi: 'nhút nhát', meaningEn: 'shy', exampleSentence1: 'Sie ist ein bisschen schüchtern.', exampleTranslation1: 'Cô ấy hơi nhút nhát.', exampleSentence2: 'Sei nicht schüchtern!', exampleTranslation2: 'Đừng nhút nhát!' },
        { word: 'selbstbewusst', wordType: 'ADJEKTIV', meaningVi: 'tự tin', meaningEn: 'self-confident', exampleSentence1: 'Sie ist sehr selbstbewusst.', exampleTranslation1: 'Cô ấy rất tự tin.', exampleSentence2: 'Sei selbstbewusst!', exampleTranslation2: 'Hãy tự tin!' },
        { word: 'fleißig', wordType: 'ADJEKTIV', meaningVi: 'chăm chỉ', meaningEn: 'hardworking, diligent', exampleSentence1: 'Sie ist eine fleißige Schülerin.', exampleTranslation1: 'Cô ấy là học sinh chăm chỉ.', exampleSentence2: 'Er arbeitet fleißig.', exampleTranslation2: 'Anh ấy làm việc chăm chỉ.' },
        { word: 'faul', wordType: 'ADJEKTIV', meaningVi: 'lười biếng', meaningEn: 'lazy', exampleSentence1: 'Sei nicht so faul!', exampleTranslation1: 'Đừng lười biếng thế!', exampleSentence2: 'Der faule Hund schläft.', exampleTranslation2: 'Con chó lười ngủ.' },
        { word: 'mutig', wordType: 'ADJEKTIV', meaningVi: 'dũng cảm', meaningEn: 'brave, courageous', exampleSentence1: 'Das war sehr mutig.', exampleTranslation1: 'Điều đó rất dũng cảm.', exampleSentence2: 'Sei mutig!', exampleTranslation2: 'Hãy dũng cảm!' },
        { word: 'stolz', wordType: 'ADJEKTIV', meaningVi: 'tự hào', meaningEn: 'proud', exampleSentence1: 'Ich bin stolz auf dich.', exampleTranslation1: 'Tôi tự hào về bạn.', exampleSentence2: 'Er ist stolz auf seine Arbeit.', exampleTranslation2: 'Anh ấy tự hào về công việc.' },
        { word: 'Stärke', article: 'FEMININ', plural: 'die Stärken', wordType: 'NOMEN', meaningVi: 'điểm mạnh, sức mạnh', meaningEn: 'strength', exampleSentence1: 'Was sind Ihre Stärken?', exampleTranslation1: 'Điểm mạnh của bạn là gì?', exampleSentence2: 'Geduld ist meine Stärke.', exampleTranslation2: 'Kiên nhẫn là điểm mạnh của tôi.' },
        { word: 'Schwäche', article: 'FEMININ', plural: 'die Schwächen', wordType: 'NOMEN', meaningVi: 'điểm yếu', meaningEn: 'weakness', exampleSentence1: 'Jeder hat Schwächen.', exampleTranslation1: 'Ai cũng có điểm yếu.', exampleSentence2: 'Was sind Ihre Schwächen?', exampleTranslation2: 'Điểm yếu của bạn là gì?' },
        { word: 'Verhalten', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'hành vi, cách ứng xử', meaningEn: 'behavior', exampleSentence1: 'Sein Verhalten war schlecht.', exampleTranslation1: 'Hành vi của anh ấy không tốt.', exampleSentence2: 'Das ist normales Verhalten.', exampleTranslation2: 'Đó là hành vi bình thường.' },
        { word: 'sich verhalten', wordType: 'VERB', meaningVi: 'cư xử', meaningEn: 'to behave', conjugation: { praesens: { ich: 'verhalte mich', du: 'verhältst dich', er_sie_es: 'verhält sich', wir: 'verhalten uns', ihr: 'verhaltet euch', sie_Sie: 'verhalten sich' }, isIrregular: true, isSeparable: false }, exampleSentence1: 'Wie soll ich mich verhalten?', exampleTranslation1: 'Tôi nên cư xử thế nào?', exampleSentence2: 'Er verhält sich komisch.', exampleTranslation2: 'Anh ấy cư xử kỳ lạ.' },
        { word: 'Humor', article: 'MASKULIN', plural: '-', wordType: 'NOMEN', meaningVi: 'hài hước', meaningEn: 'humor', exampleSentence1: 'Er hat Humor.', exampleTranslation1: 'Anh ấy có khiếu hài hước.', exampleSentence2: 'Das braucht Humor.', exampleTranslation2: 'Cần có sự hài hước.' },
        { word: 'Laune', article: 'FEMININ', plural: 'die Launen', wordType: 'NOMEN', meaningVi: 'tâm trạng', meaningEn: 'mood', exampleSentence1: 'Er hat gute Laune.', exampleTranslation1: 'Anh ấy có tâm trạng tốt.', exampleSentence2: 'Heute habe ich schlechte Laune.', exampleTranslation2: 'Hôm nay tâm trạng tôi không tốt.' },
    ])

    // Due to length, I'll continue generating remaining themes...
    // For now, let me notify the user about progress and continue in a follow-up script

    console.log(`\n📊 Total so far: ${total} words`)
    console.log('📊 Target: ~800 words across 20 themes')
}

main()
