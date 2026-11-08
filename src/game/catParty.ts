import { beatTimeMs, nearestRhythmTarget } from "./rhythmEngine.ts";

export const CAT_PARTY_LEVEL_ID = "2-3";
export const CAT_PARTY_WINDOW_MS = 300;
export const CAT_PARTY_LEAD_MS = 1800;
export const CAT_PARTY_COUNT_MS = 2280;
export const CAT_PARTY_SONG_MS = 62_000;

type Piece = { hits: readonly number[] };
export type PartyMode = "demo" | "practice" | "song";

const small = (time: number): Piece => ({ hits: [Math.round(time)] });
const large = (time: number, gap = 720): Piece => ({ hits: [time, time + gap] });
const smallAtBeat = (beat: number) => small(beatTimeMs(beat, 90));

export type PartyTarget = { time: number; piece: number; hit: number; count: number };

function chart(pieces: readonly Piece[], duration = pieces.at(-1)!.hits.at(-1)! + 1600) {
  const targets = pieces.flatMap(({ hits }, piece) => hits.map((time, hit) => ({ time, piece, hit, count: hits.length })));
  return { pieces, targets, duration };
}

export const partyCharts = {
  demo: chart([small(2200), small(5000), large(8600), small(12200)]),
  practice: chart([small(2200), small(4800), large(7800), small(11200), small(13800), large(16600, 880), small(20200)]),
  song: chart([
    ...[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56].map(smallAtBeat),
    large(40000, 800), smallAtBeat(64),
    small(46800), small(49200), large(51600, 680), small(54600), large(57000, 900), small(59400),
  ], CAT_PARTY_SONG_MS),
};

export function findPartyHit(mode: PartyMode, time: number, resolved: ReadonlySet<PartyTarget>) {
  return nearestRhythmTarget(partyCharts[mode].targets.filter((target) => !resolved.has(target)), time, CAT_PARTY_WINDOW_MS, (target) => target.time);
}
