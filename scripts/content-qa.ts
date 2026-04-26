import fs from 'node:fs'
import path from 'node:path'

type Severity = 'error' | 'warning'
type Skill = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking' | 'course' | 'unknown'

interface Issue {
    severity: Severity
    code: string
    file: string
    message: string
}

interface ScanContext {
    issues: Issue[]
    globalIds: Map<string, string>
}

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content')
const REPORT_DIR = path.join(ROOT, 'tmp')
const REPORT_PATH = path.join(REPORT_DIR, 'content-qa-report.md')

function main() {
    if (!fs.existsSync(CONTENT_DIR)) {
        console.error(`[content-qa] Missing content directory: ${CONTENT_DIR}`)
        process.exit(1)
    }

    const files = walkJsonFiles(CONTENT_DIR)
    const context: ScanContext = {
        issues: [],
        globalIds: new Map(),
    }

    for (const file of files) {
        validateFile(file, context)
    }

    writeReport(files.length, context.issues)

    const errorCount = context.issues.filter((issue) => issue.severity === 'error').length
    const warningCount = context.issues.length - errorCount

    console.log(`[content-qa] Scanned ${files.length} files`)
    console.log(`[content-qa] ${errorCount} errors, ${warningCount} warnings`)
    console.log(`[content-qa] Report: ${REPORT_PATH}`)

    if (errorCount > 0) {
        process.exit(1)
    }
}

function walkJsonFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...walkJsonFiles(fullPath))
            continue
        }

        if (!entry.name.endsWith('.json')) continue
        if (entry.name.endsWith('.qa.json')) continue
        files.push(fullPath)
    }

    return files
}

function validateFile(file: string, context: ScanContext) {
    const relativeFile = path.relative(ROOT, file)
    const skill = inferSkill(file)

    let raw = ''
    try {
        raw = fs.readFileSync(file, 'utf8')
    } catch (err) {
        pushIssue(context, 'error', 'READ_FAILED', relativeFile, errorMessage(err))
        return
    }

    let data: unknown
    try {
        data = JSON.parse(raw)
    } catch (err) {
        pushIssue(context, 'error', 'INVALID_JSON', relativeFile, errorMessage(err))
        return
    }

    switch (skill) {
        case 'vocabulary':
            validateVocabularyFile(relativeFile, data, context)
            break
        case 'grammar':
            validateGrammarFile(relativeFile, data, context)
            break
        case 'reading':
            validateReadingFile(relativeFile, data, context)
            break
        case 'listening':
            validateListeningFile(relativeFile, data, context)
            break
        case 'writing':
            validateWritingFile(relativeFile, data, context)
            break
        case 'speaking':
            validateSpeakingFile(relativeFile, data, context)
            break
        case 'course':
            validateCourseFile(relativeFile, data, context)
            break
        default:
            break
    }
}

