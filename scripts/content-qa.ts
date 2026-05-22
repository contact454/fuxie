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
    references: ReferenceIndex
}

interface ReferenceIndex {
    vocabularyThemes: Set<string>
    grammarTopics: Set<string>
}

const ROOT = process.cwd()
const CONTENT_DIR = path.resolve(ROOT, getArgValue('--content-dir') || 'content')
const REPORT_PATH = path.resolve(ROOT, getArgValue('--report-path') || path.join('tmp', 'content-qa-report.md'))
const REPORT_DIR = path.dirname(REPORT_PATH)
const CEFR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
const CEFR_VERDICTS = new Set(['aligned', 'revise', 'block'])
const LEARNING_OUTCOME_SKILLS = new Set(['vocabulary', 'grammar', 'reading', 'listening', 'writing', 'speaking', 'course'])

function main() {
    if (!fs.existsSync(CONTENT_DIR)) {
        console.error(`[content-qa] Missing content directory: ${CONTENT_DIR}`)
        process.exit(1)
    }

    const files = walkJsonFiles(CONTENT_DIR)
    const context: ScanContext = {
        issues: [],
        globalIds: new Map(),
        references: buildReferenceIndex(files),
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

function buildReferenceIndex(files: string[]): ReferenceIndex {
    const references: ReferenceIndex = {
        vocabularyThemes: new Set(),
        grammarTopics: new Set(),
    }

    for (const file of files) {
        const skill = inferSkill(file)
        if (skill !== 'vocabulary' && skill !== 'grammar') continue

        let data: unknown
        try {
            data = JSON.parse(fs.readFileSync(file, 'utf8'))
        } catch {
            continue
        }

        if (skill === 'vocabulary' && isObject(data) && isObject(data.theme)) {
            const slug = getString(data.theme.slug)
            if (slug) references.vocabularyThemes.add(slug)
        }

        if (skill === 'grammar' && isObject(data) && Array.isArray(data.topics)) {
            for (const topic of data.topics) {
                if (!isObject(topic)) continue
                const slug = getString(topic.slug)
                if (slug) references.grammarTopics.add(slug)
            }
        }
    }

    return references
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
    const level = inferLevelFromFile(file)
    validateCefrAudit(file, data.cefrAudit, level, context, 'cefrAudit')
    validateLearningOutcomes(file, data.learningOutcomes, level, 'vocabulary', [themeSlug || file], context, 'learningOutcomes')

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

        if (wordType === 'VERB' && !hasPraesensConjugation(wordEntry)) {
            pushIssue(context, 'warning', 'MISSING_VERB_CONJUGATION', file, `words[${index}] verb "${word || '#'}" is missing praesens conjugation`)
        }

        if (wordType === 'NOMEN') {
            if (!getString(wordEntry.article) && !getString(wordEntry.articleStatus)) {
                pushIssue(context, 'warning', 'MISSING_NOUN_ARTICLE', file, `words[${index}] noun "${word || '#'}" is missing article`)
            }
            if (!getString(wordEntry.plural) && !getString(wordEntry.pluralStatus)) {
                pushIssue(context, 'warning', 'MISSING_NOUN_PLURAL', file, `words[${index}] noun "${word || '#'}" is missing plural`)
            }
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
            pushIssue(context, 'error', 'CIRCULAR_MEANING_DE', file, `Word "${word}" appears in its own German definition`)
        }

        if (meaningDe && meaningDe.length < 8) {
            pushIssue(context, 'warning', 'SHORT_MEANING_DE', file, `German definition for "${word || `#${index}`}" looks too short`)
        }

        validateGermanTextQuality(file, `words[${index}].exampleSentence1`, exampleSentence1, context)
        validateGermanTextQuality(file, `words[${index}].exampleSentence2`, getString(wordEntry.exampleSentence2), context)
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
        const topicLevel = getString(topic.cefrLevel) || inferLevelFromFile(file)

        if (!slug) pushIssue(context, 'error', 'MISSING_TOPIC_SLUG', file, `topics[${index}].slug is required`)
        if (!title) pushIssue(context, 'error', 'MISSING_TOPIC_TITLE', file, `topics[${index}].title is required`)
        if (!titleDe) pushIssue(context, 'warning', 'MISSING_TOPIC_TITLE_DE', file, `topics[${index}].titleDe is missing`)
        validateCefrAudit(file, topic.cefrAudit, topicLevel, context, `topics[${index}].cefrAudit`)
        validateLearningOutcomes(file, topic.learningOutcomes, topicLevel, 'grammar', [slug || `topic-${index}`], context, `topics[${index}].learningOutcomes`)
        if (!Array.isArray(rules) || rules.length === 0) {
            pushIssue(context, 'error', 'MISSING_RULES', file, `topics[${index}].rules must be non-empty`)
        }
        if (!Array.isArray(topic.exercises) || topic.exercises.length === 0) {
            pushIssue(context, 'warning', 'MISSING_GRAMMAR_EXERCISES', file, `topics[${index}].exercises should be non-empty`)
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
    const level = getString(data.level) || inferLevelFromFile(file)
    validateCefrAudit(file, data.cefrAudit, level, context, 'cefrAudit')
    validateLearningOutcomes(file, data.learningOutcomes, level, 'reading', [rootId || file], context, 'learningOutcomes')

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
    const level = getString(data.level) || inferLevelFromFile(file)
    validateCefrAudit(file, data.cefrAudit, level, context, 'cefrAudit')
    validateLearningOutcomes(file, data.learningOutcomes, level, 'listening', [getString(data.id) || file], context, 'learningOutcomes')

    const transcript = data.transcript
    if (!isObject(transcript) || !Array.isArray(transcript.lines) || transcript.lines.length === 0) {
        pushIssue(context, 'error', 'MISSING_FULL_TRANSCRIPT', file, 'transcript.lines must be present for learner review and QA')
    } else {
        validateListeningTranscript(file, data, transcript, context)
    }
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
            validateDistractors(file, `questions[${index}].options`, question.options, context)
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
            validateDistractors(file, `questions[${index}].options`, question.options, context)
        }

        validateQuestionEvidence(file, question, index, context)
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
    const level = getString(data.cefrLevel) || inferLevelFromFile(file)
    validateCefrAudit(file, data.cefrAudit, level, context, 'cefrAudit')
    validateLearningOutcomes(file, data.learningOutcomes, level, 'writing', [id || file], context, 'learningOutcomes')

    if (!Array.isArray(data.contentPoints) || data.contentPoints.length === 0) {
        pushIssue(context, 'error', 'MISSING_CONTENT_POINTS', file, 'contentPoints must be a non-empty array')
    }
    if (!getString(data.modelAnswer) && !getString(data.sampleAnswer)) {
        pushIssue(context, 'warning', 'MISSING_MODEL_ANSWER', file, 'modelAnswer or sampleAnswer should be present')
    }
    if (typeof data.timeMinutes !== 'number' && typeof data.timeLimitMinutes !== 'number' && typeof data.estimatedMinutes !== 'number') {
        pushIssue(context, 'warning', 'MISSING_TIME_LIMIT', file, 'timeMinutes, timeLimitMinutes, or estimatedMinutes should be numeric')
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

    validateGermanTextQuality(file, 'instruction', getString(data.instruction), context)
    validateGermanTextQuality(file, 'situation', getString(data.situation), context)
    validateGermanTextQuality(file, 'modelAnswer', getString(data.modelAnswer), context)
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
    const level = getString(data.cefrLevel) || inferLevelFromFile(file)
    validateCefrAudit(file, data.cefrAudit, level, context, 'cefrAudit')
    validateLearningOutcomes(file, data.learningOutcomes, level, 'speaking', [topicSlug || file], context, 'learningOutcomes')

    if (!Array.isArray(data.lessons) || data.lessons.length === 0) {
        pushIssue(context, 'error', 'MISSING_LESSONS', file, 'lessons must be a non-empty array')
        return
    }

    if (!Array.isArray(data.evaluationCriteria) && !isObject(data.rubric)) {
        pushIssue(context, 'warning', 'MISSING_SPEAKING_RUBRIC', file, 'evaluationCriteria or rubric should be present')
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

            validateGermanTextQuality(file, `lessons[${lessonIndex}].sentences[${sentenceIndex}].textDe`, getString(sentence.textDe), context)
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
        return
    }

    const courseLevel = isObject(data.course) ? getString(data.course.cefrLevel) || inferLevelFromFile(file) : inferLevelFromFile(file)
    const courseSlug = isObject(data.course) ? getString(data.course.slug) || file : file
    validateLearningOutcomes(file, data.learningOutcomes, courseLevel, 'course', [courseSlug], context, 'learningOutcomes')

    for (let index = 0; index < data.modules.length; index++) {
        const mod = data.modules[index]
        if (!isObject(mod)) {
            pushIssue(context, 'error', 'INVALID_MODULE', file, `modules[${index}] must be an object`)
            continue
        }

        for (const slug of getStringArray(mod.vocabularyThemes)) {
            if (!context.references.vocabularyThemes.has(slug)) {
                pushIssue(context, 'error', 'BROKEN_VOCABULARY_REFERENCE', file, `modules[${index}] references missing vocabulary theme "${slug}"`)
            }
        }

        for (const slug of getStringArray(mod.grammarTopics)) {
            if (!context.references.grammarTopics.has(slug)) {
                pushIssue(context, 'error', 'BROKEN_GRAMMAR_REFERENCE', file, `modules[${index}] references missing grammar topic "${slug}"`)
            }
        }

        const moduleLevel = getString(mod.cefrLevel) || courseLevel
        const moduleSlug = getString(mod.slug) || `module-${index}`
        validateCefrAudit(file, mod.cefrAudit, moduleLevel, context, `modules[${index}].cefrAudit`)
        validateLearningOutcomes(file, mod.learningOutcomes, moduleLevel, 'course', [moduleSlug], context, `modules[${index}].learningOutcomes`)
    }
}

function validateCefrAudit(file: string, value: unknown, expectedLevel: string, context: ScanContext, pathLabel: string) {
    if (!isObject(value)) {
        pushIssue(context, 'error', 'MISSING_CEFR_AUDIT', file, `${pathLabel} is required for release-candidate content`)
        return
    }

    const targetLevel = getString(value.targetLevel)
    const verdict = getString(value.verdict)
    const reviewerRole = getString(value.reviewerRole)
    const notes = getString(value.notes)
    const reviewedAt = getString(value.reviewedAt)

    if (!targetLevel || !CEFR_LEVELS.has(targetLevel)) {
        pushIssue(context, 'error', 'INVALID_CEFR_AUDIT_LEVEL', file, `${pathLabel}.targetLevel must be a CEFR level`)
    } else if (expectedLevel && targetLevel !== expectedLevel) {
        pushIssue(context, 'error', 'CEFR_AUDIT_LEVEL_MISMATCH', file, `${pathLabel}.targetLevel "${targetLevel}" does not match declared level "${expectedLevel}"`)
    }

    if (!verdict || !CEFR_VERDICTS.has(verdict)) {
        pushIssue(context, 'error', 'INVALID_CEFR_AUDIT_VERDICT', file, `${pathLabel}.verdict must be aligned, revise, or block`)
    }
    if (!reviewerRole) pushIssue(context, 'error', 'MISSING_CEFR_AUDIT_REVIEWER', file, `${pathLabel}.reviewerRole is required`)
    if (!notes || notes.length < 24) pushIssue(context, 'error', 'MISSING_CEFR_AUDIT_NOTES', file, `${pathLabel}.notes must explain the level judgment`)
    if (!reviewedAt || !/^\d{4}-\d{2}-\d{2}/.test(reviewedAt)) {
        pushIssue(context, 'error', 'INVALID_CEFR_AUDIT_DATE', file, `${pathLabel}.reviewedAt must start with YYYY-MM-DD`)
    }
}

function validateLearningOutcomes(
    file: string,
    value: unknown,
    expectedLevel: string,
    expectedSkill: string,
    expectedLinkedIds: string[],
    context: ScanContext,
    pathLabel: string
) {
    if (!Array.isArray(value) || value.length === 0) {
        pushIssue(context, 'error', 'MISSING_LEARNING_OUTCOMES', file, `${pathLabel} must be a non-empty array`)
        return
    }

    for (let index = 0; index < value.length; index++) {
        const outcome = value[index]
        if (!isObject(outcome)) {
            pushIssue(context, 'error', 'INVALID_LEARNING_OUTCOME', file, `${pathLabel}[${index}] must be an object`)
            continue
        }

        const id = getString(outcome.id)
        const cefrLevel = getString(outcome.cefrLevel)
        const skill = getString(outcome.skill)
        const canDoVi = getString(outcome.canDoVi)
        const canDoDe = getString(outcome.canDoDe)
        const linkedContentIds = getStringArray(outcome.linkedContentIds)

        if (!id) pushIssue(context, 'error', 'MISSING_LEARNING_OUTCOME_ID', file, `${pathLabel}[${index}].id is required`)
        if (!cefrLevel || !CEFR_LEVELS.has(cefrLevel)) {
            pushIssue(context, 'error', 'INVALID_LEARNING_OUTCOME_LEVEL', file, `${pathLabel}[${index}].cefrLevel must be a CEFR level`)
        } else if (expectedLevel && cefrLevel !== expectedLevel) {
            pushIssue(context, 'error', 'LEARNING_OUTCOME_LEVEL_MISMATCH', file, `${pathLabel}[${index}].cefrLevel "${cefrLevel}" does not match declared level "${expectedLevel}"`)
        }
        if (!skill || !LEARNING_OUTCOME_SKILLS.has(skill)) {
            pushIssue(context, 'error', 'INVALID_LEARNING_OUTCOME_SKILL', file, `${pathLabel}[${index}].skill must be a known learning skill`)
        } else if (expectedSkill && skill !== expectedSkill) {
            pushIssue(context, 'error', 'LEARNING_OUTCOME_SKILL_MISMATCH', file, `${pathLabel}[${index}].skill "${skill}" does not match "${expectedSkill}"`)
        }
        if (!canDoVi || canDoVi.length < 16) pushIssue(context, 'error', 'MISSING_CAN_DO_VI', file, `${pathLabel}[${index}].canDoVi is too short`)
        if (!canDoDe || canDoDe.length < 16) pushIssue(context, 'error', 'MISSING_CAN_DO_DE', file, `${pathLabel}[${index}].canDoDe is too short`)
        if (linkedContentIds.length === 0) {
            pushIssue(context, 'error', 'MISSING_LINKED_CONTENT_IDS', file, `${pathLabel}[${index}].linkedContentIds must not be empty`)
        } else if (expectedLinkedIds.length > 0 && !expectedLinkedIds.some((expected) => linkedContentIds.includes(expected))) {
            pushIssue(context, 'error', 'LEARNING_OUTCOME_LINK_MISMATCH', file, `${pathLabel}[${index}].linkedContentIds should include the owning content id`)
        }
    }
}

function validateListeningTranscript(file: string, data: Record<string, unknown>, transcript: Record<string, unknown>, context: ScanContext) {
    if (getString(transcript.status) !== 'complete') {
        pushIssue(context, 'error', 'MISSING_FULL_TRANSCRIPT', file, 'transcript.status must be "complete"')
    }
    if (getString(transcript.quality) === 'partial_evidence_only' || getString(transcript.source) === 'reconstructed_from_question_key_evidence') {
        pushIssue(context, 'error', 'PARTIAL_TRANSCRIPT_NOT_ALLOWED', file, 'transcript must be upgraded from partial evidence to a full release-candidate script')
    }

    const lines = Array.isArray(transcript.lines) ? transcript.lines : []
    const transcriptText = lines
        .map((line) => (isObject(line) ? getString(line.text) || '' : ''))
        .join('\\n')

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index]
        if (!isObject(line)) {
            pushIssue(context, 'error', 'INVALID_TRANSCRIPT_LINE', file, `transcript.lines[${index}] must be an object`)
            continue
        }
        if (!getString(line.speaker)) pushIssue(context, 'error', 'MISSING_TRANSCRIPT_SPEAKER', file, `transcript.lines[${index}].speaker is required`)
        if (!getString(line.text)) pushIssue(context, 'error', 'MISSING_TRANSCRIPT_TEXT', file, `transcript.lines[${index}].text is required`)
    }

    const questions = Array.isArray(data.questions) ? data.questions : []
    for (let index = 0; index < questions.length; index++) {
        const question = questions[index]
        if (!isObject(question)) continue
        validateQuestionEvidence(file, question, index, context)
        const evidence = getQuestionEvidence(question)
        if (evidence && !transcriptText.includes(evidence)) {
            pushIssue(context, 'error', 'TRANSCRIPT_EVIDENCE_MISMATCH', file, `questions[${index}] key evidence is not present in transcript.lines`)
        }
    }
}

function validateQuestionEvidence(file: string, question: Record<string, unknown>, index: number, context: ScanContext) {
    const evidence = getQuestionEvidence(question)
    if (!evidence) {
        pushIssue(context, 'error', 'MISSING_ANSWER_EVIDENCE', file, `questions[${index}].explanation.key_evidence is required for release-candidate QA`)
    }
}

function getQuestionEvidence(question: Record<string, unknown>) {
    const explanation = question.explanation
    if (isObject(explanation)) return getString(explanation.key_evidence)
    return getString(question.key_evidence) || getString(question.evidence)
}

function validateDistractors(file: string, pathLabel: string, options: Record<string, unknown>, context: ScanContext) {
    const values = Object.values(options)
        .map((option) => (typeof option === 'string' ? normalizeToken(option) : ''))
        .filter(Boolean)
    if (values.length < 2) {
        pushIssue(context, 'error', 'INSUFFICIENT_DISTRACTORS', file, `${pathLabel} must contain at least two non-empty choices`)
        return
    }
    if (new Set(values).size !== values.length) {
        pushIssue(context, 'error', 'DUPLICATE_DISTRACTOR_TEXT', file, `${pathLabel} contains duplicate or indistinguishable options`)
    }
}

function validateGermanTextQuality(file: string, pathLabel: string, value: string | null, context: ScanContext) {
    if (!value) return

    const suspiciousPatterns = [
        /\\bist\\s+eine\\s+gro(?:ße|sse)\\s+Stadt\\b/i,
        /\\bhat\\s+ge[a-zäöüß]+t\\b/i,
        /\\bgesich\\s+/i,
    ]

    if (suspiciousPatterns.some((pattern) => pattern.test(value))) {
        pushIssue(context, 'error', 'SUSPICIOUS_GERMAN_TEXT', file, `${pathLabel} contains a known awkward or malformed German pattern`)
    }
}

function hasPraesensConjugation(wordEntry: Record<string, unknown>) {
    const conjugation = wordEntry.conjugation
    if (!isObject(conjugation)) return false
    if (getString(conjugation.praesens)) return true
    if (!isObject(conjugation.praesens)) return false
    const praesens = conjugation.praesens
    return Boolean(
        getString(praesens.ich) &&
        getString(praesens.du) &&
        (getString(praesens.er_sie_es) || getString(praesens['er/sie/es'])) &&
        getString(praesens.wir) &&
        getString(praesens.ihr) &&
        (getString(praesens.sie_Sie) || getString(praesens['sie/Sie']))
    )
}

function getStringArray(value: unknown) {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
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

function inferLevelFromFile(file: string) {
    const normalized = file.replace(/\\/g, '/')
    const match = normalized.match(/(?:^|\/)(a1|a2|b1|b2|c1|c2)(?:\/|-)/i)
    return match ? match[1].toUpperCase() : ''
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

function getArgValue(name: string) {
    const index = process.argv.indexOf(name)
    if (index === -1) return null
    return process.argv[index + 1] || null
}

main()
