import type { Answers, AsrsLikeScoring } from '../types.js'

export type AsrsLikeResult = {
    score: number
    maxScore: number
    isPositive: boolean
    details: string[]
}

export function scoreAsrsLike(
    scoring: AsrsLikeScoring,
    answers: Answers
): AsrsLikeResult {
    const oftenSet = new Set(scoring.oftenValues)
    const veryOftenSet = new Set(scoring.veryOftenValues)

    let score = 0
    const details: string[] = []

    for (const id of scoring.oftenCountIds) {
        const value = answers[id]
        if (value && oftenSet.has(value)) score += 1
    }
    for (const id of scoring.veryOftenCountIds) {
        const value = answers[id]
        if (value && veryOftenSet.has(value)) score += 1
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
