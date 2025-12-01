import type {
    Answers,
    QuestionnaireDefinition,
    ScoreResult
} from './types.js'

import {
    scoreBinaryKeyed,
    scoreMdqLike,
    scoreSumLikert,
    scoreSubscaleLikert
} from './scoring/index.js'

export class QuestionnaireEngine {
    score(def: QuestionnaireDefinition, answers: Answers): ScoreResult {
        const details: string[] = []

        if (def.scoring.kind === 'binaryKeyed') {
            const res = scoreBinaryKeyed(def.scoring, answers)
            details.push(...res.details)

            return {
                questionnaireId: def.id,
                isPositive: res.isPositive,
                score: res.score,
                maxScore: res.maxScore,
                summary: res.isPositive ? def.scoring.positiveText : def.scoring.negativeText,
                details
            }
        }

        if (def.scoring.kind === 'sumLikert') {
            const res = scoreSumLikert(def.scoring, answers)
            details.push(...res.details)

            return {
                questionnaireId: def.id,
                isPositive: res.isPositive,
                score: res.score,
                maxScore: res.maxScore,
                summary: res.isPositive ? def.scoring.positiveText : def.scoring.negativeText,
                details
            }
        }

        if (def.scoring.kind === 'subscaleLikert') {
            const res = scoreSubscaleLikert(def.scoring, answers)

            return {
                questionnaireId: def.id,
                isPositive: false,
                summary: def.scoring.summaryText,
                details: res.details
            }
        }

        if (def.scoring.kind === 'mdqLike') {
            const res = scoreMdqLike(def.scoring, answers)
            details.push(...res.details)

            return {
                questionnaireId: def.id,
                isPositive: res.isPositive,
                summary: res.isPositive ? def.scoring.positiveText : def.scoring.negativeText,
                details
            }
        }

        return {
            questionnaireId: def.id,
            isPositive: false,
            summary: 'No scoring rule matched',
            details: ['Unknown scoring rule']
        }
    }
}
