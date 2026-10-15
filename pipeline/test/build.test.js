import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from '../build.js';

const NOW = new Date('2026-10-11T20:00:00Z');
const rss = items => `<rss><channel>${items.map(([title, url]) =>
    `<item><title>${title}</title><link>${url}</link><pubDate>Sun, 11 Oct 2026 19:00:00 GMT</pubDate></item>`).join('')}</channel></rss>`;

const SOURCES = [
    { id: 's1', name: 'Uno', market: 'us', bias: -1, site: 'https://uno.es', feeds: ['https://uno.es/rss'] },
    { id: 's2', name: 'Dos', market: 'us', bias: 1, site: 'https://dos.es', feeds: ['https://dos.es/rss'] },
    { id: 's3', name: 'Tres', market: 'us', bias: 0, site: 'https://tres.es', feeds: ['https://tres.es/rss'] },
    { id: 'i1', name: 'One', market: 'intl', bias: 0, site: 'https://one.com', feeds: ['https://one.com/rss'] },
    { id: 'i2', name: 'Two', market: 'intl', bias: 2, site: 'https://two.com', feeds: ['https://two.com/rss'] },
    { id: 'm1', name: 'Mil', market: 'military', bias: 0, site: 'https://mil.com', feeds: ['https://mil.com/rss'] },
    { id: 'u1', name: 'Ufo', market: 'mystery', bias: 0, site: 'https://ufo.com', feeds: ['https://ufo.com/rss'] },
    { id: 'v1', name: 'Viet', market: 'vn', bias: 0, site: 'https://vn.com', feeds: ['https://vn.com/rss'] },
];

const FEEDS = {
    'https://uno.es/rss': rss([['Storm forces evacuation of 2000 residents in Valencia', 'https://uno.es/dana'], ['Exclusive theater review', 'https://uno.es/teatro']]),
    'https://dos.es/rss': rss([['2000 residents evacuated in Valencia after storm', 'https://dos.es/dana']]),
    'https://tres.es/rss': rss([['Basketball league results', 'https://tres.es/acb']]),
    'https://one.com/rss': rss([['Storm hits the coast of Florida', 'https://one.com/storm']]),
    'https://mil.com/rss': rss([['Pentagon announces new defense package', 'https://mil.com/def']]),
    'https://ufo.com/rss': rss([['Pentagon releases new UAP report on unexplained aerial sightings', 'https://ufo.com/uap']]),
    'https://vn.com/rss': rss([['Việt Nam thúc đẩy chuyển đổi số quốc gia', 'https://vn.com/cds']]),
};

const fakeFetch = async url => FEEDS[url]
    ? { ok: true, status: 200, text: async () => FEEDS[url] }
    : { ok: false, status: 500, text: async () => '' };

const quiet = { warn() {}, log() {} };

test('escribe los JSON con historias agrupadas y el estado de cada feed', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'onlynews-'));
    const { feeds } = await build({ sources: SOURCES, outDir, fetchImpl: fakeFetch, now: NOW, env: {}, log: quiet });

    assert.deepEqual((await readdir(outDir)).sort(), ['intl.json', 'meta.json', 'military.json', 'mystery.json', 'sources.json', 'us.json', 'vn.json']);
    const us = JSON.parse(await readFile(path.join(outDir, 'us.json'), 'utf8'));
    assert.equal(us.market, 'us');
    assert.equal(us.generatedAt, NOW.toISOString());
    const dana = us.stories.find(s => s.sourceCount === 2);
    assert.ok(dana, 'Uno and Dos form a multi-source story');
    assert.deepEqual(dana.coverage, { left: 1, center: 0, right: 1, unrated: 0 });
    assert.equal(us.stories.filter(s => s.sourceCount === 1).length, 2);
    assert.equal(us.stories[0], dana, 'multi-source stories come first');

    const sources = JSON.parse(await readFile(path.join(outDir, 'sources.json'), 'utf8'));
    assert.deepEqual(Object.keys(sources[0]).sort(), ['bias', 'id', 'market', 'name', 'site']);

    const meta = JSON.parse(await readFile(path.join(outDir, 'meta.json'), 'utf8'));
    assert.deepEqual(meta.feeds.find(f => f.sourceId === 'i2'), { sourceId: 'i2', url: 'https://two.com/rss', ok: false, count: 0, error: 'HTTP 500' });
    assert.equal(feeds.filter(f => f.ok).length, 7);
});

test('falla si cae más de la mitad de los feeds de un mercado', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'onlynews-'));
    const broken = async url => (url === 'https://uno.es/rss' ? fakeFetch(url) : { ok: false, status: 503, text: async () => '' });
    await assert.rejects(build({ sources: SOURCES, outDir, fetchImpl: broken, now: NOW, env: {}, log: quiet }), /us/);
    assert.deepEqual(await readdir(outDir), [], 'no escribe nada si aborta');
});

test('un feed con 0 artículos recientes cuenta como fallo pero no rompe', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'onlynews-'));
    const empty = async url => (url === 'https://tres.es/rss' ? { ok: true, status: 200, text: async () => '<rss><channel></channel></rss>' } : fakeFetch(url));
    const { feeds } = await build({ sources: SOURCES, outDir, fetchImpl: empty, now: NOW, env: {}, log: quiet });
    assert.deepEqual(feeds.find(f => f.sourceId === 's3'), { sourceId: 's3', url: 'https://tres.es/rss', ok: false, count: 0, error: 'No recent articles' });
});
