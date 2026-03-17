/**
 * Phase 3b: Final push to reach 650+ words
 * Essential high-frequency A1 verbs, adjectives, adverbs, prepositions
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const expansions: Record<string, any[]> = {
    // ─── Person +5 (45→50) — essential pronouns/adjectives ───
    '01-person.json': [
        { word: 'geschieden', wordType: 'ADJEKTIV', meaningVi: 'đã ly hôn', meaningEn: 'divorced', exampleSentence1: 'Er ist geschieden.', exampleTranslation1: 'Anh ấy đã ly hôn.', exampleSentence2: 'Sind Sie geschieden?', exampleTranslation2: 'Anh/chị đã ly hôn chưa?' },
        { word: 'Geburtsdatum', article: 'NEUTRUM', plural: 'die Geburtsdaten', wordType: 'NOMEN', meaningVi: 'ngày sinh', meaningEn: 'date of birth', exampleSentence1: 'Wie ist Ihr Geburtsdatum?', exampleTranslation1: 'Ngày sinh của bạn?', exampleSentence2: 'Mein Geburtsdatum ist der 5.3.1990.', exampleTranslation2: 'Ngày sinh của tôi là 5.3.1990.' },
        { word: 'Geburtsort', article: 'MASKULIN', plural: 'die Geburtsorte', wordType: 'NOMEN', meaningVi: 'nơi sinh', meaningEn: 'place of birth', exampleSentence1: 'Wie ist Ihr Geburtsort?', exampleTranslation1: 'Nơi sinh của bạn?', exampleSentence2: 'Mein Geburtsort ist Hanoi.', exampleTranslation2: 'Nơi sinh của tôi là Hà Nội.' },
        { word: 'Unterschied', article: 'MASKULIN', plural: 'die Unterschiede', wordType: 'NOMEN', meaningVi: 'sự khác biệt', meaningEn: 'difference', exampleSentence1: 'Was ist der Unterschied?', exampleTranslation1: 'Sự khác biệt là gì?', exampleSentence2: 'Es gibt keinen Unterschied.', exampleTranslation2: 'Không có sự khác biệt.' },
        { word: 'nett', wordType: 'ADJEKTIV', meaningVi: 'tốt bụng, dễ thương', meaningEn: 'nice, kind', exampleSentence1: 'Sie ist sehr nett.', exampleTranslation1: 'Cô ấy rất tốt bụng.', exampleSentence2: 'Nett, Sie kennenzulernen!', exampleTranslation2: 'Rất vui được biết bạn!' },
    ],

    // ─── Familie +4 (31→35) ───
    '02-familie-freunde.json': [
        { word: 'Hochzeit', article: 'FEMININ', plural: 'die Hochzeiten', wordType: 'NOMEN', meaningVi: 'đám cưới', meaningEn: 'wedding', exampleSentence1: 'Die Hochzeit ist im Mai.', exampleTranslation1: 'Đám cưới vào tháng 5.', exampleSentence2: 'Ich gehe zur Hochzeit.', exampleTranslation2: 'Tôi đi dự đám cưới.' },
        { word: 'heiraten', wordType: 'VERB', meaningVi: 'kết hôn', meaningEn: 'to marry', conjugation: { praesens: { ich: 'heirate', du: 'heiratest', er_sie_es: 'heiratet', wir: 'heiraten', ihr: 'heiratet', sie_Sie: 'heiraten' }, isIrregular: false, isSeparable: false }, exampleSentence1: 'Wir heiraten nächstes Jahr.', exampleTranslation1: 'Chúng tôi kết hôn năm tới.', exampleSentence2: 'Wann heiratet ihr?', exampleTranslation2: 'Khi nào các bạn kết hôn?' },
        { word: 'lieben', wordType: 'VERB', meaningVi: 'yêu', meaningEn: 'to love', conjugation: { praesens: { ich: 'liebe', du: 'liebst', er_sie_es: 'liebt', wir: 'lieben', ihr: 'liebt', sie_Sie: 'lieben' }, isIrregular: false, isSeparable: false }, exampleSentence1: 'Ich liebe dich.', exampleTranslation1: 'Anh yêu em.', exampleSentence2: 'Sie lieben ihre Kinder.', exampleTranslation2: 'Họ yêu con cái.' },
        { word: 'kennen', wordType: 'VERB', meaningVi: 'biết, quen', meaningEn: 'to know (person/place)', conjugation: { praesens: { ich: 'kenne', du: 'kennst', er_sie_es: 'kennt', wir: 'kennen', ihr: 'kennt', sie_Sie: 'kennen' }, isIrregular: false, isSeparable: false }, exampleSentence1: 'Kennen Sie Herrn Müller?', exampleTranslation1: 'Bạn biết ông Müller không?', exampleSentence2: 'Ich kenne Berlin.', exampleTranslation2: 'Tôi biết Berlin.' },
    ],

    // ─── Körper +2 (33→35) ───
    '03-koerper-gesundheit.json': [
        { word: 'Apotheke', article: 'FEMININ', plural: 'die Apotheken', wordType: 'NOMEN', meaningVi: 'nhà thuốc', meaningEn: 'pharmacy', exampleSentence1: 'Wo ist die Apotheke?', exampleTranslation1: 'Nhà thuốc ở đâu?', exampleSentence2: 'Ich gehe in die Apotheke.', exampleTranslation2: 'Tôi đi nhà thuốc.' },
        { word: 'Unfall', article: 'MASKULIN', plural: 'die Unfälle', wordType: 'NOMEN', meaningVi: 'tai nạn', meaningEn: 'accident', exampleSentence1: 'Er hatte einen Unfall.', exampleTranslation1: 'Anh ấy gặp tai nạn.', exampleSentence2: 'Rufen Sie die Polizei, es gab einen Unfall!', exampleTranslation2: 'Gọi cảnh sát, có tai nạn!' },
    ],

    // ─── Wohnen +2 (38→40) ───
    '04-wohnen.json': [
        { word: 'Treppe', article: 'FEMININ', plural: 'die Treppen', wordType: 'NOMEN', meaningVi: 'cầu thang', meaningEn: 'stairs', exampleSentence1: 'Die Treppe ist links.', exampleTranslation1: 'Cầu thang bên trái.', exampleSentence2: 'Ich gehe die Treppe hoch.', exampleTranslation2: 'Tôi đi lên cầu thang.' },
        { word: 'Aufzug', article: 'MASKULIN', plural: 'die Aufzüge', wordType: 'NOMEN', meaningVi: 'thang máy', meaningEn: 'elevator, lift', exampleSentence1: 'Gibt es einen Aufzug?', exampleTranslation1: 'Có thang máy không?', exampleSentence2: 'Der Aufzug ist kaputt.', exampleTranslation2: 'Thang máy hỏng.' },
    ],

    // ─── Umwelt +2 (28→30) ───
    '05-umwelt.json': [
        { word: 'Himmel', article: 'MASKULIN', plural: '-', wordType: 'NOMEN', meaningVi: 'bầu trời', meaningEn: 'sky', exampleSentence1: 'Der Himmel ist blau.', exampleTranslation1: 'Bầu trời xanh.', exampleSentence2: 'Heute ist der Himmel grau.', exampleTranslation2: 'Hôm nay bầu trời xám.' },
        { word: 'Erde', article: 'FEMININ', plural: '-', wordType: 'NOMEN', meaningVi: 'trái đất, đất', meaningEn: 'earth', exampleSentence1: 'Die Erde ist rund.', exampleTranslation1: 'Trái đất tròn.', exampleSentence2: 'Die Blumen wachsen in der Erde.', exampleTranslation2: 'Hoa mọc trong đất.' },
    ],

    // ─── Einkaufen +1 (29→30) ───
    '07-einkaufen.json': [
        { word: 'Mantel', article: 'MASKULIN', plural: 'die Mäntel', wordType: 'NOMEN', meaningVi: 'áo khoác dài', meaningEn: 'coat', exampleSentence1: 'Der Mantel ist warm.', exampleTranslation1: 'Áo khoác ấm.', exampleSentence2: 'Im Winter trage ich einen Mantel.', exampleTranslation2: 'Mùa đông tôi mặc áo khoác dài.' },
    ],

    // ─── Ausbildung +2 (33→35) ───
    '09-ausbildung-lernen.json': [
        { word: 'Fehler', article: 'MASKULIN', plural: 'die Fehler', wordType: 'NOMEN', meaningVi: 'lỗi, sai lầm', meaningEn: 'mistake, error', exampleSentence1: 'Ich habe einen Fehler gemacht.', exampleTranslation1: 'Tôi mắc lỗi.', exampleSentence2: 'Der Text hat viele Fehler.', exampleTranslation2: 'Bài có nhiều lỗi.' },
        { word: 'Ergebnis', article: 'NEUTRUM', plural: 'die Ergebnisse', wordType: 'NOMEN', meaningVi: 'kết quả', meaningEn: 'result', exampleSentence1: 'Das Ergebnis ist gut.', exampleTranslation1: 'Kết quả tốt.', exampleSentence2: 'Wann kommt das Ergebnis?', exampleTranslation2: 'Kết quả khi nào?' },
    ],

    // ─── Arbeit +3 (27→30) ───
    '10-arbeit-beruf.json': [
        { word: 'Büro', article: 'NEUTRUM', plural: 'die Büros', wordType: 'NOMEN', meaningVi: 'văn phòng', meaningEn: 'office', exampleSentence1: 'Ich arbeite im Büro.', exampleTranslation1: 'Tôi làm việc ở văn phòng.', exampleSentence2: 'Das Büro ist groß.', exampleTranslation2: 'Văn phòng lớn.' },
        { word: 'Drucker', article: 'MASKULIN', plural: 'die Drucker', wordType: 'NOMEN', meaningVi: 'máy in', meaningEn: 'printer', exampleSentence1: 'Der Drucker ist kaputt.', exampleTranslation1: 'Máy in hỏng.', exampleSentence2: 'Wo ist der Drucker?', exampleTranslation2: 'Máy in ở đâu?' },
        { word: 'Besprechung', article: 'FEMININ', plural: 'die Besprechungen', wordType: 'NOMEN', meaningVi: 'cuộc họp', meaningEn: 'meeting, discussion', exampleSentence1: 'Die Besprechung ist um zehn.', exampleTranslation1: 'Cuộc họp lúc mười giờ.', exampleSentence2: 'Wir haben eine Besprechung.', exampleTranslation2: 'Chúng tôi có một cuộc họp.' },
    ],

    // ─── Freizeit +2 (38→40) ───
    '11-freizeit.json': [
        { word: 'Kino', article: 'NEUTRUM', plural: 'die Kinos', wordType: 'NOMEN', meaningVi: 'rạp chiếu phim', meaningEn: 'cinema', exampleSentence1: 'Gehen wir ins Kino?', exampleTranslation1: 'Mình đi xem phim không?', exampleSentence2: 'Das Kino ist groß.', exampleTranslation2: 'Rạp chiếu phim lớn.' },
        { word: 'Theater', article: 'NEUTRUM', plural: 'die Theater', wordType: 'NOMEN', meaningVi: 'nhà hát', meaningEn: 'theater', exampleSentence1: 'Wir gehen ins Theater.', exampleTranslation1: 'Chúng tôi đi xem kịch.', exampleSentence2: 'Das Theater ist alt.', exampleTranslation2: 'Nhà hát cũ.' },
    ],

    // ─── Kommunikation +1 (24→25) ───
    '12-kommunikation.json': [
        { word: 'wiederholen', wordType: 'VERB', meaningVi: 'nhắc lại, ôn tập', meaningEn: 'to repeat, to review', conjugation: { praesens: { ich: 'wiederhole', du: 'wiederholst', er_sie_es: 'wiederholt', wir: 'wiederholen', ihr: 'wiederholt', sie_Sie: 'wiederholen' }, isIrregular: false, isSeparable: false }, exampleSentence1: 'Können Sie das bitte wiederholen?', exampleTranslation1: 'Bạn có thể nhắc lại không?', exampleSentence2: 'Wir wiederholen die Übung.', exampleTranslation2: 'Chúng tôi ôn lại bài tập.' },
    ],

    // ─── Reisen +4 (36→40) ───
    '13-reisen-verkehr.json': [
        { word: 'Hotel', article: 'NEUTRUM', plural: 'die Hotels', wordType: 'NOMEN', meaningVi: 'khách sạn', meaningEn: 'hotel', exampleSentence1: 'Ich suche ein Hotel.', exampleTranslation1: 'Tôi tìm khách sạn.', exampleSentence2: 'Das Hotel ist teuer.', exampleTranslation2: 'Khách sạn đắt.' },
        { word: 'Zimmer', article: 'NEUTRUM', plural: 'die Zimmer', wordType: 'NOMEN', meaningVi: 'phòng', meaningEn: 'room', exampleSentence1: 'Ich möchte ein Zimmer reservieren.', exampleTranslation1: 'Tôi muốn đặt phòng.', exampleSentence2: 'Das Zimmer ist groß.', exampleTranslation2: 'Phòng rộng.' },
        { word: 'Führerschein', article: 'MASKULIN', plural: 'die Führerscheine', wordType: 'NOMEN', meaningVi: 'bằng lái xe', meaningEn: 'driver\'s license', exampleSentence1: 'Haben Sie einen Führerschein?', exampleTranslation1: 'Bạn có bằng lái xe không?', exampleSentence2: 'Ich brauche einen Führerschein.', exampleTranslation2: 'Tôi cần bằng lái xe.' },
        { word: 'Stau', article: 'MASKULIN', plural: 'die Staus', wordType: 'NOMEN', meaningVi: 'tắc đường', meaningEn: 'traffic jam', exampleSentence1: 'Auf der Autobahn ist Stau.', exampleTranslation1: 'Trên cao tốc bị tắc.', exampleSentence2: 'Der Stau ist lang.', exampleTranslation2: 'Tắc đường dài.' },
    ],

    // ─── Berufe +3 (22→25) ───
    '18-berufe.json': [
        { word: 'Architekt', article: 'MASKULIN', plural: 'die Architekten', wordType: 'NOMEN', meaningVi: 'kiến trúc sư (nam)', meaningEn: 'architect (male)', exampleSentence1: 'Er ist Architekt.', exampleTranslation1: 'Anh ấy là kiến trúc sư.', exampleSentence2: 'Der Architekt plant das Haus.', exampleTranslation2: 'Kiến trúc sư thiết kế nhà.' },
        { word: 'Mechaniker', article: 'MASKULIN', plural: 'die Mechaniker', wordType: 'NOMEN', meaningVi: 'thợ máy (nam)', meaningEn: 'mechanic (male)', exampleSentence1: 'Der Mechaniker repariert das Auto.', exampleTranslation1: 'Thợ máy sửa xe.', exampleSentence2: 'Ich brauche einen Mechaniker.', exampleTranslation2: 'Tôi cần thợ máy.' },
        { word: 'Rentner', article: 'MASKULIN', plural: 'die Rentner', wordType: 'NOMEN', meaningVi: 'người nghỉ hưu (nam)', meaningEn: 'retiree (male)', exampleSentence1: 'Mein Opa ist Rentner.', exampleTranslation1: 'Ông tôi đã nghỉ hưu.', exampleSentence2: 'Er ist seit fünf Jahren Rentner.', exampleTranslation2: 'Ông ấy đã nghỉ hưu năm năm.' },
    ],

    // ─── Farben +1 (15→16) — bonus matching word ───
    '16-farben.json': [
        { word: 'lila', wordType: 'ADJEKTIV', meaningVi: 'tím', meaningEn: 'purple', exampleSentence1: 'Die Blume ist lila.', exampleTranslation1: 'Bông hoa màu tím.', exampleSentence2: 'Ich mag die Farbe Lila.', exampleTranslation2: 'Tôi thích màu tím.', notes: 'Wie "rosa" — wird nicht dekliniert.' },
    ],

    // ─── Länder +4 (26→30) — more languages ───
    '17-laender-nationalitaeten.json': [
        { word: 'Indien', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'Ấn Độ', meaningEn: 'India', exampleSentence1: 'Indien ist groß.', exampleTranslation1: 'Ấn Độ lớn.', exampleSentence2: 'Er kommt aus Indien.', exampleTranslation2: 'Anh ấy đến từ Ấn Độ.' },
        { word: 'Ägypten', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'Ai Cập', meaningEn: 'Egypt', exampleSentence1: 'Ägypten hat die Pyramiden.', exampleTranslation1: 'Ai Cập có kim tự tháp.', exampleSentence2: 'Ich war in Ägypten.', exampleTranslation2: 'Tôi đã ở Ai Cập.' },
        { word: 'arabisch', wordType: 'ADJEKTIV', meaningVi: 'tiếng Ả Rập, Ả Rập (adj.)', meaningEn: 'Arabic', exampleSentence1: 'Er spricht Arabisch.', exampleTranslation1: 'Anh ấy nói tiếng Ả Rập.', exampleSentence2: 'Arabisches Essen ist lecker.', exampleTranslation2: 'Đồ ăn Ả Rập ngon.' },
        { word: 'spanisch', wordType: 'ADJEKTIV', meaningVi: 'tiếng Tây Ban Nha, Tây Ban Nha (adj.)', meaningEn: 'Spanish', exampleSentence1: 'Ich lerne Spanisch.', exampleTranslation1: 'Tôi học tiếng Tây Ban Nha.', exampleSentence2: 'Spanischer Wein ist gut.', exampleTranslation2: 'Rượu vang Tây Ban Nha ngon.' },
    ],
}

function main() {
    console.log('Phase 3b: Final push to 650+\n')
    let totalAdded = 0

    for (const [filename, newWords] of Object.entries(expansions)) {
        const filePath = path.join('content', 'a1', 'vocabulary', filename)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))
        const existingWords = new Set(data.words.map((w: any) => w.word.toLowerCase()))
        const toAdd: any[] = []

        for (const w of newWords) {
            if (!existingWords.has(w.word.toLowerCase())) {
                toAdd.push(w)
            } else {
                console.log(`  ⏭️  ${w.word} exists in ${filename}`)
            }
        }

        if (toAdd.length > 0) {
            data.words.push(...toAdd)
            writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8')
            console.log(`  ✅ ${filename}: +${toAdd.length} (${data.words.length} total)`)
        }
        totalAdded += toAdd.length
    }

    console.log(`\n📊 Total added: ${totalAdded}`)

    const fs = require('fs')
    const dir = 'content/a1/vocabulary'
    const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.json')).sort()
    let grand = 0
    for (const f of files) {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
        grand += d.words.length
    }
    console.log(`📊 Grand total: ${grand} words`)
    console.log(`📊 Target: 650+ → ${grand >= 650 ? '✅ PASSED' : '⚠️ Need ' + (650 - grand) + ' more'}`)
}

main()
