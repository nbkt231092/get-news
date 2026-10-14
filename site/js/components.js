// Piezas de interfaz reutilizadas por las vistas. Todo el texto de los feeds entra como texto.
import { h, safeUrl, timeAgo, plural } from './dom.js';
import { SIDES, SIDE_LABELS } from './coverage.js';
import { prefs } from './prefs.js';
import { say } from './satire/voice.js';

export const MARKET_NAMES = { us: 'United States', military: 'US Military', intl: 'International', vn: 'Vietnam' };
const SHORT = { left: 'L', center: 'C', right: 'R' };
const SEGMENT_LABELS = { left: 'LEFT', center: 'CEN', right: 'RIGHT', unrated: 'N/A' };

export function coverageBar(coverage, { large = false } = {}) {
    const present = SIDES.filter(side => coverage[side] > 0);
    const label = present.map(side => `${coverage[side]} ${SIDE_LABELS[side].toLowerCase()}`).join(', ');
    return h('div', { class: `coverage${large ? ' coverage--lg' : ''}`, role: 'img', 'aria-label': `Coverage: ${label}` },
        h('div', { class: 'coverage-bar' }, present.map(side => h('span', { class: `seg seg--${side}`, style: `flex-grow:${coverage[side]}` },
            large ? `${SEGMENT_LABELS[side]} ${coverage[side]}` : null))),
        h('div', { class: 'coverage-legend', 'aria-hidden': 'true' },
            ['left', 'center', 'right'].map(side => h('span', { class: `legend legend--${side}` }, `${SHORT[side]} ${coverage[side]}`))));
}

export function storyMeta(story) {
    return h('p', { class: 'story-meta' },
        h('span', {}, `${plural(story.sourceCount, 'source', 'sources')} · ${timeAgo(story.lastSeen)}`),
        story.blindspot
            ? h('span', { class: `badge badge--${story.blindspot}` }, `${story.blindspot === 'left' ? 'Left' : 'Right'} only`)
            : null);
}

