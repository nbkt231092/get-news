import { h } from '../dom.js';
import { loadMarket } from '../data.js';
import { t, MARKET_NAMES, leadStory, storyCard, storyRow, blindspotPanel, savedPanel, methodPanel, satirePanel, downloadTxt } from '../components.js';

const GRID_SIZE = 6;

function saveSectionToTxt(containerEl, prefix, btn) {
    const checkboxes = [...containerEl.querySelectorAll('.story-select-cb')];
    if (!checkboxes.length) return;
    let checked = checkboxes.filter(cb => cb.checked);
    if (!checked.length) {
        for (const cb of checkboxes) {
            cb.checked = true;
            cb.closest('article, li')?.classList.add('is-selected');
        }
        checked = checkboxes;
        window.dispatchEvent(new CustomEvent('onlynews:selection-change'));
    }
    const lines = checked.map(cb => cb.dataset.txtLine).filter(Boolean);
    const count = downloadTxt(lines, prefix);
    if (btn && count) {
        const prev = btn.textContent;
        btn.textContent = `✓ Saved ${count} to TXT`;
        setTimeout(() => { btn.textContent = prev; }, 2200);
    }
}

function sectionHeader(id, titleText, dark, getContainer, prefix) {
    const btn = h('button', {
        type: 'button',
        class: 'btn btn--sm save-section-btn',
        title: 'Check and save stories in this section to .txt',
        onclick: event => {
            event.preventDefault();
            event.stopPropagation();
            const container = getContainer();
            if (container) saveSectionToTxt(container, prefix, btn);
        },
    }, '⬇ Save to TXT');
    return h('div', { class: 'section-head' },
        h('h2', { id, class: `section-title${dark ? ' section-title--dark' : ''}` }, titleText),
        btn);
}

export async function renderHome(market) {
    const { stories } = await loadMarket(market);
    document.title = `${MARKET_NAMES[market]} · OnlyNews`;
    if (!stories.length) {
        return h('div', { class: 'notice' },
            h('h1', {}, 'No stories to show'),
            h('p', {}, 'You may have hidden all media sources. ', h('a', { href: '#/fuentes' }, 'Check visible sources'), '.'));
    }

    const multi = stories.filter(story => story.sourceCount > 1);
    const singles = stories.filter(story => story.sourceCount === 1);
    const lead = multi.find(story => story.sourceCount >= 3) ?? multi[0] ?? singles[0];
    const rest = multi.filter(story => story !== lead);
    const otherSingles = singles.filter(story => story !== lead);

    let topSectionEl = null;
    let moreSectionEl = null;
    let singlesEl = null;

    if (rest.length) {
        topSectionEl = h('section', { 'aria-labelledby': 'top-h' },
            sectionHeader('top-h', t('topSection'), false, () => topSectionEl, `${market}-top`),
            h('div', { class: 'card-grid' }, rest.slice(0, GRID_SIZE).map(story => storyCard(story, market))));
    }

    if (rest.length > GRID_SIZE) {
        moreSectionEl = h('section', { 'aria-labelledby': 'more-h' },
            sectionHeader('more-h', t('moreSection'), true, () => moreSectionEl, `${market}-more`),
            h('ol', { class: 'story-list' }, rest.slice(GRID_SIZE).map(story => storyRow(story, market))));
    }

    if (otherSingles.length) {
        const singlesSaveBtn = h('button', {
            type: 'button',
            class: 'btn btn--sm save-section-btn',
            style: 'margin-left:12px',
            onclick: event => {
                event.preventDefault();
                event.stopPropagation();
                if (singlesEl) {
                    singlesEl.open = true;
                    saveSectionToTxt(singlesEl, `${market}-singles`, singlesSaveBtn);
                }
            },
        }, '⬇ Save to TXT');
        singlesEl = h('details', { class: 'singles' },
            h('summary', {}, `${t('singles')} (${otherSingles.length})`, singlesSaveBtn),
            h('ol', { class: 'story-list story-list--compact' }, otherSingles.map(story => storyRow(story, market, { compact: true }))));
    }

    return h('div', { class: 'home' },
        h('div', { class: 'home-main' },
            h('h1', { class: 'visually-hidden' }, `Front page · ${MARKET_NAMES[market]}`),
            leadStory(lead, market),
            topSectionEl,
            moreSectionEl,
            singlesEl),
        h('aside', { class: 'home-aside' },
            satirePanel(market),
            blindspotPanel(multi, market),
            savedPanel(stories, market),
            methodPanel()));
}
