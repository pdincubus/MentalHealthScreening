export type QuestionnaireId = string

export type QuestionType =
    | 'single'

export type Option = {
    value: string
    label: string
}

/** Show this question only when another question has one of the given values. */
export type ShowWhen = {
    questionId: string
    value: string
}

export type Question = {
    id: string
    text: string
    description?: string
    type: QuestionType
    required?: boolean
    options: Option[]
    /** Show this question only when the referenced question has this value. Omit for always-visible. */
    showWhen?: ShowWhen
}

export type BinaryKeyedScoring = {
    kind: 'binaryKeyed'
    agreeValues: string[]
    disagreeValues: string[]
    keyedIds: string[]
    reverseKeyedIds: string[]
    threshold: number
    maxScore: number
    positiveText: string
    negativeText: string
}

export type SumLikertScoring = {
    kind: 'sumLikert'
    scoreByValue: Record<string, number>
    threshold: number
    maxScore: number
    positiveText: string
    negativeText: string
}

export type SubscaleBand = {
    min: number
    max: number
    label: string
}

export type SubscaleDef = {
    id: string
    title: string
    questionIds: string[]
    multiplier?: number
    bands?: SubscaleBand[]
}

export type SubscaleLikertScoring = {
    kind: 'subscaleLikert'
    scoreByValue: Record<string, number>
    subscales: SubscaleDef[]
    summaryText: string
}

export type MdqLikeScoring = {
    kind: 'mdqLike'
    symptomQuestionIds: string[]
    yesValue: string
    minYes: number
    coOccurrenceQuestionId: string
    impairmentQuestionId: string
    impairmentPositiveValues: string[]
    positiveText: string
    negativeText: string
}

/** WHO ASRS Part A: items 1–4 count Sometimes/Often/Very Often; items 5–6 count Often/Very Often only. */
export type AsrsLikeScoring = {
    kind: 'asrsLike'
    oftenCountIds: string[]
    veryOftenCountIds: string[]
    oftenValues: string[]
    veryOftenValues: string[]
    threshold: number
    maxScore: number
    positiveText: string
    negativeText: string
}

/** Triage: first matching level wins. Order from highest to lowest severity. */
export type TriageLevelDef = {
    level: string
    summary: string
    details: string[]
    /** When this question's answer is in values, this level applies. */
    when: { questionId: string; values: string[] }
}

export type TriageScoring = {
    kind: 'triage'
    levels: TriageLevelDef[]
    /** Level when no rule matches. */
    defaultLevel: { level: string; summary: string; details: string[] }
    /** Level ids that should show the crisis resource (e.g. acute, high). */
    crisisLevels: string[]
}

export type ScoringRule =
    | BinaryKeyedScoring
    | SumLikertScoring
    | SubscaleLikertScoring
    | MdqLikeScoring
    | AsrsLikeScoring
    | TriageScoring

/** Crisis resource shown when triage level is in crisisLevels (e.g. 988, crisis line). */
export type CrisisResource = {
    line: string
    url?: string
    label?: string
}

export type QuestionnaireFlow = 'linear' | 'branching'

export type QuestionnaireDefinition = {
    id: QuestionnaireId
    title: string
    description: string
    disclaimer: string
    timeframe?: string
    sourceUrl?: string
    questions: Question[]
    scoring: ScoringRule
    /** Default 'linear'. Use 'branching' for conditional questions (e.g. C-SSRS). */
    flow?: QuestionnaireFlow
    /** For triage questionnaires: shown when result level is in scoring.crisisLevels. */
    crisisResource?: CrisisResource
    /** If false, answers are not stored (only completion + result). Default true. */
    storeAnswers?: boolean
}

export type Answers = Record<string, string>

export type ScoreResult = {
    kind: 'score'
    questionnaireId: QuestionnaireId
    isPositive: boolean
    score?: number
    maxScore?: number
    summary: string
    details: string[]
}

export type TriageResult = {
    kind: 'triage'
    questionnaireId: QuestionnaireId
    level: string
    summary: string
    details: string[]
    showCrisis: boolean
}

export type QuestionnaireResult = ScoreResult | TriageResult