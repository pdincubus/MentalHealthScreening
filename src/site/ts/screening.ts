import type { QuestionnaireDefinition } from './questionnaires/types.js'
import { initQuestionnairePage } from './initQuestionnairePage.js'

function readJsonFromScript(id: string): QuestionnaireDefinition[] {
    const el = document.getElementById(id)
    if (!el) {
        return []
    }

    const raw = el.textContent || '[]'

    try {
        return JSON.parse(raw) as QuestionnaireDefinition[]
    } catch {
        return []
    }
}

const questionnaires = readJsonFromScript('questionnaires-data')

initQuestionnairePage({
    questionnaires
})
