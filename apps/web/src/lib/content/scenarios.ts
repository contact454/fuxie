import { CefrLevel } from '../constants/cefr';
import { GENERATED_SCENARIOS } from './generated_scenarios';

export interface Mission {
    id: string;
    text: string;
}

export interface Scenario {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    targetLevels: CefrLevel[];
    systemPrompt: string;
    missions: Mission[];
}

export const MANUAL_SCENARIOS: Scenario[] = [
    {
        id: 'free_talk',
        title: 'Trò chuyện Tự do',
        description: 'Tán gẫu bất kỳ chủ đề nào bạn thích với Fuxie.',
        icon: '🦊',
        category: 'Đời sống',
        targetLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        systemPrompt: 'Du bist Fuxie, ein freundlicher Deutschlehrer. Antworte kurz und präzise auf Deutsch. Sei geduldig und hilfsbereit. Führe ein offenes Gespräch über alles, was der Benutzer möchte.',
        missions: []
    },
    {
        id: 'restaurant_order',
        title: 'Tại Nhà Hàng Berlin',
        description: 'Đóng vai thực khách gọi món tại một nhà hàng Đức.',
        icon: '🍽️',
        category: 'Nhà hàng',
        targetLevels: ['A1', 'A2'],
        systemPrompt: `Du bist ein Kellner in einem traditionellen Berliner Restaurant. Der Schüler ist dein Gast. 
Deine Aufgabe ist es, das Rollenspiel realistisch zu gestalten. 
Beginne das Gespräch IMMER mit: "Guten Tag! Haben Sie reserviert oder möchten Sie die Speisekarte sehen?"
Führe den Gast durch die Bestellung von Getränken und Hauptgerichten. Antworte kurz, natürlich und freundlich.`,
        missions: [
            { id: 'm1', text: 'Chào hỏi và xin thực đơn (Speisekarte).' },
            { id: 'm2', text: 'Gọi một loại đồ uống (Ví dụ: Bier, Wasser).' },
            { id: 'm3', text: 'Gọi một món ăn chính (Ví dụ: Schnitzel, Wurst).' },
            { id: 'm4', text: 'Yêu cầu thanh toán (Zahlen bitte).' }
        ]
    },
    {
        id: 'job_interview',
        title: 'Phỏng Vấn Xin Việc',
        description: 'Luyện tập trả lời phỏng vấn cho vị trí IT.',
        icon: '💼',
        category: 'Công sở',
        targetLevels: ['B1', 'B2', 'C1', 'C2'],
        systemPrompt: `Du bist Herr Müller, ein Personalmanager (HR) bei einem Tech-Startup in München. Der Schüler bewirbt sich als Softwareentwickler.
Beginne das Gespräch IMMER mit: "Guten Morgen! Vielen Dank, dass Sie heute hier sind. Bitte stellen Sie sich kurz vor."
Stelle Fragen zu seinen Erfahrungen, Stärken und Schwächen. Sei professionell, aber ermutigend.`,
        missions: [
            { id: 'm1', text: 'Giới thiệu bản thân cơ bản (Tên, tuổi, quê quán).' },
            { id: 'm2', text: 'Nói về kinh nghiệm làm việc hoặc học tập.' },
            { id: 'm3', text: 'Nêu điểm mạnh của bản thân.' }
        ]
    },
    {
        id: 'airport_checkin',
        title: 'Làm Thủ Tục Sân Bay',
        description: 'Check-in chuyến bay đi Frankfurt.',
        icon: '✈️',
        category: 'Du lịch',
        targetLevels: ['A2', 'B1'],
        systemPrompt: `Du bist ein Mitarbeiter am Check-in-Schalter am Flughafen Frankfurt. Der Schüler ist ein Passagier.
Beginne das Gespräch IMMER mit: "Guten Tag! Ihren Pass und Ihr Ticket, bitte."
Frage nach Gepäck und Fenster- oder Gangplatz.`,
        missions: [
            { id: 'm1', text: 'Đưa hộ chiếu và vé máy bay.' },
            { id: 'm2', text: 'Ký gửi một vali (Koffer).' },
            { id: 'm3', text: 'Yêu cầu ghế gần cửa sổ (Fensterplatz).' }
        ]
    }
];

export const SCENARIOS = [...MANUAL_SCENARIOS, ...GENERATED_SCENARIOS];
