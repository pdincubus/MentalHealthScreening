import type { Answers, SumLikertScoring } from '../types.js'

export type SumLikertResult = {
    score: number
    maxScore: number
    isPositive: boolean
    details: string[]
}

export function scoreSumLikert(
    scoring: SumLikertScoring,
    answers: Answers
): SumLikertResult {
    let score = 0
    const details: string[] = []

    for (const value of Object.values(answers)) {
        if (!value) continue

        const add = scoring.scoreByValue[value]
        if (typeof add === 'number') {
            score += add
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
