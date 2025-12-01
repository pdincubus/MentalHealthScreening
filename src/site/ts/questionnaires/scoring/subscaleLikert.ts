import type { Answers, SubscaleLikertScoring, SubscaleBand } from '../types.js'

export type SubscaleLikertResult = {
    details: string[]
}

function findBand(bands: SubscaleBand[] | undefined, score: number): string | null {
    if (!bands || bands.length === 0) {
        return null
    }

    for (const b of bands) {
        if (score >= b.min && score <= b.max) {
            return b.label
        }
    }

    return null
}

export function scoreSubscaleLikert(
    scoring: SubscaleLikertScoring,
    answers: Answers
): SubscaleLikertResult {
    const details: string[] = []

    for (const s of scoring.subscales) {
        let raw = 0

        for (const id of s.questionIds) {
            const value = answers[id]
            if (!value) continue

            const add = scoring.scoreByValue[value]
            if (typeof add === 'number') {
                raw += add
            }
        }

        const multiplier = s.multiplier ?? 1
        const score = raw * multiplier
        const band = findBand(s.bands, score)

        details.push(s.title + ': ' + score + (band ? ' (' + band + ')' : ''))
    }

    return { details }
}