import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VOICE, say, scoreLine } from '../../site/js/satire/voice.js';

test('toda clave tiene versión normal y versión coña', () => {
    for (const [key, entry] of Object.entries(VOICE)) {
        assert.equal(typeof entry.normal, 'string', key);
        assert.ok(entry.cona && typeof entry.cona === 'string', `${key} sin versión coña`);
    }
});

test('say rellena variables y elige la voz', () => {
    assert.equal(say('footerFeeds', 'normal', { ok: 61, n: 63 }), '61/63 feeds updated');
    assert.equal(say('footerFeeds', 'cona', { ok: 61, n: 63, rest: 2 }), '61/63 feeds updated. The other 2 are on a coffee break');
    assert.equal(say('topSection', 'cona'), 'What everyone is copying');
    assert.equal(say('footerFeedsOne', 'cona', { ok: 62, n: 63 }), '62/63 feeds updated. The other one is on a coffee break');
    assert.equal(say('footerFeedsAll', 'cona', { ok: 63, n: 63 }), '63/63 feeds updated. Not a single one on a coffee break: suspicious');
    assert.throws(() => say('noExiste', 'normal'), /noExiste/);
});

test('la intro de premios nombra la prensa de cada edición', () => {
    assert.match(say('awardsIntro', 'cona', { press: 'international press' }), /international press/);
});

test('scoreLine narra el reparto como un partido', () => {
    assert.equal(scoreLine({ left: 24, center: 32, right: 44 }), 'The Right leads 44–24 in the publishing league. The Center is asking for VAR');
    assert.equal(scoreLine({ left: 50, center: 20, right: 30 }), 'The Left leads 50–30 in the publishing league. The Center is asking for VAR');
    assert.equal(scoreLine({ left: 40, center: 20, right: 40 }), 'Dead heat in the publishing league. Nobody is asking for VAR');
});
