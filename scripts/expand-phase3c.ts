/**
 * Phase 3c: Final batch to reach 650+ words
 * High-frequency A1 verbs, adjectives, adverbs, prepositions
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const expansions: Record<string, any[]> = {
    // ─── Verbs spread across themes ───
    '01-person.json': [
        { word: 'kennenlernen', wordType: 'VERB', meaningVi: 'làm quen', meaningEn: 'to get to know', conjugation: { praesens: { ich: 'lerne kennen', du: 'lernst kennen', er_sie_es: 'lernt kennen', wir: 'lernen kennen', ihr: 'lernt kennen', sie_Sie: 'lernen kennen' }, isIrregular: false, isSeparable: true }, exampleSentence1: 'Ich möchte dich kennenlernen.', exampleTranslation1: 'Tôi muốn làm quen bạn.', exampleSentence2: 'Wo hast du ihn kennengelernt?', exampleTranslation2: 'Bạn quen anh ấy ở đâu?', notes: 'Trennbar: Ich lerne sie kennen.' },
    ],

    '04-wohnen.json': [
        { word: 'Balkon', article: 'MASKULIN', plural: 'die Balkone', wordType: 'NOMEN', meaningVi: 'ban công', meaningEn: 'balcony', exampleSentence1: 'Die Wohnung hat einen Balkon.', exampleTranslation1: 'Căn hộ có ban công.', exampleSentence2: 'Ich sitze auf dem Balkon.', exampleTranslation2: 'Tôi ngồi trên ban công.' },
        { word: 'Garage', article: 'FEMININ', plural: 'die Garagen', wordType: 'NOMEN', meaningVi: 'nhà để xe', meaningEn: 'garage', exampleSentence1: 'Das Auto ist in der Garage.', exampleTranslation1: 'Xe ở trong nhà để xe.', exampleSentence2: 'Wir haben eine Garage.', exampleTranslation2: 'Chúng tôi có nhà để xe.' },
        { word: 'Terrasse', article: 'FEMININ', plural: 'die Terrassen', wordType: 'NOMEN', meaningVi: 'sân thượng', meaningEn: 'terrace, patio', exampleSentence1: 'Wir sitzen auf der Terrasse.', exampleTranslation1: 'Chúng tôi ngồi trên sân thượng.', exampleSentence2: 'Die Terrasse ist sonnig.', exampleTranslation2: 'Sân thượng có nắng.' },
    ],

    '06-essen-trinken.json': [
        { word: 'bestellen', wordType: 'VERB', meaningVi: 'gọi (món), đặt hàng', meaningEn: 'to order', conjugation: { praesens: { ich: 'bestelle', du: 'bestellst', er_sie_es: 'bestellt', wir: 'bestellen', ihr: 'bestellt', sie_Sie: 'bestellen' }, isIrregular: false, isSeparable: false }, exampleSentence1: 'Ich möchte bestellen.', exampleTranslation1: 'Tôi muốn gọi món.', exampleSentence2: 'Was möchten Sie bestellen?', exampleTranslation2: 'Bạn muốn gọi gì?' },
        { word: 'Frühstück', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'bữa sáng', meaningEn: 'breakfast', exampleSentence1: 'Das Frühstück ist fertig.', exampleTranslation1: 'Bữa sáng xong rồi.', exampleSentence2: 'Was essen Sie zum Frühstück?', exampleTranslation2: 'Bạn ăn gì cho bữa sáng?' },
        { word: 'Mittagessen', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'bữa trưa', meaningEn: 'lunch', exampleSentence1: 'Das Mittagessen ist um zwölf.', exampleTranslation1: 'Bữa trưa lúc 12 giờ.', exampleSentence2: 'Was gibt es zum Mittagessen?', exampleTranslation2: 'Bữa trưa có gì?' },
        { word: 'Abendessen', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'bữa tối', meaningEn: 'dinner', exampleSentence1: 'Das Abendessen ist um sieben.', exampleTranslation1: 'Bữa tối lúc bảy giờ.', exampleSentence2: 'Wir kochen Abendessen.', exampleTranslation2: 'Chúng tôi nấu bữa tối.' },
    ],

    '07-einkaufen.json': [
        { word: 'T-Shirt', article: 'NEUTRUM', plural: 'die T-Shirts', wordType: 'NOMEN', meaningVi: 'áo phông', meaningEn: 'T-shirt', exampleSentence1: 'Das T-Shirt ist blau.', exampleTranslation1: 'Áo phông màu xanh.', exampleSentence2: 'Ich trage ein T-Shirt.', exampleTranslation2: 'Tôi mặc áo phông.' },
        { word: 'Rock', article: 'MASKULIN', plural: 'die Röcke', wordType: 'NOMEN', meaningVi: 'váy ngắn', meaningEn: 'skirt', exampleSentence1: 'Der Rock ist kurz.', exampleTranslation1: 'Váy ngắn.', exampleSentence2: 'Sie trägt einen roten Rock.', exampleTranslation2: 'Cô ấy mặc váy đỏ.' },
        { word: 'Mütze', article: 'FEMININ', plural: 'die Mützen', wordType: 'NOMEN', meaningVi: 'mũ len', meaningEn: 'cap, beanie', exampleSentence1: 'Die Mütze ist warm.', exampleTranslation1: 'Mũ ấm.', exampleSentence2: 'Im Winter trage ich eine Mütze.', exampleTranslation2: 'Mùa đông tôi đội mũ.' },
        { word: 'Brille', article: 'FEMININ', plural: 'die Brillen', wordType: 'NOMEN', meaningVi: 'kính', meaningEn: 'glasses', exampleSentence1: 'Ich trage eine Brille.', exampleTranslation1: 'Tôi đeo kính.', exampleSentence2: 'Wo ist meine Brille?', exampleTranslation2: 'Kính của tôi ở đâu?' },
    ],

    '08-dienstleistungen.json': [
        { word: 'Briefkasten', article: 'MASKULIN', plural: 'die Briefkästen', wordType: 'NOMEN', meaningVi: 'hòm thư', meaningEn: 'mailbox', exampleSentence1: 'Der Brief ist im Briefkasten.', exampleTranslation1: 'Thư ở trong hòm thư.', exampleSentence2: 'Wo ist der Briefkasten?', exampleTranslation2: 'Hòm thư ở đâu?' },
        { word: 'Paket', article: 'NEUTRUM', plural: 'die Pakete', wordType: 'NOMEN', meaningVi: 'gói hàng, bưu kiện', meaningEn: 'package, parcel', exampleSentence1: 'Ich habe ein Paket bekommen.', exampleTranslation1: 'Tôi nhận được bưu kiện.', exampleSentence2: 'Das Paket ist groß.', exampleTranslation2: 'Gói hàng to.' },
        { word: 'Briefmarke', article: 'FEMININ', plural: 'die Briefmarken', wordType: 'NOMEN', meaningVi: 'tem thư', meaningEn: 'postage stamp', exampleSentence1: 'Ich brauche eine Briefmarke.', exampleTranslation1: 'Tôi cần tem thư.', exampleSentence2: 'Die Briefmarke kostet 80 Cent.', exampleTranslation2: 'Tem thư giá 80 cent.' },
    ],

    '10-arbeit-beruf.json': [
        { word: 'Lebenslauf', article: 'MASKULIN', plural: 'die Lebensläufe', wordType: 'NOMEN', meaningVi: 'sơ yếu lý lịch', meaningEn: 'CV, resume', exampleSentence1: 'Schicken Sie Ihren Lebenslauf.', exampleTranslation1: 'Gửi sơ yếu lý lịch.', exampleSentence2: 'Der Lebenslauf ist fertig.', exampleTranslation2: 'Sơ yếu lý lịch xong rồi.' },
    ],

    '11-freizeit.json': [
        { word: 'Ferien', plural: 'die Ferien', wordType: 'NOMEN', meaningVi: 'kỳ nghỉ (học)', meaningEn: 'holidays, school vacation', exampleSentence1: 'Die Ferien beginnen morgen.', exampleTranslation1: 'Kỳ nghỉ bắt đầu ngày mai.', exampleSentence2: 'In den Ferien fahre ich nach Hause.', exampleTranslation2: 'Trong kỳ nghỉ tôi về nhà.' },
        { word: 'Geburtstag', article: 'MASKULIN', plural: 'die Geburtstage', wordType: 'NOMEN', meaningVi: 'sinh nhật', meaningEn: 'birthday', exampleSentence1: 'Herzlichen Glückwunsch zum Geburtstag!', exampleTranslation1: 'Chúc mừng sinh nhật!', exampleSentence2: 'Mein Geburtstag ist im Mai.', exampleTranslation2: 'Sinh nhật tôi vào tháng 5.' },
    ],

    '13-reisen-verkehr.json': [
        { word: 'Flughafen', article: 'MASKULIN', plural: 'die Flughäfen', wordType: 'NOMEN', meaningVi: 'sân bay', meaningEn: 'airport', exampleSentence1: 'Wie komme ich zum Flughafen?', exampleTranslation1: 'Làm sao đến sân bay?', exampleSentence2: 'Der Flughafen ist weit.', exampleTranslation2: 'Sân bay xa.' },
    ],

    '14-zeitangaben.json': [
        { word: 'FeierTag', article: 'MASKULIN', plural: 'die Feiertage', wordType: 'NOMEN', meaningVi: 'ngày lễ', meaningEn: 'holiday, public holiday', exampleSentence1: 'Morgen ist ein Feiertag.', exampleTranslation1: 'Ngày mai là ngày lễ.', exampleSentence2: 'Am Feiertag arbeite ich nicht.', exampleTranslation2: 'Ngày lễ tôi không làm việc.' },
        { word: 'Geburtstag', article: 'MASKULIN', plural: 'die Geburtstage', wordType: 'NOMEN', meaningVi: 'sinh nhật', meaningEn: 'birthday', exampleSentence1: 'Wann hast du Geburtstag?', exampleTranslation1: 'Sinh nhật bạn khi nào?', exampleSentence2: 'Heute ist mein Geburtstag.', exampleTranslation2: 'Hôm nay là sinh nhật tôi.' },
        { word: 'Termin', article: 'MASKULIN', plural: 'die Termine', wordType: 'NOMEN', meaningVi: 'cuộc hẹn', meaningEn: 'appointment', exampleSentence1: 'Haben Sie einen Termin?', exampleTranslation1: 'Bạn có cuộc hẹn không?', exampleSentence2: 'Mein Termin ist um 10 Uhr.', exampleTranslation2: 'Cuộc hẹn của tôi lúc 10 giờ.' },
    ],

    '17-laender-nationalitaeten.json': [
        { word: 'Afrika', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'châu Phi', meaningEn: 'Africa', exampleSentence1: 'Ägypten ist in Afrika.', exampleTranslation1: 'Ai Cập ở châu Phi.', exampleSentence2: 'Afrika ist groß.', exampleTranslation2: 'Châu Phi lớn.' },
        { word: 'Amerika', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'châu Mỹ', meaningEn: 'America', exampleSentence1: 'Er kommt aus Amerika.', exampleTranslation1: 'Anh ấy đến từ châu Mỹ.', exampleSentence2: 'Amerika ist weit.', exampleTranslation2: 'Châu Mỹ xa.' },
    ],
}

function main() {
    console.log('Phase 3c: Final push to 650+\n')
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
