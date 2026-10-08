import { configureStore } from '@reduxjs/toolkit';
import { canJoinBassNotes, canSplitBassNote, joinBassNotes, splitBassNote, stepsWithBoundaryAt } from './edits';
import { generateDoc } from './generate';
import { realizeSong } from './realize';
import { SongDoc } from './doc';
import { songReducer, newSong, editBassRhythm, undo, SongState } from '../reducers';

const onsets = (d: number[]) => { const o: number[] = []; d.reduce((p, x) => (o.push(p), p + x), 0); return o; };
const sum = (d: number[]) => d.reduce((a, b) => a + b, 0);

// A part (form index) of a generated song whose section has a bass note at
// k matching `pick`, searched over seeds so the cases are deterministic.
function find(pick: (doc: SongDoc, rhythm: number[], bass: number[], steps: number[], k: number) => boolean) {
  for (let seed = 1; seed < 200; seed++) {
    const doc = generateDoc({ seed, formId: 'verse-chorus', triplet: 0.6 });
    for (let index = 0; index < doc.form.length; index++) {
      const s = doc.sections[doc.form[index].sectionId];
      for (let k = 0; k < s.bassRhythm.length; k++) {
        if (pick(doc, s.bassRhythm, s.bass, s.drumSteps, k)) return { doc, index, k, s };
      }
    }
  }
  throw new Error('no case found');
}

// Every bass note must start on a drum step for the staff to place it.
const bassOnSteps = (doc: SongDoc) => Object.values(doc.sections).forEach(s => {
  const steps = new Set(onsets(s.drumSteps));
  onsets(s.bassRhythm).forEach(t => expect(steps.has(t)).toBe(true));
  expect(sum(s.bassRhythm)).toBe(sum(s.drumSteps));
});

describe('stepsWithBoundaryAt', () => {
  it('cuts a straight step at the tick, or leaves the grid alone if a step starts there', () => {
    expect(stepsWithBoundaryAt([480, 480], 240)).toEqual([240, 240, 480]);
    expect(stepsWithBoundaryAt([480, 480], 720)).toEqual([480, 240, 240]);
    const steps = [480, 480];
    expect(stepsWithBoundaryAt(steps, 480)).toBe(steps);
  });

  it('turns a triplet group the tick falls inside into straight sixteenths', () => {
    expect(stepsWithBoundaryAt([160, 160, 160, 480], 240)).toEqual([240, 240, 480]);
    expect(stepsWithBoundaryAt([480, 160, 160, 160], 720)).toEqual([480, 240, 240]);
  });
});

describe('which notes split and join', () => {
  it('splits halves, dotted quarters, quarters and eighths', () => {
    const r = [1920, 1440, 960, 480, 240, 720];
    expect(r.map((_, k) => canSplitBassNote(r, k))).toEqual([true, true, true, true, false, false]);
  });

  it('joins into one value up to a half note, never across a bar line', () => {
    // Bar 1: quarter, quarter, half. Bar 2: dotted quarter, eighth, half.
    const r = [960, 960, 1920, 1440, 480, 1920];
    expect(canJoinBassNotes(r, 0)).toBe(true); // -> half
    expect(canJoinBassNotes(r, 1)).toBe(false); // -> dotted half: too long
    expect(canJoinBassNotes(r, 2)).toBe(false); // crosses the bar line
    expect(canJoinBassNotes(r, 3)).toBe(true); // -> half
    expect(canJoinBassNotes(r, 5)).toBe(false); // nothing after it
    expect(canJoinBassNotes([480, 240], 0)).toBe(true); // -> dotted eighth
  });
});

describe('splitBassNote', () => {
  it('halves the note, both halves keeping its pitch, and locks the rhythm', () => {
    const { doc, index, k, s } = find((_, r, b, __, k) => r[k] === 960 && b[k] > 0);
    const next = splitBassNote(doc, index, k);
    const t = next.sections[s.id];
    expect(t.bassRhythm.slice(k, k + 2)).toEqual([480, 480]);
    expect(t.bassRhythm.length).toBe(s.bassRhythm.length + 1);
    expect(t.bass.slice(k, k + 2)).toEqual([s.bass[k], s.bass[k]]);
    expect(t.bass.length).toBe(t.bassRhythm.length);
    expect(t.locks.rhythm).toBe(true);
    expect(doc.sections[s.id]).toBe(s); // the input is untouched
    bassOnSteps(next);
  });

  it('cuts the drum step under the new note, keeping the drum hits where they were', () => {
    const { doc, index, k, s } = find((_, r, b, steps, k) => r[k] === 480 && !onsets(steps).includes(onsets(r)[k] + 240));
    const next = splitBassNote(doc, index, k);
    const t = next.sections[s.id];
    const at = onsets(s.bassRhythm)[k] + 240;
    expect(onsets(s.drumSteps)).not.toContain(at);
    expect(onsets(t.drumSteps)).toContain(at);
    bassOnSteps(next);
    // Every hit at a step onset that still exists is still there.
    const newOn = onsets(t.drumSteps);
    onsets(s.drumSteps).forEach((at, i) => {
      const j = newOn.indexOf(at);
      if (j !== -1) s.drums.forEach((row, v) => expect(t.drums[v][j].checked).toBe(row[i].checked));
    });
    // The parts still realize cleanly, with linked parts following.
    const parts = realizeSong(next);
    parts.forEach((p, i) => {
      if (next.form[i].sectionId === s.id) expect(p.bassGroove.length).toBe(t.bassRhythm.length);
      expect(p.bassNoteLocations.every(n => Number.isFinite(n.x))).toBe(true);
    });
  });

  it("moves a part's drum overrides along with their steps", () => {
    const { doc, index, k, s } = find((_, r, b, steps, k) => r[k] === 480 && !onsets(steps).includes(onsets(r)[k] + 240));
    const last = s.drumSteps.length - 1;
    const withOverride: SongDoc = { ...doc, form: doc.form.map((f, i) => (i === index ? { ...f, drumOverrides: [{ voice: 0, step: last, checked: true }] } : f)) };
    const next = splitBassNote(withOverride, index, k);
    const step = next.form[index].drumOverrides[0].step;
    expect(onsets(next.sections[s.id].drumSteps)[step]).toBe(onsets(s.drumSteps)[last]);
  });

  it("leaves notes that can't split alone", () => {
    const { doc, index, k } = find((_, r, __, ___, k) => r[k] === 240);
    expect(splitBassNote(doc, index, k)).toBe(doc);
  });
});