function validateVocabularyFile(file: string, data: unknown, context: ScanContext) {
    if (!isObject(data)) {
        pushIssue(context, 'error', 'INVALID_SHAPE', file, 'Vocabulary file must be a JSON object')
        return
    }

    const theme = data.theme
    const words = data.words
    if (!isObject(theme)) {
        pushIssue(context, 'error', 'MISSING_THEME', file, 'Missing theme object')
    }
    if (!Array.isArray(words) || words.length === 0) {
        pushIssue(context, 'error', 'MISSING_WORDS', file, 'Words array is missing or empty')
        return
    }

    const themeSlug = isObject(theme) && typeof theme.slug === 'string' ? theme.slug : null
    if (!themeSlug) {
        pushIssue(context, 'error', 'MISSING_THEME_SLUG', file, 'theme.slug is required')
    } else {
        trackGlobalId(context, `vocabulary-theme:${themeSlug}`, file)
    }

    const seenWords = new Set<string>()
    for (let index = 0; index < words.length; index++) {
        const wordEntry = words[index]
        if (!isObject(wordEntry)) {
            pushIssue(context, 'error', 'INVALID_WORD_ENTRY', file, `words[${index}] must be an object`)
            continue
        }

        const word = getString(wordEntry.word)
        const wordType = getString(wordEntry.wordType)
        const meaningVi = getString(wordEntry.meaningVi)
        const meaningDe = getString(wordEntry.meaningDe)
        const exampleSentence1 = getString(wordEntry.exampleSentence1)
        const exampleTranslation1 = getString(wordEntry.exampleTranslation1)

        if (!word) pushIssue(context, 'error', 'MISSING_WORD', file, `words[${index}].word is required`)
        if (!wordType) pushIssue(context, 'error', 'MISSING_WORD_TYPE', file, `words[${index}].wordType is required`)
        if (!meaningVi) pushIssue(context, 'error', 'MISSING_MEANING_VI', file, `words[${index}].meaningVi is required`)
        if (!meaningDe) pushIssue(context, 'warning', 'MISSING_MEANING_DE', file, `words[${index}].meaningDe is missing`)
        if (!exampleSentence1 || !exampleTranslation1) {
            pushIssue(context, 'warning', 'MISSING_EXAMPLE', file, `words[${index}] is missing exampleSentence1/exampleTranslation1`)
        }

        if (word) {
            const normalizedWord = `${normalizeToken(word)}:${wordType || 'unknown'}`
            if (seenWords.has(normalizedWord)) {
                pushIssue(context, 'error', 'DUPLICATE_WORD', file, `Duplicate vocabulary entry "${word}" with same wordType`)
            } else {
                seenWords.add(normalizedWord)
            }
        }

        if (word && meaningDe && normalizeToken(word).length >= 5 && containsWholeWord(meaningDe, word)) {
            pushIssue(context, 'warning', 'CIRCULAR_MEANING_DE', file, `Word "${word}" appears in its own German definition`)
        }

        if (meaningDe && meaningDe.length < 8) {
            pushIssue(context, 'warning', 'SHORT_MEANING_DE', file, `German definition for "${word || `#${index}`}" looks too short`)
        }
    }
}

function validateGrammarFile(file: string, data: unknown, context: ScanContext) {
    if (!isObject(data) || !Array.isArray(data.topics) || data.topics.length === 0) {
        pushIssue(context, 'error', 'MISSING_TOPICS', file, 'Grammar file must contain a non-empty topics array')
        return
    }

    const seenSlugs = new Set<string>()
    for (let index = 0; index < data.topics.length; index++) {
        const topic = data.topics[index]
        if (!isObject(topic)) {
            pushIssue(context, 'error', 'INVALID_TOPIC', file, `topics[${index}] must be an object`)
            continue
        }

        const slug = getString(topic.slug)
        const title = getString(topic.title)
        const titleDe = getString(topic.titleDe)
        const rules = topic.rules

        if (!slug) pushIssue(context, 'error', 'MISSING_TOPIC_SLUG', file, `topics[${index}].slug is required`)
        if (!title) pushIssue(context, 'error', 'MISSING_TOPIC_TITLE', file, `topics[${index}].title is required`)
        if (!titleDe) pushIssue(context, 'warning', 'MISSING_TOPIC_TITLE_DE', file, `topics[${index}].titleDe is missing`)
        if (!Array.isArray(rules) || rules.length === 0) {
            pushIssue(context, 'error', 'MISSING_RULES', file, `topics[${index}].rules must be non-empty`)
        }

        if (slug) {
            if (seenSlugs.has(slug)) {
                pushIssue(context, 'error', 'DUPLICATE_TOPIC_SLUG', file, `Duplicate topic slug "${slug}"`)
            } else {
                seenSlugs.add(slug)
                trackGlobalId(context, `grammar-topic:${slug}`, file)
            }
        }
    }
}

function validateReadingFile(file: string, data: unknown, context: ScanContext) {
    if (!isObject(data)) {
        pushIssue(context, 'error', 'INVALID_SHAPE', file, 'Reading file must be a JSON object')
        return
    }

    const rootId = getString(data.id)
    if (!rootId) {
        pushIssue(context, 'error', 'MISSING_ID', file, 'id is required')
    } else {
        trackGlobalId(context, `reading:${rootId}`, file)
    }

    if (!getString(data.level)) {
        pushIssue(context, 'error', 'MISSING_LEVEL', file, 'level is required')
    }

    validateReadingQuestions(file, data, context)

    if (!hasReadingContentBlock(data)) {
        pushIssue(context, 'error', 'MISSING_READING_CONTENT', file, 'Reading file is missing a recognizable content block')
    }
}

function validateListeningFile(file: string, data: unknown, context: ScanContext) {
    if (!isObject(data)) {
        pushIssue(context, 'error', 'INVALID_SHAPE', file, 'Listening file must be a JSON object')
        return
    }

    validateExerciseWithQuestions(file, data, context, {
        idKey: 'id',
        requireTexts: false,
        requireAudioFile: true,
    })
}

function validateExerciseWithQuestions(
    file: string,
    data: Record<string, unknown>,
    context: ScanContext,
    options: { idKey: string; requireTexts: boolean; requireAudioFile: boolean }
) {
    const rootId = getString(data[options.idKey])
    if (!rootId) {
        pushIssue(context, 'error', 'MISSING_ID', file, `${options.idKey} is required`)
    } else {
        trackGlobalId(context, `${inferSkill(file)}:${rootId}`, file)
    }

    if (!getString(data.level)) {
        pushIssue(context, 'error', 'MISSING_LEVEL', file, 'level is required')
    }

    if (options.requireTexts && (!Array.isArray(data.texts) || data.texts.length === 0)) {
        pushIssue(context, 'error', 'MISSING_TEXTS', file, 'texts must be a non-empty array')
    }

    if (options.requireAudioFile && !getString(data.audio_file)) {
        pushIssue(context, 'warning', 'MISSING_AUDIO_FILE', file, 'audio_file is missing')
    }

    const questions = data.questions
    if (!Array.isArray(questions) || questions.length === 0) {
        pushIssue(context, 'error', 'MISSING_QUESTIONS', file, 'questions must be a non-empty array')
        return
    }

    const seenQuestionIds = new Set<string>()
    for (let index = 0; index < questions.length; index++) {
        const question = questions[index]
        if (!isObject(question)) {
            pushIssue(context, 'error', 'INVALID_QUESTION', file, `questions[${index}] must be an object`)
            continue
        }

        const questionId = getString(question.id)
        if (!questionId) {
            pushIssue(context, 'error', 'MISSING_QUESTION_ID', file, `questions[${index}].id is required`)
        } else if (seenQuestionIds.has(questionId)) {
            pushIssue(context, 'error', 'DUPLICATE_QUESTION_ID', file, `Duplicate question id "${questionId}"`)
        } else {
            seenQuestionIds.add(questionId)
        }

        if (!getString(question.answer)) {
            pushIssue(context, 'error', 'MISSING_ANSWER', file, `questions[${index}].answer is required`)
        }

        if (typeof question.points !== 'number') {
            pushIssue(context, 'warning', 'MISSING_POINTS', file, `questions[${index}].points should be numeric`)
        }

        if (isObject(question.options) && getString(question.answer)) {
            const answer = getString(question.answer)
            if (answer && !(answer in question.options)) {
                pushIssue(context, 'error', 'INVALID_ANSWER_OPTION', file, `questions[${index}].answer "${answer}" not found in options`)
            }
        }
    }
}

function validateReadingQuestions(file: string, data: Record<string, unknown>, context: ScanContext) {
    if (Array.isArray(data.questions) && data.questions.length > 0) {
        validateQuestionList(file, data.questions, context)
        return
    }

    const cloze = data.cloze
    if (isObject(cloze) && Array.isArray(cloze.gaps) && cloze.gaps.length > 0) {
        for (let index = 0; index < cloze.gaps.length; index++) {
            const gap = cloze.gaps[index]
            if (!isObject(gap)) {
                pushIssue(context, 'error', 'INVALID_GAP', file, `cloze.gaps[${index}] must be an object`)
                continue
            }

            if (typeof gap.pos !== 'number') {
                pushIssue(context, 'error', 'MISSING_GAP_POS', file, `cloze.gaps[${index}].pos must be numeric`)
            }

            if (!getString(gap.answer)) {
                pushIssue(context, 'error', 'MISSING_ANSWER', file, `cloze.gaps[${index}].answer is required`)
            }

            if (!isObject(gap.options) || Object.keys(gap.options).length < 2) {
                pushIssue(context, 'error', 'INVALID_GAP_OPTIONS', file, `cloze.gaps[${index}].options must contain choices`)
            } else if (getString(gap.answer) && !(getString(gap.answer) as string in gap.options)) {
                pushIssue(context, 'error', 'INVALID_ANSWER_OPTION', file, `cloze.gaps[${index}].answer not found in options`)
            }
        }
        return
    }

    const sentenceCloze = data.sentence_cloze
    if (isObject(sentenceCloze) && Array.isArray(sentenceCloze.sentences) && isObject(sentenceCloze.answers)) {
        validateMappedAnswers(file, sentenceCloze.sentences, sentenceCloze.answers, context, 'sentence_cloze')
        return
    }

    const sectionCloze = data.section_cloze
    if (isObject(sectionCloze) && Array.isArray(sectionCloze.sections) && isObject(sectionCloze.answers)) {
        validateMappedAnswers(file, sectionCloze.sections, sectionCloze.answers, context, 'section_cloze')
        return
    }

    pushIssue(context, 'error', 'MISSING_QUESTIONS', file, 'questions must be a non-empty array')
}

function validateQuestionList(file: string, questions: unknown[], context: ScanContext) {
    const seenQuestionIds = new Set<string>()
    for (let index = 0; index < questions.length; index++) {
        const question = questions[index]
        if (!isObject(question)) {
            pushIssue(context, 'error', 'INVALID_QUESTION', file, `questions[${index}] must be an object`)
            continue
        }

        const questionId = getString(question.id)
        if (!questionId) {
            pushIssue(context, 'error', 'MISSING_QUESTION_ID', file, `questions[${index}].id is required`)
        } else if (seenQuestionIds.has(questionId)) {
            pushIssue(context, 'error', 'DUPLICATE_QUESTION_ID', file, `Duplicate question id "${questionId}"`)
        } else {
            seenQuestionIds.add(questionId)
        }

        if (!getString(question.answer)) {
            pushIssue(context, 'error', 'MISSING_ANSWER', file, `questions[${index}].answer is required`)
        }

        if (typeof question.points !== 'number') {
            pushIssue(context, 'warning', 'MISSING_POINTS', file, `questions[${index}].points should be numeric`)
        }

        if (isObject(question.options) && getString(question.answer)) {
            const answer = getString(question.answer)
            if (answer && !(answer in question.options)) {
                pushIssue(context, 'error', 'INVALID_ANSWER_OPTION', file, `questions[${index}].answer "${answer}" not found in options`)
            }
        }
    }
}

function validateMappedAnswers(
    file: string,
    entries: unknown[],
    answers: Record<string, unknown>,
    context: ScanContext,
    label: 'sentence_cloze' | 'section_cloze'
) {
    const ids = new Set<string>()

    for (let index = 0; index < entries.length; index++) {
        const entry = entries[index]
        if (!isObject(entry)) {
            pushIssue(context, 'error', 'INVALID_ENTRY', file, `${label}[${index}] must be an object`)
            continue
        }

        const id = getString(entry.id)
        if (!id) {
            pushIssue(context, 'error', 'MISSING_ENTRY_ID', file, `${label}[${index}].id is required`)
            continue
        }

        ids.add(id)
    }

    const answerEntries = Object.entries(answers)
    if (answerEntries.length === 0) {
        pushIssue(context, 'error', 'MISSING_ANSWERS', file, `${label}.answers must not be empty`)
        return
    }

    for (const [gap, answerId] of answerEntries) {
        if (!/^\d+$/.test(gap)) {
            pushIssue(context, 'warning', 'NON_NUMERIC_GAP_KEY', file, `${label}.answers key "${gap}" should be numeric`)
        }

        const normalizedAnswerId = getString(answerId)
        if (!normalizedAnswerId || !ids.has(normalizedAnswerId)) {
            pushIssue(context, 'error', 'INVALID_MAPPED_ANSWER', file, `${label}.answers["${gap}"] points to missing id "${String(answerId)}"`)
        }
    }
}

function validateWritingFile(file: string, data: unknown, context: ScanContext) {
    if (!isObject(data)) {
        pushIssue(context, 'error', 'INVALID_SHAPE', file, 'Writing file must be a JSON object')
        return
    }

    const id = getString(data.id)
    if (!id) {
        pushIssue(context, 'error', 'MISSING_ID', file, 'id is required')
    } else {
        trackGlobalId(context, `writing:${id}`, file)
    }

    for (const key of ['cefrLevel', 'instruction', 'situation']) {
        if (!getString(data[key])) {
            pushIssue(context, 'error', 'MISSING_FIELD', file, `${key} is required`)
        }
    }

    if (!Array.isArray(data.contentPoints) || data.contentPoints.length === 0) {
        pushIssue(context, 'error', 'MISSING_CONTENT_POINTS', file, 'contentPoints must be a non-empty array')
    }

    const rubric = data.rubric
    if (!isObject(rubric) || !Array.isArray(rubric.criteria) || rubric.criteria.length === 0) {
        pushIssue(context, 'error', 'MISSING_RUBRIC', file, 'rubric.criteria must be a non-empty array')
        return
    }

    if (typeof rubric.maxScore !== 'number') {
        pushIssue(context, 'error', 'MISSING_RUBRIC_MAX', file, 'rubric.maxScore must be numeric')
    }

    const criterionIds = new Set<string>()
    for (let index = 0; index < rubric.criteria.length; index++) {
        const criterion = rubric.criteria[index]
        if (!isObject(criterion)) {
            pushIssue(context, 'error', 'INVALID_CRITERION', file, `rubric.criteria[${index}] must be an object`)
            continue
        }

        const criterionId = getString(criterion.id)
        if (!criterionId) {
            pushIssue(context, 'error', 'MISSING_CRITERION_ID', file, `rubric.criteria[${index}].id is required`)
        } else if (criterionIds.has(criterionId)) {
            pushIssue(context, 'error', 'DUPLICATE_CRITERION_ID', file, `Duplicate criterion id "${criterionId}"`)
        } else {
            criterionIds.add(criterionId)
        }

        if (!getString(criterion.name)) {
            pushIssue(context, 'error', 'MISSING_CRITERION_NAME', file, `rubric.criteria[${index}].name is required`)
        }
        if (typeof criterion.maxScore !== 'number') {
            pushIssue(context, 'error', 'MISSING_CRITERION_MAX', file, `rubric.criteria[${index}].maxScore must be numeric`)
        }
    }
}

function validateSpeakingFile(file: string, data: unknown, context: ScanContext) {
    if (!isObject(data)) {
        pushIssue(context, 'error', 'INVALID_SHAPE', file, 'Speaking file must be a JSON object')
        return
    }

    const topicSlug = getString(data.topicSlug)
    if (!topicSlug) {
        pushIssue(context, 'error', 'MISSING_TOPIC_SLUG', file, 'topicSlug is required')
    } else {
        trackGlobalId(context, `speaking-topic:${topicSlug}`, file)
    }

    if (!getString(data.cefrLevel)) {
        pushIssue(context, 'error', 'MISSING_LEVEL', file, 'cefrLevel is required')
    }

    if (!Array.isArray(data.lessons) || data.lessons.length === 0) {
        pushIssue(context, 'error', 'MISSING_LESSONS', file, 'lessons must be a non-empty array')
        return
    }

    const lessonIds = new Set<string>()
    for (let lessonIndex = 0; lessonIndex < data.lessons.length; lessonIndex++) {
        const lesson = data.lessons[lessonIndex]
        if (!isObject(lesson)) {
            pushIssue(context, 'error', 'INVALID_LESSON', file, `lessons[${lessonIndex}] must be an object`)
            continue
        }

        const lessonId = getString(lesson.lessonId)
        if (!lessonId) {
            pushIssue(context, 'error', 'MISSING_LESSON_ID', file, `lessons[${lessonIndex}].lessonId is required`)
        } else if (lessonIds.has(lessonId)) {
            pushIssue(context, 'error', 'DUPLICATE_LESSON_ID', file, `Duplicate lessonId "${lessonId}"`)
        } else {
            lessonIds.add(lessonId)
            trackGlobalId(context, `speaking-lesson:${lessonId}`, file)
        }

        if (!getString(lesson.titleDe)) {
            pushIssue(context, 'warning', 'MISSING_LESSON_TITLE_DE', file, `lessons[${lessonIndex}].titleDe is missing`)
        }

        if (!Array.isArray(lesson.sentences) || lesson.sentences.length === 0) {
            pushIssue(context, 'error', 'MISSING_SENTENCES', file, `lessons[${lessonIndex}].sentences must be non-empty`)
            continue
        }

        const sentenceIds = new Set<string>()
        for (let sentenceIndex = 0; sentenceIndex < lesson.sentences.length; sentenceIndex++) {
            const sentence = lesson.sentences[sentenceIndex]
            if (!isObject(sentence)) {
                pushIssue(context, 'error', 'INVALID_SENTENCE', file, `lessons[${lessonIndex}].sentences[${sentenceIndex}] must be an object`)
                continue
            }

            const sentenceId = getString(sentence.id)
            if (!sentenceId) {
                pushIssue(context, 'error', 'MISSING_SENTENCE_ID', file, `lessons[${lessonIndex}].sentences[${sentenceIndex}].id is required`)
            } else if (sentenceIds.has(sentenceId)) {
                pushIssue(context, 'error', 'DUPLICATE_SENTENCE_ID', file, `Duplicate sentence id "${sentenceId}" in lesson "${lessonId || lessonIndex}"`)
            } else {
                sentenceIds.add(sentenceId)
            }
        }
    }
}

function validateCourseFile(file: string, data: unknown, context: ScanContext) {
    if (!isObject(data)) {
        pushIssue(context, 'error', 'INVALID_SHAPE', file, 'Course file must be a JSON object')
        return
    }

    if (!isObject(data.course)) {
        pushIssue(context, 'error', 'MISSING_COURSE', file, 'course object is required')
    }

    if (!Array.isArray(data.modules) || data.modules.length === 0) {
        pushIssue(context, 'error', 'MISSING_MODULES', file, 'modules must be a non-empty array')
    }
}

function writeReport(fileCount: number, issues: Issue[]) {
    fs.mkdirSync(REPORT_DIR, { recursive: true })

    const errors = issues.filter((issue) => issue.severity === 'error')
    const warnings = issues.filter((issue) => issue.severity === 'warning')
    const topIssues = [...issues].slice(0, 200)

    const lines = [
        '# Content QA Report',
        '',
        `- Files scanned: ${fileCount}`,
        `- Errors: ${errors.length}`,
        `- Warnings: ${warnings.length}`,
        '',
        '## Top Issues',
        '',
    ]

    if (topIssues.length === 0) {
        lines.push('No issues found.')
    } else {
        for (const issue of topIssues) {
            lines.push(`- [${issue.severity.toUpperCase()}] ${issue.code} - \`${issue.file}\`: ${issue.message}`)
        }
    }

    fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8')
}

function inferSkill(file: string): Skill {
    const normalized = file.replace(/\\/g, '/')
    if (normalized.endsWith('/course.json')) return 'course'
    if (normalized.includes('/vocabulary/')) return 'vocabulary'
    if (normalized.includes('/grammar/')) return 'grammar'
    if (normalized.includes('/reading/')) return 'reading'
    if (normalized.includes('/listening/')) return 'listening'
    if (normalized.includes('/writing/')) return 'writing'
    if (normalized.includes('/speaking/')) return 'speaking'
    return 'unknown'
}

function trackGlobalId(context: ScanContext, key: string, file: string) {
    const existing = context.globalIds.get(key)
    if (existing && existing !== file) {
        pushIssue(context, 'error', 'DUPLICATE_GLOBAL_ID', file, `"${key}" already exists in ${existing}`)
        return
    }
    context.globalIds.set(key, file)
}

function pushIssue(context: ScanContext, severity: Severity, code: string, file: string, message: string) {
    context.issues.push({ severity, code, file, message })
}

function isObject(value: unknown): value is Record<string, any> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function normalizeToken(value: string) {
    return value.toLowerCase().trim()
}

function containsWholeWord(haystack: string, needle: string) {
    const normalizedNeedle = needle
        .toLowerCase()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(^|[^\\p{L}])${normalizedNeedle}([^\\p{L}]|$)`, 'iu')
    return regex.test(haystack.toLowerCase())
}

function hasReadingContentBlock(data: Record<string, unknown>) {
    const candidateKeys = [
        'texts',
        'anzeigen',
        'infotafel',
        'blog',
        'debate',
        'article',
        'text',
        'posts',
        'messages',
        'forum',
        'content',
        'schilder',
        'schedule',
        'infotext',
        'essay',
        'ratgeber',
        'opinion_texts',
        'cloze',
        'sentence_cloze',
        'section_cloze',
    ]
    return candidateKeys.some((key) => {
        const value = data[key]
        if (typeof value === 'string') return value.trim().length > 0
        if (Array.isArray(value)) return value.length > 0
        if (isObject(value)) return Object.keys(value).length > 0
        return false
    })
}

function errorMessage(err: unknown) {
    return err instanceof Error ? err.message : String(err)
}

main()
