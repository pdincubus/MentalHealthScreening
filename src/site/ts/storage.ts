import type { Answers, QuestionnaireResult } from './questionnaires/types.js'

const STORAGE_KEY = 'mh-screening-results'

export type StoredResult = {
    completedAt: string
    /** Omitted when questionnaire has storeAnswers: false (e.g. C-SSRS). */
    answers?: Answers
    result: QuestionnaireResult
}

export type StoredResults = Record<string, StoredResult>

function readRaw(): StoredResults {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw) as StoredResults
        return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
        return {}
    }
}

function write(data: StoredResults): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
        // ignore quota / private mode
    }
}

/** All stored results keyed by questionnaire id */
export function getStoredResults(): StoredResults {
    return readRaw()
}

/** Last saved answers for a questionnaire (for pre-filling the form). Null if not stored (e.g. sensitive). */
export function getStoredAnswers(questionnaireId: string): Answers | null {
    const all = readRaw()
    const entry = all[questionnaireId]
    return entry?.answers ?? null
}

/** Last saved result for a questionnaire */
export function getStoredResult(questionnaireId: string): StoredResult | null {
    const all = readRaw()
    return all[questionnaireId] ?? null
}

/** Save completed result for a questionnaire. Answers are stored only when storeAnswers is true. */
export function saveResult(
    questionnaireId: string,
    payload: { answers: Answers; result: QuestionnaireResult },
    options?: { storeAnswers?: boolean }
): void {
    const storeAnswers = options?.storeAnswers !== false
    const all = readRaw()
    all[questionnaireId] = {
        completedAt: new Date().toISOString(),
        ...(storeAnswers ? { answers: payload.answers } : {}),
        result: payload.result
    }
    write(all)
}
