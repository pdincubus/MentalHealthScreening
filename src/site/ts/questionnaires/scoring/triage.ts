import type { Answers, TriageResult, TriageScoring } from '../types.js'

export function scoreTriage(
    scoring: TriageScoring,
    answers: Answers,
    questionnaireId: string
): TriageResult {
    for (const levelDef of scoring.levels) {
        const value = answers[levelDef.when.questionId]
        if (value != null && levelDef.when.values.includes(value)) {
            return {
                kind: 'triage',
                questionnaireId,
                level: levelDef.level,
                summary: levelDef.summary,
                details: levelDef.details ?? [],
                showCrisis: scoring.crisisLevels.includes(levelDef.level)
            }
        }
    }

    return {
        kind: 'triage',
        questionnaireId,
        level: scoring.defaultLevel.level,
        summary: scoring.defaultLevel.summary,
        details: scoring.defaultLevel.details ?? [],
        showCrisis: scoring.crisisLevels.includes(scoring.defaultLevel.level)
    }
}
