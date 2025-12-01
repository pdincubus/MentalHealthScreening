import type { Answers, MdqLikeScoring } from '../types.js'

export type MdqLikeResult = {
    isPositive: boolean
    details: string[]
}

export function scoreMdqLike(
    scoring: MdqLikeScoring,
    answers: Answers
): MdqLikeResult {
    const details: string[] = []

    let yesCount = 0
    for (const id of scoring.symptomQuestionIds) {
        if (answers[id] === scoring.yesValue) {
            yesCount += 1
        }
    }

    const co = answers[scoring.coOccurrenceQuestionId] === scoring.yesValue
    const impairment = answers[scoring.impairmentQuestionId]
    const impairmentOk = scoring.impairmentPositiveValues.includes(impairment)

    details.push('Yes answers ' + yesCount + ' out of ' + scoring.symptomQuestionIds.length)
    details.push('Same time period ' + (co ? 'Yes' : 'No'))
    details.push('Impact ' + (impairment || 'Not answered'))

    return {
        isPositive: yesCount >= scoring.minYes && co && impairmentOk,
        details
    }
}
