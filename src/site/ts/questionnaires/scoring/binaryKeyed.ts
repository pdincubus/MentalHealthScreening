import type { Answers, BinaryKeyedScoring } from '../types.js'

export type BinaryKeyedResult = {
    score: number
    maxScore: number
    isPositive: boolean
    details: string[]
}

export function scoreBinaryKeyed(
    scoring: BinaryKeyedScoring,
    answers: Answers
): BinaryKeyedResult {
    const agree = new Set(scoring.agreeValues)
    const disagree = new Set(scoring.disagreeValues)

    let score = 0
    const details: string[] = []

    for (const id of scoring.keyedIds) {
        const value = answers[id]
        if (!value) continue

        if (agree.has(value)) {
            score += 1
        }
    }

    for (const id of scoring.reverseKeyedIds) {
        const value = answers[id]
        if (!value) continue

        if (disagree.has(value)) {
            score += 1
        }
    }

    details.push('Score ' + score + ' out of ' + scoring.maxScore)
    details.push('Screen threshold ' + scoring.threshold + ' out of ' + scoring.maxScore)

    return {
        score,
        maxScore: scoring.maxScore,
        isPositive: score >= scoring.threshold,
        details
    }
}
