/**
 * Phase 2: Expand existing themes to meet CEFR A1 minimums
 * Adds new words to existing JSON files
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
    imageUrl?: string
}

const expansions: Record<string, Word[]> = {
    // ─── Familie +1 (29→30) ───
    '02-familie-freunde.json': [
        { word: 'Verwandte', article: 'MASKULIN', plural: 'die Verwandten', wordType: 'NOMEN', meaningVi: 'người họ hàng', meaningEn: 'relative', exampleSentence1: 'Ich habe viele Verwandte.', exampleTranslation1: 'Tôi có nhiều họ hàng.', exampleSentence2: 'Meine Verwandten wohnen in Vietnam.', exampleTranslation2: 'Họ hàng tôi sống ở Việt Nam.' },
    ],

    // ─── Körper +1 (29→30) ───
    '03-koerper-gesundheit.json': [
        { word: 'Hals', article: 'MASKULIN', plural: 'die Hälse', wordType: 'NOMEN', meaningVi: 'cổ, họng', meaningEn: 'throat, neck', exampleSentence1: 'Ich habe Halsschmerzen.', exampleTranslation1: 'Tôi bị đau họng.', exampleSentence2: 'Der Hals tut mir weh.', exampleTranslation2: 'Cổ tôi đau.' },
    ],

    // ─── Wohnen +5 (30→35) ───
    '04-wohnen.json': [
        { word: 'Dach', article: 'NEUTRUM', plural: 'die Dächer', wordType: 'NOMEN', meaningVi: 'mái nhà', meaningEn: 'roof', exampleSentence1: 'Das Dach ist rot.', exampleTranslation1: 'Mái nhà màu đỏ.', exampleSentence2: 'Die Katze sitzt auf dem Dach.', exampleTranslation2: 'Con mèo ngồi trên mái nhà.' },
        { word: 'Wand', article: 'FEMININ', plural: 'die Wände', wordType: 'NOMEN', meaningVi: 'bức tường', meaningEn: 'wall', exampleSentence1: 'Die Wand ist weiß.', exampleTranslation1: 'Bức tường màu trắng.', exampleSentence2: 'Das Bild hängt an der Wand.', exampleTranslation2: 'Bức tranh treo trên tường.' },
        { word: 'Boden', article: 'MASKULIN', plural: 'die Böden', wordType: 'NOMEN', meaningVi: 'sàn nhà', meaningEn: 'floor, ground', exampleSentence1: 'Der Boden ist sauber.', exampleTranslation1: 'Sàn nhà sạch.', exampleSentence2: 'Das Buch liegt auf dem Boden.', exampleTranslation2: 'Cuốn sách nằm trên sàn.' },
        { word: 'Keller', article: 'MASKULIN', plural: 'die Keller', wordType: 'NOMEN', meaningVi: 'tầng hầm', meaningEn: 'basement, cellar', exampleSentence1: 'Der Keller ist dunkel.', exampleTranslation1: 'Tầng hầm tối.', exampleSentence2: 'Mein Fahrrad ist im Keller.', exampleTranslation2: 'Xe đạp của tôi ở tầng hầm.' },
        { word: 'Heizung', article: 'FEMININ', plural: 'die Heizungen', wordType: 'NOMEN', meaningVi: 'lò sưởi, hệ thống sưởi', meaningEn: 'heating', exampleSentence1: 'Die Heizung ist an.', exampleTranslation1: 'Máy sưởi đang bật.', exampleSentence2: 'Im Winter brauche ich die Heizung.', exampleTranslation2: 'Mùa đông tôi cần hệ thống sưởi.' },
    ],

    // ─── Umwelt +5 (25→30) ───
    '05-umwelt.json': [
        { word: 'Brücke', article: 'FEMININ', plural: 'die Brücken', wordType: 'NOMEN', meaningVi: 'cầu', meaningEn: 'bridge', exampleSentence1: 'Die Brücke ist alt.', exampleTranslation1: 'Cây cầu cũ.', exampleSentence2: 'Wir gehen über die Brücke.', exampleTranslation2: 'Chúng tôi đi qua cầu.' },
        { word: 'Fluss', article: 'MASKULIN', plural: 'die Flüsse', wordType: 'NOMEN', meaningVi: 'con sông', meaningEn: 'river', exampleSentence1: 'Der Fluss ist lang.', exampleTranslation1: 'Con sông dài.', exampleSentence2: 'Wir wohnen am Fluss.', exampleTranslation2: 'Chúng tôi sống bên sông.' },
        { word: 'Berg', article: 'MASKULIN', plural: 'die Berge', wordType: 'NOMEN', meaningVi: 'ngọn núi', meaningEn: 'mountain', exampleSentence1: 'Der Berg ist hoch.', exampleTranslation1: 'Ngọn núi cao.', exampleSentence2: 'Wir wandern in den Bergen.', exampleTranslation2: 'Chúng tôi đi bộ trên núi.' },
        { word: 'See', article: 'MASKULIN', plural: 'die Seen', wordType: 'NOMEN', meaningVi: 'hồ', meaningEn: 'lake', exampleSentence1: 'Der See ist schön.', exampleTranslation1: 'Hồ đẹp.', exampleSentence2: 'Wir schwimmen im See.', exampleTranslation2: 'Chúng tôi bơi trong hồ.', notes: 'der See = hồ (maskulin), die See = biển (feminin)' },
        { word: 'Wald', article: 'MASKULIN', plural: 'die Wälder', wordType: 'NOMEN', meaningVi: 'rừng', meaningEn: 'forest', exampleSentence1: 'Der Wald ist grün.', exampleTranslation1: 'Rừng xanh.', exampleSentence2: 'Wir gehen im Wald spazieren.', exampleTranslation2: 'Chúng tôi đi dạo trong rừng.' },
    ],

    // ─── Essen +1 (49→50) ───
    '06-essen-trinken.json': [
        { word: 'Sahne', article: 'FEMININ', plural: '-', wordType: 'NOMEN', meaningVi: 'kem (sữa)', meaningEn: 'cream', exampleSentence1: 'Kaffee mit Sahne, bitte.', exampleTranslation1: 'Cà phê với kem, xin vui lòng.', exampleSentence2: 'Der Kuchen hat viel Sahne.', exampleTranslation2: 'Bánh có nhiều kem.' },
    ],

    // ─── Einkaufen +7 (23→30) ───
    '07-einkaufen.json': [
        { word: 'Supermarkt', article: 'MASKULIN', plural: 'die Supermärkte', wordType: 'NOMEN', meaningVi: 'siêu thị', meaningEn: 'supermarket', exampleSentence1: 'Ich gehe in den Supermarkt.', exampleTranslation1: 'Tôi đi siêu thị.', exampleSentence2: 'Der Supermarkt ist um die Ecke.', exampleTranslation2: 'Siêu thị ở góc đường.' },
        { word: 'Markt', article: 'MASKULIN', plural: 'die Märkte', wordType: 'NOMEN', meaningVi: 'chợ', meaningEn: 'market', exampleSentence1: 'Der Markt ist am Samstag.', exampleTranslation1: 'Chợ mở vào thứ bảy.', exampleSentence2: 'Ich kaufe Obst auf dem Markt.', exampleTranslation2: 'Tôi mua trái cây ở chợ.' },
        { word: 'Tasche', article: 'FEMININ', plural: 'die Taschen', wordType: 'NOMEN', meaningVi: 'túi, giỏ', meaningEn: 'bag', exampleSentence1: 'Haben Sie eine Tasche?', exampleTranslation1: 'Bạn có túi không?', exampleSentence2: 'Die Tasche ist groß.', exampleTranslation2: 'Túi to.' },
        { word: 'Rechnung', article: 'FEMININ', plural: 'die Rechnungen', wordType: 'NOMEN', meaningVi: 'hóa đơn', meaningEn: 'bill, invoice', exampleSentence1: 'Die Rechnung, bitte!', exampleTranslation1: 'Hóa đơn, xin vui lòng!', exampleSentence2: 'Ich bezahle die Rechnung.', exampleTranslation2: 'Tôi thanh toán hóa đơn.' },
        { word: 'Kasse', article: 'FEMININ', plural: 'die Kassen', wordType: 'NOMEN', meaningVi: 'quầy thu ngân', meaningEn: 'cash register, checkout', exampleSentence1: 'Bitte zahlen Sie an der Kasse.', exampleTranslation1: 'Xin thanh toán tại quầy.', exampleSentence2: 'Die Kasse ist dort.', exampleTranslation2: 'Quầy thu ngân ở kia.' },
        { word: 'Angebot', article: 'NEUTRUM', plural: 'die Angebote', wordType: 'NOMEN', meaningVi: 'ưu đãi, khuyến mãi', meaningEn: 'offer, deal', exampleSentence1: 'Das ist ein gutes Angebot.', exampleTranslation1: 'Đó là ưu đãi tốt.', exampleSentence2: 'Heute gibt es viele Angebote.', exampleTranslation2: 'Hôm nay có nhiều khuyến mãi.' },
        { word: 'Größe', article: 'FEMININ', plural: 'die Größen', wordType: 'NOMEN', meaningVi: 'kích cỡ', meaningEn: 'size', exampleSentence1: 'Welche Größe brauchen Sie?', exampleTranslation1: 'Bạn cần cỡ nào?', exampleSentence2: 'Meine Größe ist M.', exampleTranslation2: 'Cỡ của tôi là M.' },
    ],

    // ─── Dienstleistungen +3 (17→20) ───
    '08-dienstleistungen.json': [
        { word: 'Amt', article: 'NEUTRUM', plural: 'die Ämter', wordType: 'NOMEN', meaningVi: 'cơ quan hành chính', meaningEn: 'office (government)', exampleSentence1: 'Ich gehe zum Amt.', exampleTranslation1: 'Tôi đi đến cơ quan.', exampleSentence2: 'Das Amt ist am Montag geöffnet.', exampleTranslation2: 'Cơ quan mở cửa thứ hai.' },
        { word: 'Formular', article: 'NEUTRUM', plural: 'die Formulare', wordType: 'NOMEN', meaningVi: 'biểu mẫu, đơn', meaningEn: 'form (document)', exampleSentence1: 'Bitte füllen Sie das Formular aus.', exampleTranslation1: 'Xin hãy điền biểu mẫu.', exampleSentence2: 'Ich brauche ein Formular.', exampleTranslation2: 'Tôi cần một biểu mẫu.' },
        { word: 'Termin', article: 'MASKULIN', plural: 'die Termine', wordType: 'NOMEN', meaningVi: 'cuộc hẹn', meaningEn: 'appointment', exampleSentence1: 'Ich habe einen Termin beim Arzt.', exampleTranslation1: 'Tôi có hẹn với bác sĩ.', exampleSentence2: 'Wann ist der Termin?', exampleTranslation2: 'Cuộc hẹn khi nào?' },
    ],

    // ─── Ausbildung +2 (28→30) ───
    '09-ausbildung-lernen.json': [
        { word: 'Prüfung', article: 'FEMININ', plural: 'die Prüfungen', wordType: 'NOMEN', meaningVi: 'kỳ thi', meaningEn: 'exam, test', exampleSentence1: 'Ich habe morgen eine Prüfung.', exampleTranslation1: 'Ngày mai tôi có kỳ thi.', exampleSentence2: 'Die Prüfung ist schwer.', exampleTranslation2: 'Kỳ thi khó.' },
        { word: 'Pause', article: 'FEMININ', plural: 'die Pausen', wordType: 'NOMEN', meaningVi: 'giờ nghỉ, giải lao', meaningEn: 'break, pause', exampleSentence1: 'Wir haben jetzt Pause.', exampleTranslation1: 'Bây giờ chúng tôi nghỉ giải lao.', exampleSentence2: 'Die Pause dauert 15 Minuten.', exampleTranslation2: 'Giờ nghỉ kéo dài 15 phút.' },
    ],

    // ─── Arbeit +7 (18→25) ───
    '10-arbeit-beruf.json': [
        { word: 'Firma', article: 'FEMININ', plural: 'die Firmen', wordType: 'NOMEN', meaningVi: 'công ty', meaningEn: 'company, firm', exampleSentence1: 'Die Firma ist groß.', exampleTranslation1: 'Công ty lớn.', exampleSentence2: 'Ich arbeite bei einer Firma.', exampleTranslation2: 'Tôi làm việc tại một công ty.' },
        { word: 'Gehalt', article: 'NEUTRUM', plural: 'die Gehälter', wordType: 'NOMEN', meaningVi: 'lương', meaningEn: 'salary', exampleSentence1: 'Das Gehalt ist gut.', exampleTranslation1: 'Lương tốt.', exampleSentence2: 'Ich bekomme mein Gehalt am Ende des Monats.', exampleTranslation2: 'Tôi nhận lương cuối tháng.' },
        { word: 'Vertrag', article: 'MASKULIN', plural: 'die Verträge', wordType: 'NOMEN', meaningVi: 'hợp đồng', meaningEn: 'contract', exampleSentence1: 'Ich unterschreibe den Vertrag.', exampleTranslation1: 'Tôi ký hợp đồng.', exampleSentence2: 'Der Vertrag ist für ein Jahr.', exampleTranslation2: 'Hợp đồng kéo dài một năm.' },
        { word: 'Urlaub', article: 'MASKULIN', plural: 'die Urlaube', wordType: 'NOMEN', meaningVi: 'kỳ nghỉ', meaningEn: 'vacation, leave', exampleSentence1: 'Ich habe Urlaub.', exampleTranslation1: 'Tôi đang nghỉ phép.', exampleSentence2: 'Im Urlaub fahre ich nach Italien.', exampleTranslation2: 'Trong kỳ nghỉ tôi đi Ý.' },
        { word: 'Meeting', article: 'NEUTRUM', plural: 'die Meetings', wordType: 'NOMEN', meaningVi: 'cuộc họp', meaningEn: 'meeting', exampleSentence1: 'Das Meeting ist um zehn Uhr.', exampleTranslation1: 'Cuộc họp lúc mười giờ.', exampleSentence2: 'Ich habe heute drei Meetings.', exampleTranslation2: 'Hôm nay tôi có ba cuộc họp.' },
        { word: 'Erfahrung', article: 'FEMININ', plural: 'die Erfahrungen', wordType: 'NOMEN', meaningVi: 'kinh nghiệm', meaningEn: 'experience', exampleSentence1: 'Haben Sie Erfahrung?', exampleTranslation1: 'Bạn có kinh nghiệm không?', exampleSentence2: 'Ich habe viel Erfahrung.', exampleTranslation2: 'Tôi có nhiều kinh nghiệm.' },
        { word: 'Bewerbung', article: 'FEMININ', plural: 'die Bewerbungen', wordType: 'NOMEN', meaningVi: 'hồ sơ xin việc', meaningEn: 'job application', exampleSentence1: 'Ich schreibe eine Bewerbung.', exampleTranslation1: 'Tôi viết hồ sơ xin việc.', exampleSentence2: 'Die Bewerbung ist fertig.', exampleTranslation2: 'Hồ sơ xin việc đã xong.' },
    ],

    // ─── Freizeit +10 (25→35) ───
    '11-freizeit.json': [
        { word: 'Garten', article: 'MASKULIN', plural: 'die Gärten', wordType: 'NOMEN', meaningVi: 'vườn', meaningEn: 'garden', exampleSentence1: 'Wir haben einen Garten.', exampleTranslation1: 'Chúng tôi có một vườn.', exampleSentence2: 'Die Kinder spielen im Garten.', exampleTranslation2: 'Bọn trẻ chơi ngoài vườn.' },
        { word: 'Hobby', article: 'NEUTRUM', plural: 'die Hobbys', wordType: 'NOMEN', meaningVi: 'sở thích', meaningEn: 'hobby', exampleSentence1: 'Was ist dein Hobby?', exampleTranslation1: 'Sở thích của bạn là gì?', exampleSentence2: 'Mein Hobby ist Lesen.', exampleTranslation2: 'Sở thích của tôi là đọc sách.' },
        { word: 'Spiel', article: 'NEUTRUM', plural: 'die Spiele', wordType: 'NOMEN', meaningVi: 'trò chơi', meaningEn: 'game', exampleSentence1: 'Das Spiel macht Spaß.', exampleTranslation1: 'Trò chơi vui.', exampleSentence2: 'Wir spielen ein Spiel.', exampleTranslation2: 'Chúng tôi chơi một trò chơi.' },
        { word: 'Karte', article: 'FEMININ', plural: 'die Karten', wordType: 'NOMEN', meaningVi: 'vé, thẻ, bản đồ', meaningEn: 'ticket, card, map', exampleSentence1: 'Ich brauche eine Karte.', exampleTranslation1: 'Tôi cần một tấm vé.', exampleSentence2: 'Haben Sie noch Karten?', exampleTranslation2: 'Bạn còn vé không?' },
        { word: 'Museum', article: 'NEUTRUM', plural: 'die Museen', wordType: 'NOMEN', meaningVi: 'bảo tàng', meaningEn: 'museum', exampleSentence1: 'Das Museum ist interessant.', exampleTranslation1: 'Bảo tàng thú vị.', exampleSentence2: 'Wir gehen ins Museum.', exampleTranslation2: 'Chúng tôi đi bảo tàng.' },
        { word: 'Konzert', article: 'NEUTRUM', plural: 'die Konzerte', wordType: 'NOMEN', meaningVi: 'buổi hòa nhạc', meaningEn: 'concert', exampleSentence1: 'Das Konzert ist am Freitag.', exampleTranslation1: 'Buổi hòa nhạc vào thứ sáu.', exampleSentence2: 'Ich gehe gern ins Konzert.', exampleTranslation2: 'Tôi thích đi xem hòa nhạc.' },
        { word: 'Verein', article: 'MASKULIN', plural: 'die Vereine', wordType: 'NOMEN', meaningVi: 'câu lạc bộ, hội', meaningEn: 'club, association', exampleSentence1: 'Ich bin im Sportverein.', exampleTranslation1: 'Tôi ở trong câu lạc bộ thể thao.', exampleSentence2: 'Der Verein hat viele Mitglieder.', exampleTranslation2: 'Câu lạc bộ có nhiều thành viên.' },
        { word: 'wandern', wordType: 'VERB', meaningVi: 'đi bộ đường dài', meaningEn: 'to hike', conjugation: { praesens: { ich: 'wandere', du: 'wanderst', er_sie_es: 'wandert', wir: 'wandern', ihr: 'wandert', sie_Sie: 'wandern' }, isIrregular: false, isSeparable: false }, exampleSentence1: 'Am Wochenende wandern wir.', exampleTranslation1: 'Cuối tuần chúng tôi đi bộ đường dài.', exampleSentence2: 'Ich wandere gern in den Bergen.', exampleTranslation2: 'Tôi thích đi bộ đường dài trên núi.' },
        { word: 'kochen', wordType: 'VERB', meaningVi: 'nấu ăn', meaningEn: 'to cook', conjugation: { praesens: { ich: 'koche', du: 'kochst', er_sie_es: 'kocht', wir: 'kochen', ihr: 'kocht', sie_Sie: 'kochen' }, isIrregular: false, isSeparable: false }, exampleSentence1: 'Ich koche gern.', exampleTranslation1: 'Tôi thích nấu ăn.', exampleSentence2: 'Wir kochen zusammen Abendessen.', exampleTranslation2: 'Chúng tôi nấu bữa tối cùng nhau.' },
        { word: 'Spaß', article: 'MASKULIN', plural: '-', wordType: 'NOMEN', meaningVi: 'sự vui, niềm vui', meaningEn: 'fun', exampleSentence1: 'Das macht Spaß!', exampleTranslation1: 'Cái đó vui!', exampleSentence2: 'Viel Spaß!', exampleTranslation2: 'Chúc vui!' },
    ],

    // ─── Kommunikation +2 (18→20) ───
    '12-kommunikation.json': [
        { word: 'Nachricht', article: 'FEMININ', plural: 'die Nachrichten', wordType: 'NOMEN', meaningVi: 'tin nhắn, tin tức', meaningEn: 'message, news', exampleSentence1: 'Ich schreibe eine Nachricht.', exampleTranslation1: 'Tôi viết tin nhắn.', exampleSentence2: 'Hast du meine Nachricht gelesen?', exampleTranslation2: 'Bạn đã đọc tin nhắn của tôi chưa?' },
        { word: 'Unterschrift', article: 'FEMININ', plural: 'die Unterschriften', wordType: 'NOMEN', meaningVi: 'chữ ký', meaningEn: 'signature', exampleSentence1: 'Ihre Unterschrift, bitte.', exampleTranslation1: 'Xin anh/chị ký.', exampleSentence2: 'Ich brauche Ihre Unterschrift.', exampleTranslation2: 'Tôi cần chữ ký của anh/chị.' },
    ],

    // ─── Reisen +6 (29→35) ───
    '13-reisen-verkehr.json': [
        { word: 'Taxi', article: 'NEUTRUM', plural: 'die Taxis', wordType: 'NOMEN', meaningVi: 'taxi', meaningEn: 'taxi', exampleSentence1: 'Ich nehme ein Taxi.', exampleTranslation1: 'Tôi đi taxi.', exampleSentence2: 'Das Taxi kommt in fünf Minuten.', exampleTranslation2: 'Taxi đến trong năm phút.' },
        { word: 'U-Bahn', article: 'FEMININ', plural: 'die U-Bahnen', wordType: 'NOMEN', meaningVi: 'tàu điện ngầm', meaningEn: 'subway, metro', exampleSentence1: 'Ich fahre mit der U-Bahn.', exampleTranslation1: 'Tôi đi tàu điện ngầm.', exampleSentence2: 'Die U-Bahn ist schnell.', exampleTranslation2: 'Tàu điện ngầm nhanh.' },
        { word: 'Straßenbahn', article: 'FEMININ', plural: 'die Straßenbahnen', wordType: 'NOMEN', meaningVi: 'xe điện', meaningEn: 'tram, streetcar', exampleSentence1: 'Die Straßenbahn kommt bald.', exampleTranslation1: 'Xe điện sắp đến.', exampleSentence2: 'Ich fahre mit der Straßenbahn zur Arbeit.', exampleTranslation2: 'Tôi đi xe điện đến chỗ làm.' },
        { word: 'Ampel', article: 'FEMININ', plural: 'die Ampeln', wordType: 'NOMEN', meaningVi: 'đèn giao thông', meaningEn: 'traffic light', exampleSentence1: 'Die Ampel ist rot.', exampleTranslation1: 'Đèn giao thông đỏ.', exampleSentence2: 'An der Ampel links gehen.', exampleTranslation2: 'Rẽ trái ở đèn giao thông.' },
        { word: 'Parkplatz', article: 'MASKULIN', plural: 'die Parkplätze', wordType: 'NOMEN', meaningVi: 'bãi đỗ xe', meaningEn: 'parking lot, parking space', exampleSentence1: 'Gibt es hier einen Parkplatz?', exampleTranslation1: 'Ở đây có bãi đỗ xe không?', exampleSentence2: 'Der Parkplatz ist voll.', exampleTranslation2: 'Bãi đỗ xe đầy.' },
        { word: 'Ausgang', article: 'MASKULIN', plural: 'die Ausgänge', wordType: 'NOMEN', meaningVi: 'lối ra', meaningEn: 'exit', exampleSentence1: 'Wo ist der Ausgang?', exampleTranslation1: 'Lối ra ở đâu?', exampleSentence2: 'Der Ausgang ist dort.', exampleTranslation2: 'Lối ra ở kia.' },
    ],
}

function main() {
    console.log('Phase 2: Expanding existing themes\n')

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
        } else {
            console.log(`  ⏭️  ${filename}: no new words to add`)
        }
        totalAdded += toAdd.length
    }

    console.log(`\n📊 Total words added: ${totalAdded}`)

    // Recount all files
    const fs = require('fs')
    const dir = 'content/a1/vocabulary'
    const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.json')).sort()
    let grand = 0
    for (const f of files) {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
        grand += d.words.length
    }
    console.log(`📊 Grand total across all files: ${grand} words\n`)
}

main()
