import { h, safeUrl, timeAgo } from '../dom.js';
import { loadMarket } from '../data.js';
import { prefs } from '../prefs.js';
import { SIDE_LABELS, BIAS_LABELS, sideOf } from '../coverage.js';
import { coverageBar, storyMeta, storyImage, kickerLine } from '../components.js';

function missingStory(market, id) {
    const saved = prefs.saved()[id];
    document.title = 'Story unavailable · OnlyNews';
    return h('div', { class: 'notice' },
        h('h1', {}, 'This story is no longer on the front page'),
        h('p', {}, saved
            ? `You saved “${saved.title}”, but it no longer appears in the news from the last 48h.`
            : 'It may have expired: we show news from the last 48h.'),
        h('p', {},
            h('a', { href: `#/${market}` }, 'Back to front page'),
            saved ? ' · ' : null,
            saved ? h('button', { type: 'button', class: 'btn', onclick: () => { prefs.removeSaved(id); location.hash = `#/${market}/guardadas`; } }, 'Remove from saved') : null));
}

function articleItem(article, source) {
    const url = safeUrl(article.url);
    const side = sideOf(source?.bias ?? null);
    return h('li', { class: 'article' },
        h('p', { class: 'article-source' },
            h('span', { class: `dot dot--${side}`, 'aria-hidden': 'true' }),
            source?.name ?? article.sourceId,
            h('span', { class: 'bias-label' }, `· ${BIAS_LABELS[String(source?.bias ?? null)]}`)),
        h('h3', {}, url
            ? h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, article.title)
            : article.title),
        article.summary ? h('p', { class: 'article-summary' }, article.summary) : null,
        h('p', { class: 'article-time' }, timeAgo(article.publishedAt)));
}

function column(side, articles, sourcesById, active) {
    return h('section', { class: `column column--${side}${active ? ' is-active' : ''}`, id: `col-${side}`, 'aria-label': SIDE_LABELS[side] },
        h('h2', { class: 'column-title' }, `${SIDE_LABELS[side]} · ${articles.length}`),
        articles.length
            ? h('ol', { class: 'column-list', style: 'display:grid;gap:12px' }, articles.map(article => articleItem(article, sourcesById[article.sourceId])))
            : h('p', { class: 'empty' }, 'No outlet on this side has covered the story.'));
}

export async function renderStory(market, id) {
    const { stories, sourcesById } = await loadMarket(market);
    const story = stories.find(candidate => candidate.id === id);
    if (!story) return missingStory(market, id);
    document.title = `${story.title} · OnlyNews`;

    const biasOf = article => sourcesById[article.sourceId]?.bias ?? null;
    const bySide = { left: [], center: [], right: [], unrated: [] };
    for (const article of story.articles) bySide[sideOf(biasOf(article))].push(article);
    for (const list of Object.values(bySide)) {
        list.sort((a, b) => (biasOf(a) ?? 0) - (biasOf(b) ?? 0) || b.publishedAt.localeCompare(a.publishedAt));
    }
    const sides = ['left', 'center', 'right', ...(bySide.unrated.length ? ['unrated'] : [])];
    const active = sides.reduce((best, side) => (bySide[side].length > bySide[best].length ? side : best), sides[0]);

    const columns = h('div', { class: 'columns', style: `--cols:${sides.length}` },
        sides.map(side => column(side, bySide[side], sourcesById, side === active)));
    const tabs = h('div', { class: 'side-tabs', role: 'tablist', 'aria-label': 'Coverage by orientation' },
        sides.map(side => h('button', {
            type: 'button', role: 'tab', class: `side-tab side-tab--${side}`, 'aria-controls': `col-${side}`,
            'aria-selected': String(side === active), onclick: () => selectSide(side),
        }, `${SIDE_LABELS[side]} (${bySide[side].length})`)));
    function selectSide(side) {
        for (const tab of tabs.children) tab.setAttribute('aria-selected', String(tab.classList.contains(`side-tab--${side}`)));
        for (const col of columns.children) col.classList.toggle('is-active', col.id === `col-${side}`);
    }

    const sourceIds = [...new Set(story.articles.map(article => article.sourceId))]
        .sort((a, b) => (sourcesById[a]?.bias ?? 0) - (sourcesById[b]?.bias ?? 0));
    const saveButton = h('button', { type: 'button', class: 'btn', 'aria-pressed': String(prefs.isSaved(story.id)) },
        prefs.isSaved(story.id) ? '★ Saved' : '☆ Save');
    saveButton.addEventListener('click', () => {
        const saved = prefs.toggleSaved(story, market);
        saveButton.setAttribute('aria-pressed', String(saved));
        saveButton.textContent = saved ? '★ Saved' : '☆ Save';
    });
    const copyButton = h('button', { type: 'button', class: 'btn' }, 'Copy link');
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(location.href);
            copyButton.textContent = 'Link copied';
        } catch {
            copyButton.textContent = 'Could not copy';
        }
        setTimeout(() => { copyButton.textContent = 'Copy link'; }, 2000);
    });

    return h('article', { class: 'story-page' },
        h('a', { class: 'back', href: `#/${market}` }, '← Front page'),
        h('header', { class: 'story-head' },
            h('div', { class: 'story-head-text' },
                kickerLine(story),
                h('h1', {}, story.title),
                story.summary ? h('p', { class: 'lead-summary' }, story.summary) : null,
                coverageBar(story.coverage, { large: true }),
                storyMeta(story),
                h('div', { class: 'chips', 'aria-label': 'Covered by' },
                    sourceIds.map(sourceId => h('span', { class: 'chip' },
                        h('span', { class: `dot dot--${sideOf(sourcesById[sourceId]?.bias ?? null)}`, 'aria-hidden': 'true' }),
                        sourcesById[sourceId]?.name ?? sourceId))),
                h('div', { class: 'actions' }, saveButton, copyButton)),
            storyImage(story.image, 'story-hero')),
        tabs,
        columns);
}
