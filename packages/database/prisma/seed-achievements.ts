/**
 * Seed script: Insert all achievements into the database
 * Usage: DATABASE_URL='...' npx tsx prisma/seed-achievements.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AchievementSeed {
    slug: string
    title: string
    titleDe: string
    description: string
    descriptionDe: string
    category: string
    conditionType: string
    conditionValue: number
    xpReward: number
}

const ACHIEVEMENTS: AchievementSeed[] = [
    // ─── Streak ──────────────────────────────────
    { slug: 'streak-3', title: 'Lửa bắt đầu', titleDe: 'Flamme entzündet', description: '3 ngày liên tiếp', descriptionDe: '3 Tage am Stück', category: 'streak', conditionType: 'current_streak', conditionValue: 3, xpReward: 15 },
    { slug: 'streak-7', title: 'Một tuần kiên trì', titleDe: 'Erste Woche', description: '7 ngày liên tiếp', descriptionDe: '7 Tage am Stück', category: 'streak', conditionType: 'current_streak', conditionValue: 7, xpReward: 50 },
    { slug: 'streak-14', title: 'Hai tuần vững vàng', titleDe: 'Zwei Wochen stark', description: '14 ngày liên tiếp', descriptionDe: '14 Tage am Stück', category: 'streak', conditionType: 'current_streak', conditionValue: 14, xpReward: 100 },
    { slug: 'streak-30', title: 'Một tháng không ngừng', titleDe: 'Ein Monat durchgehalten', description: '30 ngày liên tiếp', descriptionDe: '30 Tage am Stück', category: 'streak', conditionType: 'current_streak', conditionValue: 30, xpReward: 200 },
    { slug: 'streak-100', title: 'Trăm ngày rực lửa', titleDe: '100 Tage auf Feuer', description: '100 ngày liên tiếp', descriptionDe: '100 Tage am Stück', category: 'streak', conditionType: 'current_streak', conditionValue: 100, xpReward: 500 },
    { slug: 'streak-365', title: 'Cả năm bền bỉ', titleDe: 'Ein ganzes Jahr', description: '365 ngày liên tiếp', descriptionDe: '365 Tage am Stück', category: 'streak', conditionType: 'current_streak', conditionValue: 365, xpReward: 1000 },

    // ─── XP Milestones ───────────────────────────
    { slug: 'xp-100', title: 'Khởi đầu tốt', titleDe: 'Guter Start', description: 'Đạt 100 XP', descriptionDe: '100 XP erreicht', category: 'xp', conditionType: 'total_xp', conditionValue: 100, xpReward: 10 },
    { slug: 'xp-500', title: 'Mãnh liệt', titleDe: 'Auf dem Vormarsch', description: 'Đạt 500 XP', descriptionDe: '500 XP erreicht', category: 'xp', conditionType: 'total_xp', conditionValue: 500, xpReward: 25 },
    { slug: 'xp-1000', title: 'Ngàn điểm', titleDe: 'Tausend Punkte', description: 'Đạt 1.000 XP', descriptionDe: '1.000 XP erreicht', category: 'xp', conditionType: 'total_xp', conditionValue: 1000, xpReward: 50 },
    { slug: 'xp-5000', title: 'Năm ngàn sao', titleDe: 'Fünftausend Sterne', description: 'Đạt 5.000 XP', descriptionDe: '5.000 XP erreicht', category: 'xp', conditionType: 'total_xp', conditionValue: 5000, xpReward: 100 },
    { slug: 'xp-10000', title: 'Vạn điểm vinh quang', titleDe: 'Zehntausend Ruhm', description: 'Đạt 10.000 XP', descriptionDe: '10.000 XP erreicht', category: 'xp', conditionType: 'total_xp', conditionValue: 10000, xpReward: 200 },

    // ─── Vocabulary ──────────────────────────────
    { slug: 'words-10', title: 'Từ vựng đầu tiên', titleDe: 'Erste Wörter', description: 'Học 10 từ', descriptionDe: '10 Wörter gelernt', category: 'vocabulary', conditionType: 'total_words', conditionValue: 10, xpReward: 10 },
    { slug: 'words-50', title: 'Vốn từ cơ bản', titleDe: 'Grundwortschatz', description: 'Học 50 từ', descriptionDe: '50 Wörter gelernt', category: 'vocabulary', conditionType: 'total_words', conditionValue: 50, xpReward: 25 },
    { slug: 'words-100', title: 'Trăm từ', titleDe: 'Hundert Wörter', description: 'Học 100 từ', descriptionDe: '100 Wörter gelernt', category: 'vocabulary', conditionType: 'total_words', conditionValue: 100, xpReward: 50 },
    { slug: 'words-500', title: 'Từ điển bỏ túi', titleDe: 'Taschenwörterbuch', description: 'Học 500 từ', descriptionDe: '500 Wörter gelernt', category: 'vocabulary', conditionType: 'total_words', conditionValue: 500, xpReward: 100 },
    { slug: 'words-1000', title: 'Ngàn từ thạo', titleDe: 'Tausend Wörter', description: 'Học 1.000 từ', descriptionDe: '1.000 Wörter gelernt', category: 'vocabulary', conditionType: 'total_words', conditionValue: 1000, xpReward: 200 },

    // ─── Grammar ─────────────────────────────────
    { slug: 'grammar-5', title: 'Nền tảng ngữ pháp', titleDe: 'Grammatik-Grundlagen', description: 'Hoàn thành 5 bài ngữ pháp', descriptionDe: '5 Grammatiklektionen geschafft', category: 'grammar', conditionType: 'total_grammar_completed', conditionValue: 5, xpReward: 25 },
    { slug: 'grammar-20', title: 'Thành thạo quy tắc', titleDe: 'Regelkenner', description: 'Hoàn thành 20 bài ngữ pháp', descriptionDe: '20 Grammatiklektionen geschafft', category: 'grammar', conditionType: 'total_grammar_completed', conditionValue: 20, xpReward: 75 },
    { slug: 'grammar-50', title: 'Bậc thầy ngữ pháp', titleDe: 'Grammatik-Meister', description: 'Hoàn thành 50 bài ngữ pháp', descriptionDe: '50 Grammatiklektionen geschafft', category: 'grammar', conditionType: 'total_grammar_completed', conditionValue: 50, xpReward: 150 },

    // ─── Lessons ─────────────────────────────────
    { slug: 'lessons-5', title: 'Bắt đầu hành trình', titleDe: 'Reise begonnen', description: 'Hoàn thành 5 bài học', descriptionDe: '5 Lektionen abgeschlossen', category: 'lesson', conditionType: 'total_lessons', conditionValue: 5, xpReward: 20 },
    { slug: 'lessons-25', title: 'Học viên chăm chỉ', titleDe: 'Fleißiger Schüler', description: 'Hoàn thành 25 bài học', descriptionDe: '25 Lektionen abgeschlossen', category: 'lesson', conditionType: 'total_lessons', conditionValue: 25, xpReward: 75 },
    { slug: 'lessons-100', title: 'Trăm bài thành công', titleDe: 'Hundert Erfolge', description: 'Hoàn thành 100 bài học', descriptionDe: '100 Lektionen abgeschlossen', category: 'lesson', conditionType: 'total_lessons', conditionValue: 100, xpReward: 200 },

    // ─── Study Time ──────────────────────────────
    { slug: 'time-60', title: 'Giờ đầu tiên', titleDe: 'Erste Stunde', description: 'Học tổng cộng 1 giờ', descriptionDe: '1 Stunde insgesamt gelernt', category: 'xp', conditionType: 'total_study_minutes', conditionValue: 60, xpReward: 20 },
    { slug: 'time-600', title: 'Mười giờ học', titleDe: 'Zehn Stunden', description: 'Học tổng cộng 10 giờ', descriptionDe: '10 Stunden insgesamt gelernt', category: 'xp', conditionType: 'total_study_minutes', conditionValue: 600, xpReward: 75 },
    { slug: 'time-3000', title: 'Năm mươi giờ', titleDe: 'Fünfzig Stunden', description: 'Học tổng cộng 50 giờ', descriptionDe: '50 Stunden insgesamt gelernt', category: 'xp', conditionType: 'total_study_minutes', conditionValue: 3000, xpReward: 200 },

    // ─── SRS Cards ───────────────────────────────
    { slug: 'srs-50', title: 'Ghi nhớ bắt đầu', titleDe: 'Erste Karteikarten', description: 'Ôn tập 50 thẻ SRS', descriptionDe: '50 SRS-Karten gelernt', category: 'vocabulary', conditionType: 'total_srs_cards', conditionValue: 50, xpReward: 25 },
    { slug: 'srs-200', title: 'Trí nhớ siêu phàm', titleDe: 'Super Gedächtnis', description: 'Ôn tập 200 thẻ SRS', descriptionDe: '200 SRS-Karten gelernt', category: 'vocabulary', conditionType: 'total_srs_cards', conditionValue: 200, xpReward: 75 },

    // ─── Active Days ─────────────────────────────
    { slug: 'days-7', title: 'Tuần hoạt động', titleDe: 'Aktive Woche', description: 'Hoạt động 7 ngày', descriptionDe: '7 aktive Tage', category: 'streak', conditionType: 'active_days', conditionValue: 7, xpReward: 30 },
    { slug: 'days-30', title: 'Tháng hoạt động', titleDe: 'Aktiver Monat', description: 'Hoạt động 30 ngày', descriptionDe: '30 aktive Tage', category: 'streak', conditionType: 'active_days', conditionValue: 30, xpReward: 100 },
]

async function main() {
    console.log('🏆 Seeding achievements...\n')

    for (const a of ACHIEVEMENTS) {
        await prisma.achievement.upsert({
            where: { slug: a.slug },
            update: {
                title: a.title,
                titleDe: a.titleDe,
                description: a.description,
                descriptionDe: a.descriptionDe,
                category: a.category,
                conditionType: a.conditionType,
                conditionValue: a.conditionValue,
                xpReward: a.xpReward,
            },
            create: a,
        })
    }

    console.log(`✅ Seeded ${ACHIEVEMENTS.length} achievements!`)

    // Summary by category
    const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))]
    for (const cat of categories) {
        const count = ACHIEVEMENTS.filter(a => a.category === cat).length
        console.log(`   ${cat}: ${count}`)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
