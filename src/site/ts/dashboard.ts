import type { QuestionnaireDefinition } from './questionnaires/types.js'
import type { StoredResult } from './storage.js'
import { getStoredResults } from './storage.js'

function escapeHtml(str: string): string {
    return str
        .split('&')
        .join('&amp;')
        .split('<')
        .join('&lt;')
        .split('>')
        .join('&gt;')
        .split('"')
        .join('&quot;')
        .split("'")
        .join('&#39;')
}

function formatDate(iso: string): string {
    try {
        const d = new Date(iso)
        return d.toLocaleDateString(undefined, {
            dateStyle: 'medium'
        })
    } catch {
        return ''
    }
}

function readQuestionnaires(): QuestionnaireDefinition[] {
    const el = document.getElementById('questionnaires-data')
    if (!el) return []
    try {
        return JSON.parse(el.textContent || '[]') as QuestionnaireDefinition[]
    } catch {
        return []
    }
}

function render(): void {
    const container = document.getElementById('dashboard-results')
    if (!container) return

    const stored = getStoredResults()
    const questionnaires = readQuestionnaires()
    const byId = new Map(questionnaires.map((q) => [q.id, q]))
    const entries = Object.entries(stored)

    if (entries.length === 0) {
        container.innerHTML =
            '<p class="dashboard__empty">You haven\'t taken any tests yet. Choose one below to get started.</p>'
        return
    }

    entries.sort(([, a], [, b]) => {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    })

    const cards = entries
        .map(([id, data]: [string, StoredResult]) => {
            const def = byId.get(id)
            const title = def ? escapeHtml(def.title) : escapeHtml(id)
            const summary = escapeHtml(data.result.summary)
            const date = formatDate(data.completedAt)
            const url = `/screening/${encodeURIComponent(id)}/`
            return `
        <article class="dashboard-card">
            <h2 class="dashboard-card__title">${title}</h2>
            <p class="dashboard-card__summary">${summary}</p>
            <p class="dashboard-card__meta">Completed ${escapeHtml(date)}</p>
            <a href="${escapeHtml(url)}" class="dashboard-card__link">Take again</a>
        </article>
        `
        })
        .join('')

    container.innerHTML = `<div class="dashboard-cards">${cards}</div>`
}

render()
