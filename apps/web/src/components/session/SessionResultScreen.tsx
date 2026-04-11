import Image from 'next/image'

export function SessionResultScreen({ score, hearts, total, saving, onFinish }: { score: number, hearts: number, total: number, saving: boolean, onFinish: () => void }) {
    const isPerfect = hearts === 5
    const mascotImg = isPerfect ? '/mascot/core/fuxie-core-celebrate.png' : '/mascot/core/fuxie-core-happy.png'

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
            <Image src={mascotImg} alt="Mascot" width={160} height={160} className="mb-6 drop-shadow-xl" />
            
            <h2 className="text-3xl font-black text-gray-800 mb-2">
                Bài học hoàn tất!
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm">
                Bạn đã luyện tập rất tốt. Duy trì thói quen học mỗi ngày nhé!
            </p>

            <div className="flex gap-4 w-full max-w-sm mb-12">
                <div className="flex-1 bg-white border-2 border-orange-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-1">XP Đạt</div>
                    <div className="text-2xl font-black text-gray-800">+{score}</div>
                </div>
                <div className="flex-1 bg-white border-2 border-red-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-bold text-red-500 uppercase tracking-widest mb-1">Tim </div>
                    <div className="text-2xl font-black text-gray-800">{hearts} / 5</div>
                </div>
            </div>

            <button
                onClick={onFinish}
                disabled={saving}
                className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-fuxie-primary to-orange-500 text-white font-bold text-lg shadow-[0_8px_0_0_rgb(221,98,40)] hover:-translate-y-1 hover:shadow-[0_10px_0_0_rgb(221,98,40)] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? 'Đang lưu...' : 'Tiếp Tục'}
            </button>
        </div>
    )
}
