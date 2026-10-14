// Antetítulos satíricos: la primera regla que encaja gana; si ninguna, no hay chiste.
import { pick } from './pick.js';
import { isSensitive, normalizeTitle } from './guard.js';

const SIDE_NAME = { left: 'the Left', center: 'the Center', right: 'the Right' };
const OTHER = { left: 'right', right: 'left' };
const cap = text => text[0].toUpperCase() + text.slice(1);

export const WORD_WARS = [
    ['tregua', 'alto el fuego', 'pacto', 'acuerdo', 'armisticio'],
    ['detenido', 'arrestado', 'capturado'],
    ['dimite', 'cesa', 'abandona', 'destituido'],
    ['recorte', 'ajuste', 'reforma', 'tijeretazo'],
    ['okupa', 'ocupación', 'allanamiento'],
    ['inmigrante', 'migrante', 'ilegal', 'irregular'],
    ['subida', 'aumento', 'incremento', 'sablazo'],
    ['crisis', 'tensión', 'choque', 'guerra'],
    ['ceasefire', 'truce', 'deal', 'pause'],
];

function hasTerm(normalizedTitle, term) {
    const target = normalizeTitle(term);
    if (target.includes(' ')) return ` ${normalizedTitle} `.includes(` ${target} `);
    return normalizedTitle.split(' ').some(word => word.startsWith(target));
}

// Solo es «guerra» si al menos dos términos rivales vienen de medios distintos.
function wordWar(articles) {
    let best = [];
    for (const group of WORD_WARS) {
        const sourcesByTerm = new Map();
        for (const term of group) {
            const sources = new Set(articles.filter(article => hasTerm(normalizeTitle(article.title), term)).map(article => article.sourceId));
            if (sources.size) sourcesByTerm.set(term, sources);
        }
        const found = [...sourcesByTerm.keys()];
        const crossOutlet = found.some(a => found.some(b => a !== b
            && [...sourcesByTerm.get(a)].some(sa => [...sourcesByTerm.get(b)].some(sb => sa !== sb))));
        if (found.length >= 2 && crossOutlet && found.length > best.length) best = found;
    }
    return best.slice(0, 3);
}

function quoteList(terms) {
    const quoted = terms.map(term => `“${term}”`);
    return quoted.length === 2 ? quoted.join(' or ') : `${quoted.slice(0, -1).join(', ')} or ${quoted.at(-1)}`;
}

function identicalCount(story) {
    const groups = new Map();
    for (const article of story.articles) {
        const key = normalizeTitle(article.title);
        if (!groups.has(key)) groups.set(key, new Set());
        groups.get(key).add(article.sourceId);
    }
    return Math.max(0, ...[...groups.values()].map(set => set.size));
}

export function kickerFor(story, sourcesById) {
    if (isSensitive(story)) return null;
    const seed = story.id;
    const { left = 0, center = 0, right = 0 } = story.coverage ?? {};
    const rated = left + center + right;

    if (story.blindspot === 'left' || story.blindspot === 'right') {
        const side = story.blindspot;
        const other = OTHER[side];
        return pick([
            story.coverage[side] === 1
                ? `Only 1 outlet on ${SIDE_NAME[side]} noticed. ${cap(SIDE_NAME[other])} took the day off`
                : `Only ${story.coverage[side]} outlets on ${SIDE_NAME[side]} noticed. ${cap(SIDE_NAME[other])} took the day off`,
            `${cap(SIDE_NAME[other])} has yet to confirm this actually happened`,
            `Exclusive news for readers on ${SIDE_NAME[side]}`,
        ], seed);
    }

    const copies = identicalCount(story);
    if (copies >= 3) {
        return pick([
            `${copies} outlets came up with the exact same sentence at once. Wire service is proud`,
            `Originality record: ${copies} identical headlines`,
        ], seed);
    }

    const terms = wordWar(story.articles);
    if (terms.length >= 2) {
        return pick([
            `${quoteList(terms)}: depends on who you ask`,
            `Outlets can’t even agree on the word: ${quoteList(terms)}`,
        ], seed);
    }

    if (story.sourceCount >= 6 && left >= 1 && center >= 1 && right >= 1) {
        return pick([
            `Miracle: ${story.sourceCount} outlets across Left, Center, and Right agree on something`,
            'Polarization paused for one story',
        ], seed);
    }

    if (story.sourceCount >= 3 && rated > 0) {
        const major = ['left', 'right', 'center'].find(side => story.coverage[side] / rated >= 0.75);
        if (major === 'center') return 'The Center is paying close attention. Both wings are checking their phones';
        if (major) return `${cap(SIDE_NAME[major])} is paying close attention. ${cap(SIDE_NAME[OTHER[major]])} is checking its phone`;
    }

    if (story.sourceCount === 1) {
        const name = sourcesById[story.articles[0].sourceId]?.name ?? story.articles[0].sourceId;
        return pick([
            `Exclusive from ${name}: the rest of the press decided this didn’t happen`,
            `${name} noticed; everyone else didn’t`,
            `Only ${name} is reporting it. The others must have their reasons`,
        ], seed);
    }
    return null;
}
