import type {
    Answers,
    CrisisResource,
    QuestionnaireDefinition,
    QuestionnaireResult
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

/** Which question ids are visible given current answers (branching). */
function getVisibleQuestionIds(def: QuestionnaireDefinition, form: HTMLFormElement): Set<string> {
    const visible = new Set<string>()
    const answers: Record<string, string> = {}
    for (const q of def.questions) {
        const input = form.querySelector<HTMLInputElement>(`input[name="q-${q.id}"]:checked`)
        if (input) answers[q.id] = input.value
    }
    for (const q of def.questions) {
        if (!q.showWhen) {
            visible.add(q.id)
            continue
        }
        const refValue = answers[q.showWhen.questionId]
        if (refValue === q.showWhen.value) visible.add(q.id)
    }
    return visible
}

function readAnswers(
    def: QuestionnaireDefinition,
    form: HTMLFormElement,
    visibleIds?: Set<string>
): { answers: Answers; missing: string[] } {
    const answers: Answers = {}
    const missing: string[] = []
    const onlyVisible = visibleIds != null

    for (const q of def.questions) {
        const name = 'q-' + q.id
        const selector = 'input[name="' + name + '"]:checked'
        const checked = getEl<HTMLInputElement>(selector, form)

        if (!checked) {
            const isVisible = !onlyVisible || visibleIds!.has(q.id)
            if (isVisible && q.required !== false) {
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

function renderCrisisBlock(crisis: CrisisResource): string {
    const label = crisis.label ? escapeHtml(crisis.label) + ': ' : ''
    const line = escapeHtml(crisis.line)
    const link = crisis.url
        ? '<a href="' + escapeHtml(crisis.url) + '">' + line + '</a>'
        : line
    return (
        '<div class="result-crisis" role="alert">' +
        '<p class="result-crisis__text"><strong>' + label + link + '</strong></p>' +
        '</div>'
    )
}

function renderResult(
    resultEl: HTMLElement,
    result: QuestionnaireResult,
    crisisResource?: CrisisResource
): void {
    const details = result.details
        .map((d) => '<li>' + escapeHtml(d) + '</li>')
        .join('')

    let html = '<h2>' + escapeHtml(result.summary) + '</h2>'
    if (result.kind === 'triage' && result.level !== 'none') {
        html += '<p class="result__level"><span class="result__level-label">Level:</span> ' + escapeHtml(result.level) + '</p>'
    }
    html += '<ul>' + details + '</ul>'
    if (result.kind === 'triage' && result.showCrisis && crisisResource) {
        html += renderCrisisBlock(crisisResource)
    }

    resultEl.innerHTML = html
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

/** Toggle visibility of conditional fieldsets (branching). */
function updateBranchingVisibility(def: QuestionnaireDefinition, form: HTMLFormElement): void {
    if (def.flow !== 'branching') return
    const visibleIds = getVisibleQuestionIds(def, form)
    const fieldsets = form.querySelectorAll<HTMLFieldSetElement>('[data-question-id][data-show-when-question]')
    for (const fs of fieldsets) {
        const qid = fs.dataset.questionId
        if (!qid) continue
        setHidden(fs, !visibleIds.has(qid))
    }
}

function initForm(def: QuestionnaireDefinition, parts: FormParts): void {
    const engine = new QuestionnaireEngine()

    const savedAnswers = getStoredAnswers(def.id)
    if (savedAnswers) {
        applySavedAnswers(def, parts.form, savedAnswers)
    }
    updateBranchingVisibility(def, parts.form)

    const savedResult = getStoredResult(def.id)
    if (savedResult) {
        renderResult(parts.result, savedResult.result, def.crisisResource)
    }

    parts.form.addEventListener('change', () => {
        updateBranchingVisibility(def, parts.form)
        clearMessages(parts)
    })

    parts.form.addEventListener('submit', (e) => {
        e.preventDefault()
        clearMessages(parts)

        const visibleIds = def.flow === 'branching' ? getVisibleQuestionIds(def, parts.form) : undefined
        const { answers, missing } = readAnswers(def, parts.form, visibleIds)
        if (missing.length) {
            renderError(parts.error)
            parts.error.focus()
            return
        }

        const result = engine.score(def, answers)
        renderResult(parts.result, result, def.crisisResource)
        parts.result.focus()

        saveResult(def.id, { answers, result }, { storeAnswers: def.storeAnswers !== false })
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