export function storyImage(url, className) {
    const src = safeUrl(url);
    if (!src) return null;
    const img = h('img', { class: className, src, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' });
    // Si la foto no carga (404, bloqueada…), un recuadro del mismo tamaño mantiene regular el diseño.
    img.addEventListener('error', () => img.replaceWith(h('div', { class: `${className} img-fallback`, 'aria-hidden': 'true' })));
    return img;
}

const storyHref = (story, market) => `#/${market}/${story.id}`;

// Textos de interfaz en la voz del modo actual (normal o coña).
export function t(key, vars) {
    return say(key, prefs.satire ? 'cona' : 'normal', vars);
}

// Antetítulo satírico de la historia (solo existe con el modo coña activo).
export function kickerLine(story) {
    return story.kicker ? h('p', { class: 'kicker' }, story.kicker) : null;
}

export function storyTxtLine(story) {
    const summary = story.summary ?? story.articles?.[0]?.summary ?? '';
    const raw = summary ? `${story.title} — ${summary}` : story.title;
    return String(raw ?? '').replace(/\s+/g, ' ').trim();
}

export function downloadTxt(lines, prefix = 'onlynews') {
    const cleanLines = lines.map(l => String(l ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!cleanLines.length) return 0;
    const content = cleanLines.join('\r\n\r\n') + '\r\n';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}-${stamp}.txt`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return cleanLines.length;
}

export function storyCheckbox(story) {
    const cb = h('input', {
        type: 'checkbox',
        class: 'story-select-cb',
        'aria-label': `Select: ${story.title}`,
        dataset: { storyId: story.id, txtLine: storyTxtLine(story) },
    });
    cb.addEventListener('change', () => {
        cb.closest('article, li')?.classList.toggle('is-selected', cb.checked);
        window.dispatchEvent(new CustomEvent('onlynews:selection-change'));
    });
    const label = h('label', { class: 'story-select-wrap', title: 'Select story for Save to TXT' }, cb);
    label.addEventListener('click', event => event.stopPropagation());
    return label;
}

export function leadStory(story, market) {
    const summary = story.summary ?? story.articles[0]?.summary;
    return h('article', { class: 'lead selectable-item' },
        storyCheckbox(story),
        h('a', { class: 'story-link', href: storyHref(story, market) },
            storyImage(story.image, 'lead-img'),
            h('div', { class: 'lead-body' },
                kickerLine(story),
                h('h2', { class: 'story-title' }, story.title),
                summary ? h('p', { class: 'lead-summary' }, summary) : null,
                coverageBar(story.coverage, { large: true }),
                storyMeta(story))));
}

export function storyCard(story, market) {
    return h('article', { class: 'card selectable-item' },
        storyCheckbox(story),
        h('a', { class: 'story-link', href: storyHref(story, market) },
            storyImage(story.image, 'card-img'),
            h('div', { class: 'card-body' },
                kickerLine(story),
                h('h3', { class: 'story-title' }, story.title),
                coverageBar(story.coverage),
                storyMeta(story))));
}

// Grande del bloque hero de los resultados: foto arriba, titular grande y barra.
export function heroLead(story, market) {
    const summary = story.summary ?? story.articles[0]?.summary;
    return h('article', { class: 'card hero-lead selectable-item' },
        storyCheckbox(story),
        h('a', { class: 'story-link', href: storyHref(story, market) },
            storyImage(story.image, 'card-img'),
            h('div', { class: 'card-body' },
                kickerLine(story),
                h('h3', { class: 'story-title' }, story.title),
                summary ? h('p', { class: 'lead-summary' }, summary) : null,
                coverageBar(story.coverage, { large: true }),
                storyMeta(story))));
}

// Pequeña: titular, metadatos y barra; miniatura solo si hay foto.
export function storySmall(story, market) {
    return h('article', { class: 'small selectable-item' },
        storyCheckbox(story),
        h('a', { class: `story-link${story.image ? ' has-thumb' : ''}`, href: storyHref(story, market) },
            storyImage(story.image, 'small-thumb'),
            h('div', { class: 'small-body' },
                kickerLine(story),
                h('h3', { class: 'story-title' }, story.title),
                coverageBar(story.coverage),
                storyMeta(story))));
}

export function storyRow(story, market, { compact = false } = {}) {
    return h('li', { class: 'row selectable-item' },
        storyCheckbox(story),
        h('a', { class: 'story-link', href: storyHref(story, market) },
            h('div', { class: 'row-text' },
                kickerLine(story),
                h('h3', { class: 'story-title' }, story.title),
                storyMeta(story)),
            compact ? null : coverageBar(story.coverage)));
}

export function storyMini(story, market) {
    return h('li', {},
        h('a', { class: 'mini', href: storyHref(story, market) },
            h('span', { class: 'mini-title' }, story.title),
            h('span', { class: 'mini-meta' }, `${plural(story.sourceCount, 'source', 'sources')} · ${timeAgo(story.lastSeen)}`)));
}

export function blindspotPanel(stories, market) {
    const group = (side, title) => {
        const list = stories.filter(story => story.blindspot === side).slice(0, 5);
        return [
            h('h3', { class: `side-${side}` }, title),
            list.length ? h('ol', { class: 'mini-list' }, list.map(story => storyMini(story, market))) : h('p', { class: 'empty' }, 'None right now.'),
        ];
    };
    return h('section', { class: 'panel panel--blindspot', 'aria-labelledby': 'blindspots-h' },
        h('h2', { id: 'blindspots-h' }, t('blindspots')),
        h('p', { class: 'hint' }, t('blindspotsHint')),
        group('left', 'Left only'),
        group('right', 'Right only'));
}

export function savedPanel(stories, market) {
    const saved = Object.entries(prefs.saved()).filter(([, entry]) => entry.market === market);
    const byId = new Map(stories.map(story => [story.id, story]));
    const items = saved
        .sort(([, a], [, b]) => b.savedAt.localeCompare(a.savedAt))
        .slice(0, 5)
        .map(([id, entry]) => byId.has(id)
            ? storyMini(byId.get(id), market)
            : h('li', {}, h('a', { class: 'mini', href: `#/${market}/${id}` },
                h('span', { class: 'mini-title' }, entry.title),
                h('span', { class: 'mini-meta' }, 'No longer on the front page'))));
    return h('section', { class: 'panel', 'aria-labelledby': 'saved-h' },
        h('h2', { id: 'saved-h' }, t('saved')),
        items.length ? h('ol', { class: 'mini-list' }, items) : h('p', { class: 'empty' }, t('savedEmpty')),
        saved.length ? h('a', { class: 'panel-link', href: `#/${market}/guardadas` }, `View all (${saved.length})`) : null);
}

// Accesos a Premios y Bingo en el lateral de la portada, solo con el modo coña.
export function satirePanel(market) {
    if (!prefs.satire) return null;
    return h('section', { class: 'panel panel--note', 'aria-labelledby': 'satire-h' },
        h('h2', { id: 'satire-h' }, 'Today in the press'),
        h('a', { href: `#/${market}/premios` }, 'Daily Awards →'),
        h('a', { href: `#/${market}/bingo` }, 'Headline Bingo →'));
}

export function methodPanel() {
    return h('section', { class: 'panel panel--note', 'aria-labelledby': 'method-h' },
        h('h2', { id: 'method-h' }, 'How do we measure?'),
        h('p', {}, 'Each outlet has an approximate orientation, from left to right. The bar counts how many outlets from each side cover each story.'),
        h('a', { href: '#/fuentes' }, 'View sources & criteria →'));
}
