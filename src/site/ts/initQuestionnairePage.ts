import type {
    Answers,
    QuestionnaireDefinition
} from './questionnaires/types.js'

import { QuestionnaireEngine } from './questionnaires/QuestionnaireEngine.js'
import { getStoredAnswers, getStoredResult, saveResult } from './storage.js'

type InitOptions = {
    questionnaires: QuestionnaireDefinition[]
    formSelector?: string
}

type FormParts = {
    form: HTMLFormElement
    result: HTMLElement
    error: HTMLElement
}

function getEl<T extends Element>(selector: string, root: ParentNode = document): T | null {
    return root.querySelector(selector) as T | null
}

function getEls<T extends Element>(selector: string, root: ParentNode = document): T[] {
    return Array.from(root.querySelectorAll(selector)) as T[]
}

function setHidden(el: HTMLElement, hidden: boolean): void {
    if (hidden) {
        el.setAttribute('hidden', '')
        return
    }

    el.removeAttribute('hidden')
}

function readAnswers(def: QuestionnaireDefinition, form: HTMLFormElement): { answers: Answers, missing: string[] } {
    const answers: Answers = {}
    const missing: string[] = []

    for (const q of def.questions) {
        const name = 'q-' + q.id
        const selector = 'input[name="' + name + '"]:checked'
        const checked = getEl<HTMLInputElement>(selector, form)

        if (!checked) {
            if (q.required !== false) {
                missing.push(q.id)
            }
            continue
        }

        answers[q.id] = checked.value
    }

    return { answers, missing }
}

function escapeHtml(str: string): string {
    return str
        .split('&').join('&amp;')
        .split('<').join('&lt;')
        .split('>').join('&gt;')
        .split('"').join('&quot;')
        .split("'").join('&#39;')
}

function renderResult(resultEl: HTMLElement, summary: string, details: string[]): void {
    const safeDetails = details
        .map((d) => '<li>' + escapeHtml(d) + '</li>')
        .join('')

    resultEl.innerHTML =
        '<h2>' + escapeHtml(summary) + '</h2>' +
        '<ul>' + safeDetails + '</ul>'

    setHidden(resultEl, false)
}

function renderError(errorEl: HTMLElement): void {
    errorEl.innerHTML = '<p>Please answer all questions.</p>'
    setHidden(errorEl, false)
}

function clearMessages(parts: FormParts): void {
    parts.result.innerHTML = ''
    parts.error.innerHTML = ''
    setHidden(parts.result, true)
    setHidden(parts.error, true)
}

function applySavedAnswers(def: QuestionnaireDefinition, form: HTMLFormElement, answers: Answers): void {
    for (const q of def.questions) {
        const value = answers[q.id]
        if (value == null) continue
        const name = 'q-' + q.id
        const input = form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${CSS.escape(value)}"]`)
        if (input) {
            input.checked = true
        }
    }
}

function initForm(def: QuestionnaireDefinition, parts: FormParts): void {
    const engine = new QuestionnaireEngine()

    const savedAnswers = getStoredAnswers(def.id)
    if (savedAnswers) {
        applySavedAnswers(def, parts.form, savedAnswers)
    }

    const savedResult = getStoredResult(def.id)
    if (savedResult) {
        renderResult(parts.result, savedResult.result.summary, savedResult.result.details)
    }

    parts.form.addEventListener('change', () => {
        clearMessages(parts)
    })

    parts.form.addEventListener('submit', (e) => {
        e.preventDefault()
        clearMessages(parts)

        const { answers, missing } = readAnswers(def, parts.form)
        if (missing.length) {
            renderError(parts.error)
            parts.error.focus()
            return
        }

        const score = engine.score(def, answers)
        renderResult(parts.result, score.summary, score.details)
        parts.result.focus()

        saveResult(def.id, { answers, result: score })
    })
}

export function initQuestionnairePage(options: InitOptions): void {
    const formSelector = options.formSelector || 'form[data-questionnaire]'
    const forms = getEls<HTMLFormElement>(formSelector)

    const defById = new Map<string, QuestionnaireDefinition>()
    for (const q of options.questionnaires) {
        defById.set(q.id, q)
    }

    for (const form of forms) {
        const id = form.dataset.questionnaire
        if (!id) continue

        const def = defById.get(id)
        if (!def) continue

        const result = getEl<HTMLElement>('#result-' + id)
        const error = getEl<HTMLElement>('#error-' + id)

        if (!result || !error) {
            continue
        }

        result.setAttribute('tabindex', '-1')
        error.setAttribute('tabindex', '-1')

        initForm(def, { form, result, error })
    }
}
