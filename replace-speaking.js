const fs = require('fs');
let c = fs.readFileSync('apps/web/src/components/speaking/SpeakingClient.tsx', 'utf8');

c = c.replace(/🎤 Luyện nói/g, "🎤 {t('practiceSkill', { skill: 'nói', level: '' })}");
c = c.replace(/Luyện phát âm tiếng Đức theo chuẩn Goethe-Zertifikat/g, "{t('speakingDesc')}");
c = c.replace(/<span className=\{styles\.statLabel\}>Bài học<\/span>/g, "<span className={styles.statLabel}>{t('statLessons')}</span>");
c = c.replace(/<span className=\{styles\.statLabel\}>Tổng sao<\/span>/g, "<span className={styles.statLabel}>{t('statTotalStars')}</span>");
c = c.replace(/<span className=\{styles\.statLabel\}>Tiến độ<\/span>/g, "<span className={styles.statLabel}>{t('statProgress')}</span>");
c = c.replace(/· \{levelTopics\.length\} chủ đề/g, "· {t('topicCount', { count: levelTopics.length })}");
c = c.replace(/\{topic\.titleDe\} · \{topicCompleted\}\/\{topicTotal\} bài/g, "{topic.titleDe} · {t('lessonsCompletedShort', { completed: topicCompleted, total: topicTotal })}");
c = c.replace(/Chưa có thử thách nào/g, "{t('speakingEmpty')}");
c = c.replace(/Nội dung luyện nói đang được chuẩn bị\.\.\./g, "{t('speakingEmptyDesc')}");

fs.writeFileSync('apps/web/src/components/speaking/SpeakingClient.tsx', c);
