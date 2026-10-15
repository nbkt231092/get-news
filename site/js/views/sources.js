import { h, safeUrl } from '../dom.js';
import { loadJson } from '../data.js';
import { prefs } from '../prefs.js';
import { BIAS_LABELS, sideOf } from '../coverage.js';
import { MARKET_NAMES } from '../components.js';

const LEVELS = [-2, -1, 0, 1, 2, null];

export async function renderSources() {
    const [sources, meta] = await Promise.all([loadJson('sources'), loadJson('meta').catch(() => null)]);
    document.title = 'Sources · OnlyNews';
    const feedOk = new Map();
    for (const feed of meta?.feeds ?? []) feedOk.set(feed.sourceId, (feedOk.get(feed.sourceId) ?? false) || feed.ok);
    const hidden = prefs.hiddenSources();

    const sourceRow = source => {
        const checkbox = h('input', { type: 'checkbox', id: `src-${source.id}` });
        checkbox.checked = !hidden.has(source.id);
        checkbox.addEventListener('change', () => prefs.setSourceHidden(source.id, !checkbox.checked));
        const site = safeUrl(source.site);
        return h('li', { class: 'source-row' },
            checkbox,
            h('label', { for: `src-${source.id}` }, source.name),
            feedOk.get(source.id) === false ? h('span', { class: 'source-down' }, 'no data right now') : null,
            site ? h('a', { href: site, target: '_blank', rel: 'noopener noreferrer' }, new URL(site).hostname.replace(/^www\./, '')) : null);
    };

    const marketSection = market => {
        const ofMarket = sources.filter(source => source.market === market);
        return h('section', { 'aria-labelledby': `market-${market}` },
            h('h2', { id: `market-${market}`, class: 'section-title' }, MARKET_NAMES[market]),
            LEVELS.map(level => {
                const group = ofMarket.filter(source => (source.bias ?? null) === level);
                if (!group.length) return null;
                return h('div', { class: 'source-group' },
                    h('h3', {}, h('span', { class: `dot dot--${sideOf(level)}`, 'aria-hidden': 'true' }), BIAS_LABELS[String(level)]),
                    h('ul', { style: 'display:grid;gap:6px' }, group.map(sourceRow)));
            }));
    };

    return h('section', { class: 'sources-page' },
        h('h1', { class: 'page-title' }, 'How we classify media sources'),
        h('div', { class: 'prose' },
            h('p', {}, 'Each outlet is assigned an orientation on a five-level scale, from Left to Right, based on its publicly recognized editorial stance. For international outlets we rely on AllSides and Ad Fontes. ', h('strong', {}, 'This is an indicative classification'), ', not a judgment on the quality of any outlet.'),
            h('p', {}, 'The coverage bar counts ', h('strong', {}, 'distinct outlets'), ': blue for Left and Center-left, gray for Center, and red for Center-right and Right. Wire agencies and public broadcasters are placed in the Center; fact-checkers remain unrated.'),
            h('p', {}, 'A story is marked as a ', h('strong', {}, 'blindspot'), ' when it is covered by at least 3 outlets, one side accounts for 80% or more of rated outlets, and no outlet on the opposite side has published it.'),
            h('p', {}, 'Uncheck an outlet to hide it from your front page; coverage is recalculated without it. Preferences are saved only in this browser.')),
        marketSection('us'),
        marketSection('military'),
        marketSection('mystery'),
        marketSection('intl'),
        marketSection('vn'));
}
