/**
 * Phase 3: Final expansion to reach 650+ words
 * Adds ~120 essential Goethe A1 Wortliste words across existing themes
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

interface Word {
    word: string
    article?: string
    plural?: string
    wordType: string
    meaningVi: string
    meaningEn: string
    conjugation?: any
    exampleSentence1: string
    exampleTranslation1: string
    exampleSentence2: string
    exampleTranslation2: string
    notes?: string
}

const expansions: Record<string, Word[]> = {
    // ─── Person +5 (40→45) — high-frequency A1 words ───
    '01-person.json': [
        { word: 'Leute', plural: 'die Leute', wordType: 'NOMEN', meaningVi: 'mọi người', meaningEn: 'people', exampleSentence1: 'Viele Leute lernen Deutsch.', exampleTranslation1: 'Nhiều người học tiếng Đức.', exampleSentence2: 'Die Leute sind nett.', exampleTranslation2: 'Mọi người tốt bụng.' },
        { word: 'Person', article: 'FEMININ', plural: 'die Personen', wordType: 'NOMEN', meaningVi: 'người', meaningEn: 'person', exampleSentence1: 'Zwei Personen, bitte.', exampleTranslation1: 'Hai người, xin vui lòng.', exampleSentence2: 'Pro Person kostet es zehn Euro.', exampleTranslation2: 'Mỗi người mười Euro.' },
        { word: 'Familienstand', article: 'MASKULIN', plural: '-', wordType: 'NOMEN', meaningVi: 'tình trạng hôn nhân', meaningEn: 'marital status', exampleSentence1: 'Wie ist Ihr Familienstand?', exampleTranslation1: 'Tình trạng hôn nhân của anh/chị?', exampleSentence2: 'Familienstand: ledig.', exampleTranslation2: 'Tình trạng hôn nhân: độc thân.' },
        { word: 'ledig', wordType: 'ADJEKTIV', meaningVi: 'độc thân', meaningEn: 'single, unmarried', exampleSentence1: 'Ich bin ledig.', exampleTranslation1: 'Tôi độc thân.', exampleSentence2: 'Sind Sie ledig oder verheiratet?', exampleTranslation2: 'Anh/chị độc thân hay đã kết hôn?' },
        { word: 'verheiratet', wordType: 'ADJEKTIV', meaningVi: 'đã kết hôn', meaningEn: 'married', exampleSentence1: 'Ich bin verheiratet.', exampleTranslation1: 'Tôi đã kết hôn.', exampleSentence2: 'Seit wann sind Sie verheiratet?', exampleTranslation2: 'Anh/chị kết hôn từ khi nào?' },
    ],

    // ─── Familie +6 (30→36) ───
    '02-familie-freunde.json': [
        { word: 'Eltern', plural: 'die Eltern', wordType: 'NOMEN', meaningVi: 'bố mẹ', meaningEn: 'parents', exampleSentence1: 'Meine Eltern wohnen in Vietnam.', exampleTranslation1: 'Bố mẹ tôi sống ở Việt Nam.', exampleSentence2: 'Ich besuche meine Eltern.', exampleTranslation2: 'Tôi thăm bố mẹ.' },
        { word: 'Nachbar', article: 'MASKULIN', plural: 'die Nachbarn', wordType: 'NOMEN', meaningVi: 'hàng xóm (nam)', meaningEn: 'neighbor (male)', exampleSentence1: 'Mein Nachbar ist nett.', exampleTranslation1: 'Hàng xóm tôi tốt bụng.', exampleSentence2: 'Ich kenne meinen Nachbarn.', exampleTranslation2: 'Tôi biết hàng xóm của tôi.' },
        { word: 'Nachbarin', article: 'FEMININ', plural: 'die Nachbarinnen', wordType: 'NOMEN', meaningVi: 'hàng xóm (nữ)', meaningEn: 'neighbor (female)', exampleSentence1: 'Die Nachbarin hilft mir.', exampleTranslation1: 'Hàng xóm giúp tôi.', exampleSentence2: 'Meine Nachbarin kommt aus der Türkei.', exampleTranslation2: 'Hàng xóm tôi đến từ Thổ Nhĩ Kỳ.' },
        { word: 'Paar', article: 'NEUTRUM', plural: 'die Paare', wordType: 'NOMEN', meaningVi: 'cặp đôi', meaningEn: 'couple, pair', exampleSentence1: 'Das Paar tanzt zusammen.', exampleTranslation1: 'Cặp đôi nhảy cùng nhau.', exampleSentence2: 'Ein Paar Schuhe, bitte.', exampleTranslation2: 'Một đôi giày, xin vui lòng.' },
        { word: 'zusammen', wordType: 'ADVERB', meaningVi: 'cùng nhau', meaningEn: 'together', exampleSentence1: 'Wir lernen zusammen.', exampleTranslation1: 'Chúng tôi học cùng nhau.', exampleSentence2: 'Zusammen oder getrennt?', exampleTranslation2: 'Cùng nhau hay riêng?' },
        { word: 'allein', wordType: 'ADVERB', meaningVi: 'một mình', meaningEn: 'alone', exampleSentence1: 'Ich lebe allein.', exampleTranslation1: 'Tôi sống một mình.', exampleSentence2: 'Er geht allein ins Kino.', exampleTranslation2: 'Anh ấy đi xem phim một mình.' },
    ],

    // ─── Körper +6 (30→36) ───
    '03-koerper-gesundheit.json': [
        { word: 'Fieber', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'sốt', meaningEn: 'fever', exampleSentence1: 'Ich habe Fieber.', exampleTranslation1: 'Tôi bị sốt.', exampleSentence2: 'Das Kind hat Fieber.', exampleTranslation2: 'Đứa trẻ bị sốt.' },
        { word: 'Husten', article: 'MASKULIN', plural: '-', wordType: 'NOMEN', meaningVi: 'ho', meaningEn: 'cough', exampleSentence1: 'Ich habe Husten.', exampleTranslation1: 'Tôi bị ho.', exampleSentence2: 'Der Husten ist schlimm.', exampleTranslation2: 'Ho nặng.' },
        { word: 'Schnupfen', article: 'MASKULIN', plural: '-', wordType: 'NOMEN', meaningVi: 'sổ mũi', meaningEn: 'runny nose, cold', exampleSentence1: 'Ich habe Schnupfen.', exampleTranslation1: 'Tôi bị sổ mũi.', exampleSentence2: 'Im Winter habe ich oft Schnupfen.', exampleTranslation2: 'Mùa đông tôi hay bị sổ mũi.' },
        { word: 'Krankenhaus', article: 'NEUTRUM', plural: 'die Krankenhäuser', wordType: 'NOMEN', meaningVi: 'bệnh viện', meaningEn: 'hospital', exampleSentence1: 'Er ist im Krankenhaus.', exampleTranslation1: 'Anh ấy đang ở bệnh viện.', exampleSentence2: 'Das Krankenhaus ist groß.', exampleTranslation2: 'Bệnh viện lớn.' },
        { word: 'Rezept', article: 'NEUTRUM', plural: 'die Rezepte', wordType: 'NOMEN', meaningVi: 'đơn thuốc; công thức', meaningEn: 'prescription; recipe', exampleSentence1: 'Der Arzt schreibt ein Rezept.', exampleTranslation1: 'Bác sĩ kê đơn thuốc.', exampleSentence2: 'Haben Sie ein Rezept?', exampleTranslation2: 'Bạn có đơn thuốc không?' },
        { word: 'Tablette', article: 'FEMININ', plural: 'die Tabletten', wordType: 'NOMEN', meaningVi: 'viên thuốc', meaningEn: 'pill, tablet', exampleSentence1: 'Nehmen Sie drei Tabletten am Tag.', exampleTranslation1: 'Uống ba viên thuốc mỗi ngày.', exampleSentence2: 'Die Tablette ist klein.', exampleTranslation2: 'Viên thuốc nhỏ.' },
    ],

    // ─── Wohnen +5 (35→40) ───
    '04-wohnen.json': [
        { word: 'Miete', article: 'FEMININ', plural: 'die Mieten', wordType: 'NOMEN', meaningVi: 'tiền thuê nhà', meaningEn: 'rent', exampleSentence1: 'Die Miete ist hoch.', exampleTranslation1: 'Tiền thuê nhà cao.', exampleSentence2: 'Wie viel Miete zahlen Sie?', exampleTranslation2: 'Bạn trả bao nhiêu tiền thuê?' },
        { word: 'Strom', article: 'MASKULIN', plural: '-', wordType: 'NOMEN', meaningVi: 'điện', meaningEn: 'electricity', exampleSentence1: 'Der Strom ist teuer.', exampleTranslation1: 'Điện đắt.', exampleSentence2: 'Wir haben keinen Strom.', exampleTranslation2: 'Chúng tôi không có điện.' },
        { word: 'Waschmaschine', article: 'FEMININ', plural: 'die Waschmaschinen', wordType: 'NOMEN', meaningVi: 'máy giặt', meaningEn: 'washing machine', exampleSentence1: 'Die Waschmaschine ist im Keller.', exampleTranslation1: 'Máy giặt ở tầng hầm.', exampleSentence2: 'Ich brauche eine Waschmaschine.', exampleTranslation2: 'Tôi cần một máy giặt.' },
        { word: 'Kühlschrank', article: 'MASKULIN', plural: 'die Kühlschränke', wordType: 'NOMEN', meaningVi: 'tủ lạnh', meaningEn: 'refrigerator', exampleSentence1: 'Die Milch ist im Kühlschrank.', exampleTranslation1: 'Sữa ở trong tủ lạnh.', exampleSentence2: 'Der Kühlschrank ist leer.', exampleTranslation2: 'Tủ lạnh trống.' },
        { word: 'Herd', article: 'MASKULIN', plural: 'die Herde', wordType: 'NOMEN', meaningVi: 'bếp (nấu ăn)', meaningEn: 'stove, cooker', exampleSentence1: 'Der Herd ist in der Küche.', exampleTranslation1: 'Bếp ở trong nhà bếp.', exampleSentence2: 'Ich koche auf dem Herd.', exampleTranslation2: 'Tôi nấu ăn trên bếp.' },
    ],

    // ─── Umwelt +5 (25→30) ───
    '05-umwelt.json': [
        { word: 'Luft', article: 'FEMININ', plural: '-', wordType: 'NOMEN', meaningVi: 'không khí', meaningEn: 'air', exampleSentence1: 'Die Luft ist frisch.', exampleTranslation1: 'Không khí trong lành.', exampleSentence2: 'Ich brauche frische Luft.', exampleTranslation2: 'Tôi cần không khí trong lành.' },
        { word: 'Meer', article: 'NEUTRUM', plural: 'die Meere', wordType: 'NOMEN', meaningVi: 'biển', meaningEn: 'sea, ocean', exampleSentence1: 'Das Meer ist blau.', exampleTranslation1: 'Biển xanh.', exampleSentence2: 'Wir fahren ans Meer.', exampleTranslation2: 'Chúng tôi đi biển.' },
        { word: 'Strand', article: 'MASKULIN', plural: 'die Strände', wordType: 'NOMEN', meaningVi: 'bãi biển', meaningEn: 'beach', exampleSentence1: 'Der Strand ist schön.', exampleTranslation1: 'Bãi biển đẹp.', exampleSentence2: 'Wir liegen am Strand.', exampleTranslation2: 'Chúng tôi nằm trên bãi biển.' },
        { word: 'Insel', article: 'FEMININ', plural: 'die Inseln', wordType: 'NOMEN', meaningVi: 'đảo', meaningEn: 'island', exampleSentence1: 'Die Insel ist klein.', exampleTranslation1: 'Hòn đảo nhỏ.', exampleSentence2: 'Wir fahren auf eine Insel.', exampleTranslation2: 'Chúng tôi đi đến một đảo.' },
        { word: 'Natur', article: 'FEMININ', plural: '-', wordType: 'NOMEN', meaningVi: 'thiên nhiên', meaningEn: 'nature', exampleSentence1: 'Die Natur ist schön.', exampleTranslation1: 'Thiên nhiên đẹp.', exampleSentence2: 'Ich mag die Natur.', exampleTranslation2: 'Tôi thích thiên nhiên.' },
    ],

    // ─── Essen +6 (50→56) ───
    '06-essen-trinken.json': [
        { word: 'Gabel', article: 'FEMININ', plural: 'die Gabeln', wordType: 'NOMEN', meaningVi: 'dĩa (nĩa)', meaningEn: 'fork', exampleSentence1: 'Kann ich eine Gabel haben?', exampleTranslation1: 'Tôi có thể xin một cái nĩa không?', exampleSentence2: 'Die Gabel liegt links.', exampleTranslation2: 'Nĩa nằm bên trái.' },
        { word: 'Messer', article: 'NEUTRUM', plural: 'die Messer', wordType: 'NOMEN', meaningVi: 'dao', meaningEn: 'knife', exampleSentence1: 'Das Messer ist scharf.', exampleTranslation1: 'Con dao sắc.', exampleSentence2: 'Ich brauche ein Messer.', exampleTranslation2: 'Tôi cần một con dao.' },
        { word: 'Löffel', article: 'MASKULIN', plural: 'die Löffel', wordType: 'NOMEN', meaningVi: 'muỗng, thìa', meaningEn: 'spoon', exampleSentence1: 'Ich esse Suppe mit dem Löffel.', exampleTranslation1: 'Tôi ăn súp bằng muỗng.', exampleSentence2: 'Kann ich einen Löffel haben?', exampleTranslation2: 'Tôi có thể xin một cái muỗng không?' },
        { word: 'Teller', article: 'MASKULIN', plural: 'die Teller', wordType: 'NOMEN', meaningVi: 'đĩa (ăn)', meaningEn: 'plate', exampleSentence1: 'Der Teller ist voll.', exampleTranslation1: 'Đĩa đầy.', exampleSentence2: 'Ich brauche einen Teller.', exampleTranslation2: 'Tôi cần một cái đĩa.' },
        { word: 'Glas', article: 'NEUTRUM', plural: 'die Gläser', wordType: 'NOMEN', meaningVi: 'cốc, ly (thủy tinh)', meaningEn: 'glass', exampleSentence1: 'Ein Glas Wasser, bitte.', exampleTranslation1: 'Một cốc nước, xin vui lòng.', exampleSentence2: 'Das Glas ist leer.', exampleTranslation2: 'Cốc trống.' },
        { word: 'Tasse', article: 'FEMININ', plural: 'die Tassen', wordType: 'NOMEN', meaningVi: 'tách, cốc (có quai)', meaningEn: 'cup', exampleSentence1: 'Eine Tasse Kaffee, bitte.', exampleTranslation1: 'Một tách cà phê, xin vui lòng.', exampleSentence2: 'Die Tasse ist heiß.', exampleTranslation2: 'Tách nóng.' },
    ],

    // ─── Einkaufen +6 (24→30) ───
    '07-einkaufen.json': [
        { word: 'Kleidung', article: 'FEMININ', plural: '-', wordType: 'NOMEN', meaningVi: 'quần áo', meaningEn: 'clothing', exampleSentence1: 'Ich kaufe Kleidung.', exampleTranslation1: 'Tôi mua quần áo.', exampleSentence2: 'Das Geschäft verkauft Kleidung.', exampleTranslation2: 'Cửa hàng bán quần áo.' },
        { word: 'Hose', article: 'FEMININ', plural: 'die Hosen', wordType: 'NOMEN', meaningVi: 'quần dài', meaningEn: 'trousers, pants', exampleSentence1: 'Die Hose ist blau.', exampleTranslation1: 'Quần màu xanh.', exampleSentence2: 'Ich brauche eine neue Hose.', exampleTranslation2: 'Tôi cần quần mới.' },
        { word: 'Hemd', article: 'NEUTRUM', plural: 'die Hemden', wordType: 'NOMEN', meaningVi: 'áo sơ mi', meaningEn: 'shirt', exampleSentence1: 'Das Hemd ist weiß.', exampleTranslation1: 'Áo sơ mi trắng.', exampleSentence2: 'Er trägt ein Hemd.', exampleTranslation2: 'Anh ấy mặc áo sơ mi.' },
        { word: 'Kleid', article: 'NEUTRUM', plural: 'die Kleider', wordType: 'NOMEN', meaningVi: 'váy, đầm', meaningEn: 'dress', exampleSentence1: 'Das Kleid ist schön.', exampleTranslation1: 'Váy đẹp.', exampleSentence2: 'Sie trägt ein rotes Kleid.', exampleTranslation2: 'Cô ấy mặc váy đỏ.' },
        { word: 'Schuh', article: 'MASKULIN', plural: 'die Schuhe', wordType: 'NOMEN', meaningVi: 'giày', meaningEn: 'shoe', exampleSentence1: 'Die Schuhe sind neu.', exampleTranslation1: 'Giày mới.', exampleSentence2: 'Ich brauche neue Schuhe.', exampleTranslation2: 'Tôi cần giày mới.' },
        { word: 'Jacke', article: 'FEMININ', plural: 'die Jacken', wordType: 'NOMEN', meaningVi: 'áo khoác', meaningEn: 'jacket', exampleSentence1: 'Die Jacke ist warm.', exampleTranslation1: 'Áo khoác ấm.', exampleSentence2: 'Nimm deine Jacke mit!', exampleTranslation2: 'Mang theo áo khoác!' },
    ],

    // ─── Dienstleistungen +7 (18→25) ───
    '08-dienstleistungen.json': [
        { word: 'Polizei', article: 'FEMININ', plural: '-', wordType: 'NOMEN', meaningVi: 'cảnh sát', meaningEn: 'police', exampleSentence1: 'Rufen Sie die Polizei!', exampleTranslation1: 'Gọi cảnh sát!', exampleSentence2: 'Die Polizei hilft uns.', exampleTranslation2: 'Cảnh sát giúp chúng tôi.' },
        { word: 'Feuerwehr', article: 'FEMININ', plural: '-', wordType: 'NOMEN', meaningVi: 'cứu hỏa', meaningEn: 'fire department', exampleSentence1: 'Die Feuerwehr kommt schnell.', exampleTranslation1: 'Cứu hỏa đến nhanh.', exampleSentence2: 'Rufen Sie die Feuerwehr!', exampleTranslation2: 'Gọi cứu hỏa!' },
        { word: 'Versicherung', article: 'FEMININ', plural: 'die Versicherungen', wordType: 'NOMEN', meaningVi: 'bảo hiểm', meaningEn: 'insurance', exampleSentence1: 'Haben Sie eine Versicherung?', exampleTranslation1: 'Bạn có bảo hiểm không?', exampleSentence2: 'Die Versicherung ist wichtig.', exampleTranslation2: 'Bảo hiểm quan trọng.' },
        { word: 'Konto', article: 'NEUTRUM', plural: 'die Konten', wordType: 'NOMEN', meaningVi: 'tài khoản ngân hàng', meaningEn: 'bank account', exampleSentence1: 'Ich möchte ein Konto eröffnen.', exampleTranslation1: 'Tôi muốn mở tài khoản.', exampleSentence2: 'Mein Konto ist bei der Sparkasse.', exampleTranslation2: 'Tài khoản của tôi ở Sparkasse.' },
        { word: 'Geld', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'tiền', meaningEn: 'money', exampleSentence1: 'Ich habe kein Geld.', exampleTranslation1: 'Tôi không có tiền.', exampleSentence2: 'Wo ist der Geldautomat?', exampleTranslation2: 'Máy ATM ở đâu?' },
        { word: 'Schlüssel', article: 'MASKULIN', plural: 'die Schlüssel', wordType: 'NOMEN', meaningVi: 'chìa khóa', meaningEn: 'key', exampleSentence1: 'Wo ist mein Schlüssel?', exampleTranslation1: 'Chìa khóa của tôi ở đâu?', exampleSentence2: 'Ich habe den Schlüssel verloren.', exampleTranslation2: 'Tôi đã mất chìa khóa.' },
        { word: 'Ausweis', article: 'MASKULIN', plural: 'die Ausweise', wordType: 'NOMEN', meaningVi: 'giấy tờ tùy thân', meaningEn: 'ID card', exampleSentence1: 'Ihren Ausweis, bitte.', exampleTranslation1: 'Giấy tờ tùy thân, xin vui lòng.', exampleSentence2: 'Haben Sie Ihren Ausweis?', exampleTranslation2: 'Bạn có giấy tờ tùy thân không?' },
    ],

    // ─── Ausbildung +6 (29→35) ───
    '09-ausbildung-lernen.json': [
        { word: 'Übung', article: 'FEMININ', plural: 'die Übungen', wordType: 'NOMEN', meaningVi: 'bài tập', meaningEn: 'exercise, practice', exampleSentence1: 'Machen Sie die Übung!', exampleTranslation1: 'Hãy làm bài tập!', exampleSentence2: 'Die Übung ist einfach.', exampleTranslation2: 'Bài tập dễ.' },
        { word: 'Aufgabe', article: 'FEMININ', plural: 'die Aufgaben', wordType: 'NOMEN', meaningVi: 'bài tập, nhiệm vụ', meaningEn: 'task, assignment', exampleSentence1: 'Lesen Sie die Aufgabe.', exampleTranslation1: 'Hãy đọc đề bài.', exampleSentence2: 'Die Aufgabe ist schwer.', exampleTranslation2: 'Bài tập khó.' },
        { word: 'Beispiel', article: 'NEUTRUM', plural: 'die Beispiele', wordType: 'NOMEN', meaningVi: 'ví dụ', meaningEn: 'example', exampleSentence1: 'Zum Beispiel Kaffee.', exampleTranslation1: 'Ví dụ cà phê.', exampleSentence2: 'Geben Sie ein Beispiel!', exampleTranslation2: 'Hãy đưa một ví dụ!' },
        { word: 'Wort', article: 'NEUTRUM', plural: 'die Wörter', wordType: 'NOMEN', meaningVi: 'từ, chữ', meaningEn: 'word', exampleSentence1: 'Was bedeutet das Wort?', exampleTranslation1: 'Từ đó nghĩa là gì?', exampleSentence2: 'Schreiben Sie das Wort!', exampleTranslation2: 'Hãy viết từ đó!' },
        { word: 'Satz', article: 'MASKULIN', plural: 'die Sätze', wordType: 'NOMEN', meaningVi: 'câu', meaningEn: 'sentence', exampleSentence1: 'Lesen Sie den Satz!', exampleTranslation1: 'Hãy đọc câu!', exampleSentence2: 'Der Satz ist lang.', exampleTranslation2: 'Câu dài.' },
        { word: 'Text', article: 'MASKULIN', plural: 'die Texte', wordType: 'NOMEN', meaningVi: 'bài đọc, văn bản', meaningEn: 'text', exampleSentence1: 'Lesen Sie den Text!', exampleTranslation1: 'Hãy đọc bài!', exampleSentence2: 'Der Text ist kurz.', exampleTranslation2: 'Bài đọc ngắn.' },
    ],

    // ─── Arbeit +7 (23→30) ───
    '10-arbeit-beruf.json': [
        { word: 'Stelle', article: 'FEMININ', plural: 'die Stellen', wordType: 'NOMEN', meaningVi: 'vị trí (việc làm)', meaningEn: 'position, job', exampleSentence1: 'Ich suche eine Stelle.', exampleTranslation1: 'Tôi tìm việc.', exampleSentence2: 'Die Stelle ist gut.', exampleTranslation2: 'Vị trí tốt.' },
        { word: 'Vollzeit', wordType: 'ADJEKTIV', meaningVi: 'toàn thời gian', meaningEn: 'full-time', exampleSentence1: 'Ich arbeite Vollzeit.', exampleTranslation1: 'Tôi làm việc toàn thời gian.', exampleSentence2: 'Suchen Sie eine Vollzeitstelle?', exampleTranslation2: 'Bạn tìm việc toàn thời gian?' },
        { word: 'Teilzeit', wordType: 'ADJEKTIV', meaningVi: 'bán thời gian', meaningEn: 'part-time', exampleSentence1: 'Sie arbeitet Teilzeit.', exampleTranslation1: 'Cô ấy làm bán thời gian.', exampleSentence2: 'Ich suche Teilzeitarbeit.', exampleTranslation2: 'Tôi tìm việc bán thời gian.' },
        { word: 'Arbeitszeit', article: 'FEMININ', plural: 'die Arbeitszeiten', wordType: 'NOMEN', meaningVi: 'giờ làm việc', meaningEn: 'working hours', exampleSentence1: 'Die Arbeitszeit ist flexibel.', exampleTranslation1: 'Giờ làm việc linh hoạt.', exampleSentence2: 'Meine Arbeitszeit ist von acht bis fünf.', exampleTranslation2: 'Giờ làm việc của tôi từ tám đến năm giờ.' },
        { word: 'Chef', article: 'MASKULIN', plural: 'die Chefs', wordType: 'NOMEN', meaningVi: 'sếp, giám đốc', meaningEn: 'boss, manager', exampleSentence1: 'Mein Chef ist nett.', exampleTranslation1: 'Sếp tôi tốt.', exampleSentence2: 'Der Chef kommt um neun.', exampleTranslation2: 'Sếp đến lúc chín giờ.' },
        { word: 'Kollege', article: 'MASKULIN', plural: 'die Kollegen', wordType: 'NOMEN', meaningVi: 'đồng nghiệp (nam)', meaningEn: 'colleague (male)', exampleSentence1: 'Mein Kollege hilft mir.', exampleTranslation1: 'Đồng nghiệp giúp tôi.', exampleSentence2: 'Die Kollegen sind freundlich.', exampleTranslation2: 'Các đồng nghiệp thân thiện.' },
        { word: 'Kollegin', article: 'FEMININ', plural: 'die Kolleginnen', wordType: 'NOMEN', meaningVi: 'đồng nghiệp (nữ)', meaningEn: 'colleague (female)', exampleSentence1: 'Meine Kollegin kommt aus Vietnam.', exampleTranslation1: 'Đồng nghiệp nữ đến từ Việt Nam.', exampleSentence2: 'Die Kollegin ist nett.', exampleTranslation2: 'Đồng nghiệp nữ tốt bụng.' },
    ],

    // ─── Freizeit +8 (32→40) ───
    '11-freizeit.json': [
        { word: 'Zeitung', article: 'FEMININ', plural: 'die Zeitungen', wordType: 'NOMEN', meaningVi: 'báo', meaningEn: 'newspaper', exampleSentence1: 'Ich lese die Zeitung.', exampleTranslation1: 'Tôi đọc báo.', exampleSentence2: 'Die Zeitung ist von heute.', exampleTranslation2: 'Báo của hôm nay.' },
        { word: 'Zeitschrift', article: 'FEMININ', plural: 'die Zeitschriften', wordType: 'NOMEN', meaningVi: 'tạp chí', meaningEn: 'magazine', exampleSentence1: 'Ich lese eine Zeitschrift.', exampleTranslation1: 'Tôi đọc tạp chí.', exampleSentence2: 'Die Zeitschrift ist interessant.', exampleTranslation2: 'Tạp chí thú vị.' },
        { word: 'Fest', article: 'NEUTRUM', plural: 'die Feste', wordType: 'NOMEN', meaningVi: 'lễ hội, tiệc', meaningEn: 'festival, party', exampleSentence1: 'Das Fest ist am Samstag.', exampleTranslation1: 'Lễ hội vào thứ bảy.', exampleSentence2: 'Wir machen ein Fest.', exampleTranslation2: 'Chúng tôi tổ chức tiệc.' },
        { word: 'Einladung', article: 'FEMININ', plural: 'die Einladungen', wordType: 'NOMEN', meaningVi: 'lời mời', meaningEn: 'invitation', exampleSentence1: 'Danke für die Einladung!', exampleTranslation1: 'Cảm ơn lời mời!', exampleSentence2: 'Ich schreibe eine Einladung.', exampleTranslation2: 'Tôi viết thư mời.' },
        { word: 'Geschenk', article: 'NEUTRUM', plural: 'die Geschenke', wordType: 'NOMEN', meaningVi: 'quà tặng', meaningEn: 'gift, present', exampleSentence1: 'Das Geschenk ist für dich.', exampleTranslation1: 'Quà cho bạn.', exampleSentence2: 'Ich kaufe ein Geschenk.', exampleTranslation2: 'Tôi mua quà.' },
        { word: 'Foto', article: 'NEUTRUM', plural: 'die Fotos', wordType: 'NOMEN', meaningVi: 'ảnh', meaningEn: 'photo', exampleSentence1: 'Ich mache ein Foto.', exampleTranslation1: 'Tôi chụp ảnh.', exampleSentence2: 'Das Foto ist schön.', exampleTranslation2: 'Ảnh đẹp.' },
        { word: 'Ausflug', article: 'MASKULIN', plural: 'die Ausflüge', wordType: 'NOMEN', meaningVi: 'chuyến đi chơi', meaningEn: 'excursion, trip', exampleSentence1: 'Wir machen einen Ausflug.', exampleTranslation1: 'Chúng tôi đi chơi.', exampleSentence2: 'Der Ausflug war toll.', exampleTranslation2: 'Chuyến đi tuyệt vời.' },
        { word: 'Wochenende', article: 'NEUTRUM', plural: 'die Wochenenden', wordType: 'NOMEN', meaningVi: 'cuối tuần', meaningEn: 'weekend', exampleSentence1: 'Am Wochenende schlafe ich lang.', exampleTranslation1: 'Cuối tuần tôi ngủ dài.', exampleSentence2: 'Was machst du am Wochenende?', exampleTranslation2: 'Cuối tuần bạn làm gì?' },
    ],

    // ─── Kommunikation +6 (19→25) ───
    '12-kommunikation.json': [
        { word: 'Gespräch', article: 'NEUTRUM', plural: 'die Gespräche', wordType: 'NOMEN', meaningVi: 'cuộc trò chuyện', meaningEn: 'conversation', exampleSentence1: 'Das Gespräch war interessant.', exampleTranslation1: 'Cuộc trò chuyện thú vị.', exampleSentence2: 'Ich führe ein Gespräch.', exampleTranslation2: 'Tôi có một cuộc trò chuyện.' },
        { word: 'Frage', article: 'FEMININ', plural: 'die Fragen', wordType: 'NOMEN', meaningVi: 'câu hỏi', meaningEn: 'question', exampleSentence1: 'Ich habe eine Frage.', exampleTranslation1: 'Tôi có một câu hỏi.', exampleSentence2: 'Die Frage ist schwer.', exampleTranslation2: 'Câu hỏi khó.' },
        { word: 'Antwort', article: 'FEMININ', plural: 'die Antworten', wordType: 'NOMEN', meaningVi: 'câu trả lời', meaningEn: 'answer', exampleSentence1: 'Die Antwort ist richtig.', exampleTranslation1: 'Câu trả lời đúng.', exampleSentence2: 'Ich weiß die Antwort nicht.', exampleTranslation2: 'Tôi không biết câu trả lời.' },
        { word: 'Information', article: 'FEMININ', plural: 'die Informationen', wordType: 'NOMEN', meaningVi: 'thông tin', meaningEn: 'information', exampleSentence1: 'Ich brauche eine Information.', exampleTranslation1: 'Tôi cần thông tin.', exampleSentence2: 'Wo bekomme ich Informationen?', exampleTranslation2: 'Tôi lấy thông tin ở đâu?' },
        { word: 'erklären', wordType: 'VERB', meaningVi: 'giải thích', meaningEn: 'to explain', conjugation: { praesens: { ich: 'erkläre', du: 'erklärst', er_sie_es: 'erklärt', wir: 'erklären', ihr: 'erklärt', sie_Sie: 'erklären' }, isIrregular: false, isSeparable: false }, exampleSentence1: 'Können Sie das erklären?', exampleTranslation1: 'Bạn có thể giải thích không?', exampleSentence2: 'Der Lehrer erklärt die Grammatik.', exampleTranslation2: 'Giáo viên giải thích ngữ pháp.' },
        { word: 'verstehen', wordType: 'VERB', meaningVi: 'hiểu', meaningEn: 'to understand', conjugation: { praesens: { ich: 'verstehe', du: 'verstehst', er_sie_es: 'versteht', wir: 'verstehen', ihr: 'versteht', sie_Sie: 'verstehen' }, perfekt: 'hat verstanden', isIrregular: true, isSeparable: false }, exampleSentence1: 'Ich verstehe nicht.', exampleTranslation1: 'Tôi không hiểu.', exampleSentence2: 'Verstehen Sie Deutsch?', exampleTranslation2: 'Bạn hiểu tiếng Đức không?' },
    ],

    // ─── Reisen +5 (35→40) ───
    '13-reisen-verkehr.json': [
        { word: 'Koffer', article: 'MASKULIN', plural: 'die Koffer', wordType: 'NOMEN', meaningVi: 'vali', meaningEn: 'suitcase', exampleSentence1: 'Der Koffer ist schwer.', exampleTranslation1: 'Vali nặng.', exampleSentence2: 'Ich packe meinen Koffer.', exampleTranslation2: 'Tôi đóng gói vali.' },
        { word: 'Reisepass', article: 'MASKULIN', plural: 'die Reisepässe', wordType: 'NOMEN', meaningVi: 'hộ chiếu', meaningEn: 'passport', exampleSentence1: 'Ihren Reisepass, bitte.', exampleTranslation1: 'Hộ chiếu, xin vui lòng.', exampleSentence2: 'Mein Reisepass ist gültig.', exampleTranslation2: 'Hộ chiếu của tôi còn hiệu lực.' },
        { word: 'Gepäck', article: 'NEUTRUM', plural: '-', wordType: 'NOMEN', meaningVi: 'hành lý', meaningEn: 'luggage, baggage', exampleSentence1: 'Wo ist mein Gepäck?', exampleTranslation1: 'Hành lý của tôi ở đâu?', exampleSentence2: 'Das Gepäck ist im Auto.', exampleTranslation2: 'Hành lý ở trong xe.' },
        { word: 'Ankunft', article: 'FEMININ', plural: 'die Ankünfte', wordType: 'NOMEN', meaningVi: 'đến, hạ cánh', meaningEn: 'arrival', exampleSentence1: 'Die Ankunft ist um 15 Uhr.', exampleTranslation1: 'Đến lúc 15 giờ.', exampleSentence2: 'Ankunft in Berlin.', exampleTranslation2: 'Đến Berlin.' },
        { word: 'Abfahrt', article: 'FEMININ', plural: 'die Abfahrten', wordType: 'NOMEN', meaningVi: 'khởi hành', meaningEn: 'departure', exampleSentence1: 'Die Abfahrt ist um 8 Uhr.', exampleTranslation1: 'Khởi hành lúc 8 giờ.', exampleSentence2: 'Die Abfahrt ist in 5 Minuten.', exampleTranslation2: 'Khởi hành trong 5 phút.' },
    ],

    // ─── Zeitangaben +2 (48→50) ───
    '14-zeitangaben.json': [
        { word: 'Kalender', article: 'MASKULIN', plural: 'die Kalender', wordType: 'NOMEN', meaningVi: 'lịch', meaningEn: 'calendar', exampleSentence1: 'Schau im Kalender nach!', exampleTranslation1: 'Xem lịch đi!', exampleSentence2: 'Ich habe einen Termin im Kalender.', exampleTranslation2: 'Tôi có hẹn trong lịch.' },
        { word: 'Datum', article: 'NEUTRUM', plural: 'die Daten', wordType: 'NOMEN', meaningVi: 'ngày tháng', meaningEn: 'date', exampleSentence1: 'Welches Datum ist heute?', exampleTranslation1: 'Hôm nay là ngày bao nhiêu?', exampleSentence2: 'Das Datum ist der 5. März.', exampleTranslation2: 'Ngày là mùng 5 tháng 3.' },
    ],

    // ─── Zahlen +6 (39→45) ───
    '15-zahlen.json': [
        { word: 'sechzehn', wordType: 'NOMEN', meaningVi: 'mười sáu', meaningEn: 'sixteen', exampleSentence1: 'Ich bin sechzehn Jahre alt.', exampleTranslation1: 'Tôi mười sáu tuổi.', exampleSentence2: 'Nummer sechzehn, bitte.', exampleTranslation2: 'Số mười sáu, xin vui lòng.' },
        { word: 'siebzehn', wordType: 'NOMEN', meaningVi: 'mười bảy', meaningEn: 'seventeen', exampleSentence1: 'Er ist siebzehn.', exampleTranslation1: 'Anh ấy mười bảy.', exampleSentence2: 'Zimmer siebzehn.', exampleTranslation2: 'Phòng mười bảy.' },
        { word: 'achtzehn', wordType: 'NOMEN', meaningVi: 'mười tám', meaningEn: 'eighteen', exampleSentence1: 'Sie ist achtzehn Jahre alt.', exampleTranslation1: 'Cô ấy mười tám tuổi.', exampleSentence2: 'Es kostet achtzehn Euro.', exampleTranslation2: 'Giá mười tám Euro.' },
        { word: 'neunzehn', wordType: 'NOMEN', meaningVi: 'mười chín', meaningEn: 'nineteen', exampleSentence1: 'Das Kind ist neunzehn.', exampleTranslation1: 'Đứa trẻ mười chín tuổi.', exampleSentence2: 'Seite neunzehn.', exampleTranslation2: 'Trang mười chín.' },
        { word: 'einundzwanzig', wordType: 'NOMEN', meaningVi: 'hai mươi mốt', meaningEn: 'twenty-one', exampleSentence1: 'Ich bin einundzwanzig.', exampleTranslation1: 'Tôi hai mươi mốt tuổi.', exampleSentence2: 'Das dauert einundzwanzig Tage.', exampleTranslation2: 'Kéo dài hai mươi mốt ngày.', notes: 'Deutsche Zahlen ab 21: Einerstelle + und + Zehnerstelle (einundzwanzig, zweiunddreißig...)' },
        { word: 'Nummer', article: 'FEMININ', plural: 'die Nummern', wordType: 'NOMEN', meaningVi: 'số (thứ tự)', meaningEn: 'number', exampleSentence1: 'Welche Nummer haben Sie?', exampleTranslation1: 'Bạn có số bao nhiêu?', exampleSentence2: 'Zimmer Nummer fünf.', exampleTranslation2: 'Phòng số năm.' },
    ],
}

function main() {
    console.log('Phase 3: Final expansion to 650+\n')

    let totalAdded = 0

    for (const [filename, newWords] of Object.entries(expansions)) {
        const filePath = path.join('content', 'a1', 'vocabulary', filename)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))

        const existingWords = new Set(data.words.map((w: any) => w.word.toLowerCase()))
        const toAdd: Word[] = []

        for (const w of newWords) {
            if (!existingWords.has(w.word.toLowerCase())) {
                toAdd.push(w)
            } else {
                console.log(`  ⏭️  ${w.word} already exists in ${filename}`)
            }
        }

        if (toAdd.length > 0) {
            data.words.push(...toAdd)
            writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8')
            console.log(`  ✅ ${filename}: +${toAdd.length} (${data.words.length} total)`)
        }
        totalAdded += toAdd.length
    }

    console.log(`\n📊 Total words added: ${totalAdded}`)

    // Final count
    const fs = require('fs')
    const dir = 'content/a1/vocabulary'
    const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.json')).sort()
    let grand = 0
    for (const f of files) {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
        grand += d.words.length
    }
    console.log(`📊 Grand total: ${grand} words\n`)
}

main()
