export type QuestionnaireId = string

export type QuestionType =
    | 'single'

export type Option = {
    value: string
    label: string
}

export type Question = {
    id: string
    text: string
    description?: string
    type: QuestionType
    required?: boolean
    options: Option[]
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

export type ScoringRule =
    | BinaryKeyedScoring
    | SumLikertScoring
    | MdqLikeScoring

export type QuestionnaireDefinition = {
    id: QuestionnaireId
    title: string
    description: string
    disclaimer: string
    questions: Question[]
    scoring: ScoringRule
}

export type Answers = Record<string, string>

export type ScoreResult = {
    questionnaireId: QuestionnaireId
    isPositive: boolean
    score?: number
    maxScore?: number
    summary: string
    details: string[]
}
