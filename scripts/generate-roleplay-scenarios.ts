import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is required');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const matrix = [
    { level: 'A1', categories: ['Mua sắm & Siêu thị', 'Sức khỏe cơ bản'] },
    { level: 'A2', categories: ['Lên kế hoạch cuối tuần', 'Tìm kiếm nhà ở', 'Công sở cơ bản'] },
    { level: 'B1', categories: ['Giải quyết Xung đột', 'Đời sống kỹ thuật số', 'Nhà hàng (Nâng cao)'] },
    { level: 'B2', categories: ['Đàm phán Lương', 'Thuyết trình & Phản biện', 'Chính trị & Xã hội'] },
    { level: 'C1', categories: ['Phỏng vấn báo chí', 'Đạo đức & Công nghệ', 'Xử lý Khủng hoảng PR'] }
];

async function generateScenario(level: string, category: string) {
    const prompt = `Bạn là một chuyên gia ngôn ngữ tiếng Đức (CEFR).
Nhiệm vụ: Tạo một kịch bản Roleplay tiếng Đức (CEFR level ${level}) về chủ đề: "${category}".

Output PHẢI là một JSON object với format sau (không markdown, không giải thích):
{
    "id": "string_unique_english_id",
    "title": "Tên kịch bản (Tiếng Việt)",
    "description": "Mô tả ngắn gọn kịch bản (Tiếng Việt)",
    "icon": "1 emoji phù hợp",
    "category": "${category}",
    "targetLevels": ["${level}"],
    "systemPrompt": "Prompt bằng tiếng Đức cho AI đóng vai. Yêu cầu AI bắt chuyện trước, xưng hô phù hợp với ngữ cảnh, và đặt câu hỏi để dẫn dắt học viên hoàn thành nhiệm vụ.",
    "missions": [
        { "id": "m1", "text": "Nhiệm vụ 1 (Tiếng Việt)" },
        { "id": "m2", "text": "Nhiệm vụ 2 (Tiếng Việt)" },
        { "id": "m3", "text": "Nhiệm vụ 3 (Tiếng Việt)" }
    ]
}

Chú ý:
- Level ${level} yêu cầu từ vựng và ngữ pháp tương ứng.
- System prompt phải ép AI (đóng vai người bản xứ) giao tiếp tự nhiên và luôn mở đầu bằng một câu thoại.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            temperature: 0.7
        }
    });

    return JSON.parse(response.text || "{}");
}

async function main() {
    const scenarios = [];
    console.log('Generating Scenarios...');
    
    for (const item of matrix) {
        for (const cat of item.categories) {
            console.log(`- Generating [${item.level}] ${cat}...`);
            try {
                const scenario = await generateScenario(item.level, cat);
                scenarios.push(scenario);
            } catch (e) {
                console.error(`  Failed:`, e);
            }
            // Sleep to avoid rate limit
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    const fileContent = `import { Scenario } from './index';\n\nexport const GENERATED_SCENARIOS: Scenario[] = ${JSON.stringify(scenarios, null, 4)};\n`;
    
    const outputPath = path.join(process.cwd(), 'apps', 'web', 'src', 'lib', 'content', 'generated_scenarios.ts');
    fs.writeFileSync(outputPath, fileContent);
    console.log(`\n✅ Saved to ${outputPath}`);
}

main();