describe('joinBassNotes', () => {
  it('joins two notes into one, favouring the first pitch', () => {
    const { doc, index, k, s } = find((_, r, b, __, k) => canJoinBassNotes(r, k) && b[k] > 0 && b[k + 1] > 0 && b[k] !== b[k + 1]);
    const next = joinBassNotes(doc, index, k);
    const t = next.sections[s.id];
    expect(t.bassRhythm[k]).toBe(s.bassRhythm[k] + s.bassRhythm[k + 1]);
    expect(t.bass[k]).toBe(s.bass[k]);
    expect(t.bass.length).toBe(s.bass.length - 1);
    expect(t.drumSteps).toEqual(s.drumSteps);
    expect(t.locks.rhythm).toBe(true);
    bassOnSteps(next);
  });

  it('folds the drum step a split cut back into its eighth, so split then join round-trips', () => {
    const { doc, index, k, s } = find((_, r, b, steps, k) => r[k] === 480 && !onsets(steps).includes(onsets(r)[k] + 240));
    const back = joinBassNotes(splitBassNote(doc, index, k), index, k).sections[s.id];
    expect(back.bassRhythm).toEqual(s.bassRhythm);
    expect(back.bass).toEqual(s.bass);
    expect(back.drumSteps).toEqual(s.drumSteps);
    expect(back.drums).toEqual(s.drums);
  });

  it('keeps a sixteenth step that has a drum hit on it', () => {
    const { doc, index, k, s } = find((_, r, b, steps, k) => r[k] === 480 && !onsets(steps).includes(onsets(r)[k] + 240));
    const split = splitBassNote(doc, index, k);
    const t = split.sections[s.id];
    const j = onsets(t.drumSteps).indexOf(onsets(s.bassRhythm)[k] + 240);
    const hit: SongDoc = { ...split, sections: { ...split.sections, [s.id]: { ...t, drums: t.drums.map((row, v) => (v === 0 ? row.map((c, i) => (i === j ? { ...c, checked: true } : c)) : row)) } } };
    const joined = joinBassNotes(hit, index, k).sections[s.id];
    expect(joined.drumSteps).toEqual(t.drumSteps);
    expect(joined.drums[0][j].checked).toBe(true);
  });

  it('keeps a rest when the rest comes first', () => {
    const { doc, index, k, s } = find((_, r, b, __, k) => canJoinBassNotes(r, k) && b[k] === 0 && b[k + 1] > 0);
    expect(joinBassNotes(doc, index, k).sections[s.id].bass[k]).toBe(0);
  });

  it("leaves pairs that can't join alone", () => {
    const { doc, index, k } = find((_, r, __, ___, k) => k + 1 < r.length && !canJoinBassNotes(r, k));
    expect(joinBassNotes(doc, index, k)).toBe(doc);
  });
});

describe('editBassRhythm', () => {
  it('splits and joins through the store, each an undoable rhythm edit', () => {
    const store = configureStore({ reducer: { song: songReducer }, middleware: d => d({ serializableCheck: false, immutableCheck: false }) });
    store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 0, mode: 'major' }) as any);
    const st = (): SongState => store.getState().song;
    const v = st().songStructure.findIndex(p => p.type === 'Verse');
    const k = st().songStructure[v].bassGroove.findIndex(d => d === 1 || d === 0.5);
    const before = st().songStructure;
    const n = before[v].bassGroove.length;
    store.dispatch(editBassRhythm({ part: v, note: k, op: 'split' }));
    expect(st().songStructure[v].bassGroove.length).toBe(n + 1);
    expect(st().songStructure[v].bassNoteLocations[k].midi).toBe(st().songStructure[v].bassNoteLocations[k + 1].midi);
    expect(st().past!.at(-1)!.label).toBe('rhythm edit');
    store.dispatch(editBassRhythm({ part: v, note: k, op: 'join' }));
    expect(st().songStructure[v].bassGroove.length).toBe(n);
    store.dispatch(undo());
    store.dispatch(undo());
    expect(st().songStructure).toBe(before);
  });
});
