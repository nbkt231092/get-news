import { h, safeUrl } from '../dom.js';
import { loadMarket, loadJson } from '../data.js';
import { SIDE_LABELS, BIAS_LABELS, sideOf } from '../coverage.js';
import { MARKET_NAMES, storyCard, storyRow, downloadTxt } from '../components.js';

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

export function sideNavBar(market, currentSide) {
    const items = [
        { id: 'all', label: 'All Coverage', href: `#/${market}` },
        { id: 'left', label: 'Left', href: `#/${market}/left` },
        { id: 'center', label: 'Center', href: `#/${market}/center` },
        { id: 'right', label: 'Right', href: `#/${market}/right` },
        { id: 'blindspots', label: 'Blindspots', href: `#/${market}/blindspots` },
    ];
    return h('nav', { class: 'side-tabs side-page-tabs', 'aria-label': 'Filter by orientation' },
        items.map(item => h('a', {
            href: item.href,
            class: `side-tab side-tab--${item.id}${currentSide === item.id ? ' is-active' : ''}`,
            'aria-current': currentSide === item.id ? 'page' : null,
        }, item.label)));
}

function outletDirectory(sources, articleCounts, market, side, activeSourceId) {
    const sideSources = sources
        .filter(s => side === 'blindspots' ? (sideOf(s.bias) === 'left' || sideOf(s.bias) === 'right') : sideOf(s.bias) === side)
        .sort((a, b) => (a.bias ?? 0) - (b.bias ?? 0) || a.name.localeCompare(b.name));

    if (!sideSources.length) return null;

    return h('section', { class: 'panel side-outlets-panel', 'aria-label': `${MARKET_NAMES[market]} outlets` },
        h('div', { class: 'side-outlets-head' },
            h('h2', { class: 'section-title' }, `${MARKET_NAMES[market]} · ${side === 'blindspots' ? 'Left & Right' : SIDE_LABELS[side]} Newspapers (${sideSources.length})`),
            activeSourceId
                ? h('a', { class: 'btn btn--sm', href: `#/${market}/${side}` }, '✕ Clear outlet filter')
                : null),
        h('div', { class: 'chips side-outlet-chips' },
            sideSources.map(source => {
                const sSide = sideOf(source.bias);
                const count = articleCounts.get(source.id) ?? 0;
                const isSelected = activeSourceId === source.id;
                const href = isSelected ? `#/${market}/${side}` : `#/${market}/${side}?source=${encodeURIComponent(source.id)}`;
                const site = safeUrl(source.site);
                return h('div', { class: `chip side-outlet-chip${isSelected ? ' is-selected' : ''}` },
                    h('a', { href, class: 'side-outlet-filter', title: `Filter stories by ${source.name}` },
                        h('span', { class: `dot dot--${sSide}`, 'aria-hidden': 'true' }),
                        h('strong', {}, source.name),
                        h('span', { class: 'bias-label' }, ` · ${BIAS_LABELS[String(source.bias ?? null)]}`),
                        count ? h('span', { class: 'outlet-count' }, ` (${count})`) : null),
                    site ? h('a', {
                        href: site,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        class: 'outlet-ext',
                        title: `Open ${source.name} website`,
                        'aria-label': `Open ${source.name} website`,
                    }, '↗') : null);
            })));
}

