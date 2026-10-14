// UI text in two voices. {variable} is interpolated by say().
export const VOICE = {
    tagline: { normal: '', cona: 'We read the press so you don’t have to suffer through it' },
    monitor: { normal: 'Monitor · {market} · {n} sources', cona: 'Outrage thermometer · {market}' },
    topSection: { normal: 'Top coverage', cona: 'What everyone is copying' },
    moreSection: { normal: 'More stories', cona: 'Filler' },
    singles: { normal: 'Single source only', cona: 'Exclusives nobody else cares about' },
    blindspots: { normal: 'Blindspots', cona: 'Blindspots (everyone has their own)' },
    blindspotsHint: { normal: 'Stories covered almost exclusively by one side.', cona: 'What each camp prefers to ignore.' },
    saved: { normal: 'Saved', cona: 'Read-never list' },
    savedEmpty: { normal: 'Save stories from their page to read them later.', cona: 'Save things here that you will never read.' },
    footerFeeds: { normal: '{ok}/{n} feeds updated', cona: '{ok}/{n} feeds updated. The other {rest} are on a coffee break' },
    footerFeedsOne: { normal: '{ok}/{n} feeds updated', cona: '{ok}/{n} feeds updated. The other one is on a coffee break' },
    footerFeedsAll: { normal: '{ok}/{n} feeds updated', cona: '{ok}/{n} feeds updated. Not a single one on a coffee break: suspicious' },
    searchEmpty: { normal: 'No matching stories found.', cona: 'Nothing. Not even clickbait.' },
    awardsTitle: { normal: 'Daily Awards', cona: 'Daily Awards' },
    awardsIntro: { normal: 'Rankings calculated from today’s headlines.', cona: 'The {press}, evaluated with data. No hard feelings: these are their own headlines.' },
    awardsEmpty: { normal: 'No awards today.', cona: 'The press behaved today. Come back tomorrow.' },
    bingoTitle: { normal: 'Headline Bingo', cona: 'Headline Bingo' },
    bingoIntro: { normal: 'Today’s headline clichés.', cona: 'A cliché bingo card that marks itself. First outlet to call a line wins.' },
    bingoEmpty: { normal: 'No clichés today.', cona: 'Not a single cliché. Suspicious.' },
    bingoLine: { normal: 'Line: {source} at {time}', cona: 'BINGO LINE! Called by {source} at {time}' },
};

export function say(key, mode, vars = {}) {
    const entry = VOICE[key];
    if (!entry) throw new Error(`Unknown text key: ${key}`);
    const text = (mode === 'cona' && entry.cona) || entry.normal;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

export function scoreLine({ left, right }) {
    if (left === right) return 'Dead heat in the publishing league. Nobody is asking for VAR';
    const [winner, a, b] = right > left ? ['The Right', right, left] : ['The Left', left, right];
    return `${winner} leads ${a}–${b} in the publishing league. The Center is asking for VAR`;
}
