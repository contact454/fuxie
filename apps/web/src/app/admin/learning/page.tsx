import { prisma } from '@fuxie/database'
import { getStudentRiskProfile, summarizeClassroomAnalytics } from '@/lib/analytics/teacher-analytics'
import LearningClient from './LearningClient'

export const dynamic = 'force-dynamic'

const SKILL_LABELS: Record<string, string> = {
  HOEREN: 'Listening',
  LESEN: 'Reading',
  SCHREIBEN: 'Writing',
  SPRECHEN: 'Speaking',
  GRAMMATIK: 'Grammar',
  WORTSCHATZ: 'Vocabulary',
}

export default async function AdminLearningPage() {
  const [learners, writingAttempts, classrooms] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'LEARNER' },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
            currentLevel: true,
            totalXp: true,
            totalStudyMinutes: true,
            totalLessonsCompleted: true,
          },
        },
        streak: {
          select: {
            currentStreak: true,
            lastActivityDate: true,
          },
        },
        dailyActivities: {
          orderBy: { date: 'desc' },
          take: 7,
          select: {
            date: true,
            totalMinutes: true,
            xpEarned: true,
            lessonsCompleted: true,
            exercisesCompleted: true,
          },
        },
        assessments: {
          orderBy: { assessedAt: 'desc' },
          take: 12,
          select: {
            skill: true,
            score: true,
          },
        },
        studentSubmissions: {
          where: { status: 'pending' },
          select: { id: true },
        },
      },
    }),
    prisma.writingAttempt.groupBy({
      by: ['exerciseId'],
      _count: { exerciseId: true },
      _avg: { percentScore: true },
      orderBy: {
        _avg: {
          percentScore: 'asc',
        },
      },
      take: 20,
    }),
    prisma.classroom.findMany({
      where: { isArchived: false },
      include: {
        teacher: {
          select: {
            email: true,
            profile: { select: { displayName: true } },
          },
        },
        enrollments: {
          where: { removedAt: null },
          include: {
            student: {
              include: {
                profile: {
                  select: {
                    displayName: true,
                    totalXp: true,
                    totalStudyMinutes: true,
                  },
                },
                streak: {
                  select: {
                    currentStreak: true,
                    lastActivityDate: true,
                  },
                },
                dailyActivities: {
                  orderBy: { date: 'desc' },
                  take: 7,
                  select: {
                    date: true,
                    totalMinutes: true,
                    xpEarned: true,
                    lessonsCompleted: true,
                    exercisesCompleted: true,
                  },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            _count: {
              select: {
                submissions: {
                  where: { status: { not: 'pending' } },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { removedAt: null },
            },
          },
        },
      },
      take: 20,
    }),
  ])

  const latestSkillScoresByLearner = new Map<string, Record<string, number>>()

  const learnerRisks = learners.map((learner) => {
    const latestSkillScores: Record<string, number> = {}
    for (const assessment of learner.assessments) {
      if (!(assessment.skill in latestSkillScores)) {
        latestSkillScores[assessment.skill] = assessment.score
      }
    }
    latestSkillScoresByLearner.set(learner.id, latestSkillScores)

    const risk = getStudentRiskProfile({
      id: learner.id,
      displayName: learner.profile?.displayName || learner.email,
      email: learner.email,
      currentLevel: learner.profile?.currentLevel || 'A1',
      totalXp: learner.profile?.totalXp || 0,
      totalStudyMinutes: learner.profile?.totalStudyMinutes || 0,
      totalLessonsCompleted: learner.profile?.totalLessonsCompleted || 0,
      currentStreak: learner.streak?.currentStreak || 0,
      lastActive: learner.streak?.lastActivityDate || null,
      dailyActivities: learner.dailyActivities,
      pendingAssignments: learner.studentSubmissions.length,
      skillScores: latestSkillScores,
    })

    return {
      id: learner.id,
      displayName: learner.profile?.displayName || learner.email,
      email: learner.email,
      currentLevel: learner.profile?.currentLevel || 'A1',
      totalXp: learner.profile?.totalXp || 0,
      risk,
    }
  })

  const skillBuckets = new Map<
    string,
    { total: number; count: number; below60Count: number }
  >()

  for (const skillScores of latestSkillScoresByLearner.values()) {
    for (const [skill, score] of Object.entries(skillScores)) {
      const current = skillBuckets.get(skill) ?? { total: 0, count: 0, below60Count: 0 }
      current.total += score
      current.count += 1
      if (score < 0.6) current.below60Count += 1
      skillBuckets.set(skill, current)
    }
  }

  const weakSkills = [...skillBuckets.entries()]
    .map(([skill, stats]) => ({
      skill,
      label: SKILL_LABELS[skill] || skill,
      averageScorePercent: Math.round((stats.total / stats.count) * 100),
      learnerCount: stats.count,
      below60RatePercent: Math.round((stats.below60Count / stats.count) * 100),
    }))
    .sort((a, b) => a.averageScorePercent - b.averageScorePercent)
    .slice(0, 6)

  const writingExerciseIds = writingAttempts.map((attempt) => attempt.exerciseId)
  const writingExercises = writingExerciseIds.length
    ? await prisma.writingExercise.findMany({
        where: { id: { in: writingExerciseIds } },
        select: {
          id: true,
          exerciseId: true,
          cefrLevel: true,
          teilName: true,
          topic: true,
        },
      })
    : []

  const writingExerciseMap = new Map(writingExercises.map((exercise) => [exercise.id, exercise]))
  const bottlenecks = writingAttempts
    .map((attempt) => {
      const exercise = writingExerciseMap.get(attempt.exerciseId)
      return {
        exerciseId: exercise?.exerciseId || attempt.exerciseId,
        topic: exercise?.topic || null,
        cefrLevel: exercise?.cefrLevel || null,
        teilName: exercise?.teilName || null,
        totalAttempts: attempt._count.exerciseId,
        averageScorePercent: Math.round((attempt._avg.percentScore || 0) * 100),
      }
    })
    .filter((attempt) => attempt.averageScorePercent < 60)

  const topClassrooms = classrooms
    .map((classroom) => {
      const summary = summarizeClassroomAnalytics(
        classroom.enrollments.map((enrollment) => ({
          id: enrollment.student.id,
          displayName: enrollment.student.profile?.displayName || enrollment.student.email,
          email: enrollment.student.email,
          totalXp: enrollment.student.profile?.totalXp || 0,
          totalStudyMinutes: enrollment.student.profile?.totalStudyMinutes || 0,
          currentStreak: enrollment.student.streak?.currentStreak || 0,
          lastActive: enrollment.student.streak?.lastActivityDate || null,
          dailyActivities: enrollment.student.dailyActivities,
        })),
        classroom.assignments.map((assignment) => ({
          id: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          submissionCount: assignment._count.submissions,
          totalStudents: classroom._count.enrollments,
        }))
      )

      return {
        id: classroom.id,
        name: classroom.name,
        cefrLevel: classroom.cefrLevel,
        teacherName: classroom.teacher.profile?.displayName || classroom.teacher.email,
        studentCount: classroom._count.enrollments,
        summary,
      }
    })
    .filter((classroom) => classroom.studentCount > 0)
    .sort((a, b) => {
      if (b.summary.highRiskCount !== a.summary.highRiskCount) {
        return b.summary.highRiskCount - a.summary.highRiskCount
      }
      if (b.summary.atRiskCount !== a.summary.atRiskCount) {
        return b.summary.atRiskCount - a.summary.atRiskCount
      }
      return b.summary.overdueAssignments - a.summary.overdueAssignments
    })
    .slice(0, 6)
    .map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      cefrLevel: classroom.cefrLevel,
      teacherName: classroom.teacherName,
      studentCount: classroom.studentCount,
      atRiskCount: classroom.summary.atRiskCount,
      highRiskCount: classroom.summary.highRiskCount,
      averageCompletionRate: classroom.summary.averageCompletionRate,
      overdueAssignments: classroom.summary.overdueAssignments,
    }))

  const summary = {
    learnerCount: learners.length,
    activeLast7Days: learnerRisks.filter((learner) => learner.risk.recentMinutes7d > 0).length,
    atRiskCount: learnerRisks.filter((learner) => learner.risk.level !== 'low').length,
    highRiskCount: learnerRisks.filter((learner) => learner.risk.level === 'high').length,
    averageMinutes7d:
      learners.length > 0
        ? Math.round(
            learnerRisks.reduce((sum, learner) => sum + learner.risk.recentMinutes7d, 0) / learners.length
          )
        : 0,
    pendingAssignments: learnerRisks.reduce(
      (sum, learner) => sum + learner.risk.pendingAssignments,
      0
    ),
  }

  const topRiskLearners = learnerRisks
    .filter((learner) => learner.risk.level !== 'low')
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 8)
    .map((learner) => ({
      id: learner.id,
      displayName: learner.displayName,
      email: learner.email,
      currentLevel: learner.currentLevel,
      totalXp: learner.totalXp,
      level: learner.risk.level,
      reasons: learner.risk.reasons,
      inactiveDays: learner.risk.inactiveDays,
      recentMinutes7d: learner.risk.recentMinutes7d,
      pendingAssignments: learner.risk.pendingAssignments,
      weakestSkills: learner.risk.weakestSkills.map((skill) => SKILL_LABELS[skill] || skill),
    }))

  return (
    <LearningClient
      summary={summary}
      weakSkills={weakSkills}
      bottlenecks={bottlenecks}
      topClassrooms={topClassrooms}
      topRiskLearners={topRiskLearners}
    />
  )
}