export async function renderSide(market, side, sourceFilter = '') {
    const [{ stories, sourcesById }, allSources, vnData] = await Promise.all([
        loadMarket(market),
        loadJson('sources'),
        market !== 'vn' ? loadMarket('vn').catch(() => null) : Promise.resolve(null),
    ]);

    const sideTitle = side === 'blindspots' ? 'Blindspots (Left & Right)' : `${SIDE_LABELS[side]} Coverage & Newspapers`;
    document.title = `${sideTitle} · ${MARKET_NAMES[market]} · OnlyNews`;

    const marketSources = allSources.filter(s => s.market === market);
    const vnSources = allSources.filter(s => s.market === 'vn');

    const articleCounts = new Map();
    for (const story of stories) {
        for (const article of story.articles) {
            articleCounts.set(article.sourceId, (articleCounts.get(article.sourceId) ?? 0) + 1);
        }
    }

    const vnArticleCounts = new Map();
    if (vnData) {
        for (const story of vnData.stories) {
            for (const article of story.articles) {
                vnArticleCounts.set(article.sourceId, (vnArticleCounts.get(article.sourceId) ?? 0) + 1);
            }
        }
    }

    const filterBySource = list => {
        if (!sourceFilter) return list;
        return list.filter(story => story.articles.some(a => a.sourceId === sourceFilter));
    };

    if (side === 'blindspots') {
        const leftBlind = filterBySource(stories.filter(s => s.blindspot === 'left' || (s.sourceCount >= 2 && s.coverage.left > 0 && s.coverage.right === 0)));
        const rightBlind = filterBySource(stories.filter(s => s.blindspot === 'right' || (s.sourceCount >= 2 && s.coverage.right > 0 && s.coverage.left === 0)));

        let leftEl = null;
        let rightEl = null;

        leftEl = h('section', { 'aria-labelledby': 'blind-left-h' },
            sectionHeader('blind-left-h', `Left Only / Predominantly Left (${leftBlind.length})`, false, () => leftEl, `${market}-left-blindspots`),
            leftBlind.length
                ? h('div', { class: 'card-grid' }, leftBlind.map(story => storyCard(story, market)))
                : h('p', { class: 'empty' }, 'No left-only blindspot stories right now.'));

        rightEl = h('section', { 'aria-labelledby': 'blind-right-h' },
            sectionHeader('blind-right-h', `Right Only / Predominantly Right (${rightBlind.length})`, false, () => rightEl, `${market}-right-blindspots`),
            rightBlind.length
                ? h('div', { class: 'card-grid' }, rightBlind.map(story => storyCard(story, market)))
                : h('p', { class: 'empty' }, 'No right-only blindspot stories right now.'));

        return h('div', { class: 'side-page' },
            sideNavBar(market, side),
            outletDirectory(marketSources, articleCounts, market, side, sourceFilter),
            market !== 'vn' ? outletDirectory(vnSources, vnArticleCounts, 'vn', side, '') : null,
            leftEl,
            rightEl);
    }

    const opposite = side === 'left' ? 'right' : side === 'right' ? 'left' : null;
    const matchingStories = filterBySource(stories.filter(story => (story.coverage?.[side] ?? 0) > 0));
    const exclusive = opposite
        ? matchingStories.filter(story => story.sourceCount >= 2 && (story.blindspot === side || (story.coverage[opposite] ?? 0) === 0))
        : [];
    const exclusiveIds = new Set(exclusive.map(s => s.id));
    const multiStories = matchingStories
        .filter(story => story.sourceCount > 1 && !exclusiveIds.has(story.id))
        .sort((a, b) => (b.coverage[side] ?? 0) - (a.coverage[side] ?? 0) || b.sourceCount - a.sourceCount);
    const singleStories = matchingStories.filter(story => story.sourceCount === 1);

    let exclusiveEl = null;
    let multiEl = null;
    let singleEl = null;
    let vnCrossEl = null;

    if (exclusive.length) {
        exclusiveEl = h('section', { 'aria-labelledby': 'side-excl-h' },
            sectionHeader('side-excl-h', `${SIDE_LABELS[side]} Only / Uncovered by ${SIDE_LABELS[opposite]} (${exclusive.length})`, false, () => exclusiveEl, `${market}-${side}-only`),
            h('div', { class: 'card-grid' }, exclusive.slice(0, 12).map(story => storyCard(story, market))));
    }

    if (multiStories.length) {
        multiEl = h('section', { 'aria-labelledby': 'side-multi-h' },
            sectionHeader('side-multi-h', `Top Stories Covered by ${SIDE_LABELS[side]} Outlets (${multiStories.length})`, false, () => multiEl, `${market}-${side}-top`),
            h('div', { class: 'card-grid' }, multiStories.slice(0, 12).map(story => storyCard(story, market))),
            multiStories.length > 12
                ? h('ol', { class: 'story-list', style: 'margin-top:16px' }, multiStories.slice(12).map(story => storyRow(story, market)))
                : null);
    }

    if (singleStories.length) {
        singleEl = h('section', { 'aria-labelledby': 'side-single-h' },
            sectionHeader('side-single-h', `Latest Dispatches from ${SIDE_LABELS[side]} Newspapers (${singleStories.length})`, true, () => singleEl, `${market}-${side}-latest`),
            h('ol', { class: 'story-list' }, singleStories.map(story => storyRow(story, market))));
    }

    if (market !== 'vn' && vnData) {
        const vnSideStories = vnData.stories.filter(s => (s.coverage?.[side] ?? 0) > 0);
        if (vnSideStories.length) {
            vnCrossEl = h('section', { 'aria-labelledby': 'vn-side-h' },
                sectionHeader('vn-side-h', `Vietnam · ${SIDE_LABELS[side]} Newspapers Coverage (${vnSideStories.length})`, false, () => vnCrossEl, `vn-${side}`),
                h('div', { class: 'card-grid' }, vnSideStories.slice(0, 6).map(story => storyCard(story, 'vn'))),
                vnSideStories.length > 6
                    ? h('ol', { class: 'story-list', style: 'margin-top:16px' }, vnSideStories.slice(6, 18).map(story => storyRow(story, 'vn')))
                    : null);
        }
    }

    return h('div', { class: 'side-page' },
        sideNavBar(market, side),
        outletDirectory(marketSources, articleCounts, market, side, sourceFilter),
        market !== 'vn' ? outletDirectory(vnSources, vnArticleCounts, 'vn', side, '') : null,
        !matchingStories.length
            ? h('div', { class: 'notice' },
                h('h2', {}, `No stories found for ${SIDE_LABELS[side]}`),
                sourceFilter ? h('p', {}, h('a', { href: `#/${market}/${side}` }, 'Show all outlets on this side')) : null)
            : null,
        exclusiveEl,
        multiEl,
        singleEl,
        vnCrossEl);
}
