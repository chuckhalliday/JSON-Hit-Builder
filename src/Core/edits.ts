// Hand edits from the editors, written back into the song document.
//
// An edit lands on the section definition, so it shows up in every instance
// of that section, and it locks that layer so a later re-roll elsewhere in
// the section can't wipe it. A drum edit on a cell an instance's own
// transition changed (a fill, a crash) stays local to that instance.

import { Layer, SectionDef, SectionInstance, SongDoc } from './doc';
import { ChordEvent, BASS_MAX, BASS_MIN, chordBassPc, inversionCount, mod12 } from './theory';
import { guideTones, refitVoicings, revoiceChord } from './voicing';
import { Simplify, simplified, wouldSimplify } from './simplify';
import { generateBass } from './bassline';
import { functionOf } from './chordOptions';
import { streamFor } from './seeds';
import { instancePattern } from './realize';
import { remapDrums } from './drums';
import { DrumCellEdit } from './drumBars';
import { BAR, EIGHTH, HALF, PPQ, SIXTEENTH } from './time';
import { bassPitch } from '../SongStructure/bassPitch';
import { NoteLocation } from '../types';

function withSection(doc: SongDoc, id: string, update: (s: SongDoc['sections'][string]) => void, lock: Layer): SongDoc {
  const s = JSON.parse(JSON.stringify(doc.sections[id]));
  update(s);
  s.locks[lock] = true;
  return { ...doc, sections: { ...doc.sections, [id]: s } };
}

export function editDrum(doc: SongDoc, index: number, voice: number, step: number, checked: boolean): SongDoc {
  return editDrums(doc, index, [{ voice, step, checked }]);
}

// Drum steps of one part, set together (one, or a bar's worth when filling,
// clearing or copying). Decided as a batch, so the part is realized twice
// however many cells change.
export function editDrums(doc: SongDoc, index: number, cells: DrumCellEdit[]): SongDoc {
  const inst = doc.form[index];
  if (!inst) return doc;
  const s = doc.sections[inst.sectionId];
  cells = cells.filter(c => s.drums[c.voice]?.[c.step]);
  if (cells.length === 0) return doc;
  const key = (c: { voice: number, step: number }) => `${c.voice}:${c.step}`;
  const touched = new Set(cells.map(key));
  const others = inst.drumOverrides.filter(o => !touched.has(key(o)));
  const withOverrides = (d: SongDoc, local: DrumCellEdit[]) =>
    ({ ...d, form: d.form.map((f, i) => (i === index ? { ...f, drumOverrides: [...others, ...local] } : f)) });
  const withEdits = (onSection: DrumCellEdit[]) => (onSection.length === 0 ? doc : withSection(doc, inst.sectionId, sec => {
    onSection.forEach(c => { sec.drums[c.voice][c.step] = { checked: c.checked, accent: s.drums[c.voice][c.step].accent }; });
  }, 'drums'));
  // Cells the part's transitions change stay local to it, and so do cells a
  // transition sets whatever the section has there (a fill clears the beat
  // under it): editing the section wouldn't be heard in this part.
  const played = instancePattern(withOverrides(doc, []), index);
  const tried = cells.filter(c => played[c.voice][c.step].checked === s.drums[c.voice][c.step].checked);
  const heard = instancePattern(withOverrides(withEdits(tried), []), index);
  const onSection = new Set(tried.filter(c => heard[c.voice][c.step].checked === c.checked));
  const local = cells.filter(c => !onSection.has(c)).map(({ voice, step, checked }) => ({ voice, step, checked }));
  return withOverrides(withEdits([...onSection]), local);
}

export function editBass(doc: SongDoc, index: number, locations: NoteLocation[]): SongDoc {
  const inst = doc.form[index];
  if (!inst) return doc;
  return withSection(doc, inst.sectionId, sec => {
    sec.bass = sec.bass.map((old: number, k: number) => {
      const loc = locations[k];
      if (!loc) return old;
      const midi = bassPitch(loc.y, loc.acc).midi;
      return midi > 0 ? midi - inst.transpose : 0;
    });
    // Tab strings picked by hand travel with the notes.
    const strings = sec.bass.map((_: number, k: number) => locations[k]?.string ?? sec.bassStrings?.[k] ?? null);
    if (strings.some((st: number | null) => st !== null)) sec.bassStrings = strings;
  }, 'bass');
}

export function editChordTone(doc: SongDoc, index: number, chord: number, midi: number, checked: boolean): SongDoc {
  const inst = doc.form[index];
  if (!inst) return doc;
  return withSection(doc, inst.sectionId, sec => {
    const notes: number[] = sec.voicing[chord] ?? [];
    const note = midi - inst.transpose;
    sec.voicing[chord] = checked
      ? [...new Set([...notes, note])].sort((a, b) => a - b)
      : notes.filter(n => n !== note && n !== midi);
  }, 'voicing');
}

// Change one chord of the progression (any root and quality, an applied or
// borrowed chord, or just its inversion). That chord is re-voiced, smoothly
// against its neighbours; the bass note on its downbeat moves to the new
// chord's bass; the rest of the bass under it is rewritten to fit unless
// the bass is locked. Like other edits it applies to every instance of the
// section and locks the harmony.
export function editChord(doc: SongDoc, index: number, chordIndex: number, change: Partial<Pick<ChordEvent, 'root' | 'quality' | 'inversion' | 'appliedTo' | 'fn'>>): SongDoc {
  const inst = doc.form[index];
  if (!inst) return doc;
  return withSection(doc, inst.sectionId, sec => {
    const old: ChordEvent = sec.harmony[chordIndex];
    if (!old) return;
    const respelled = change.root !== undefined || change.quality !== undefined;
    const next: ChordEvent = { ...old, ...change };
    if (respelled && !('appliedTo' in change)) delete next.appliedTo;
    if (respelled && change.fn === undefined) next.fn = functionOf(next, doc.key.mode);
    next.root = mod12(next.root);
    // A new chord starts in root position (as the menus show it) unless an
    // inversion is chosen with it.
    if (respelled && change.inversion === undefined) next.inversion = 0;
    next.inversion = Math.min(next.inversion, inversionCount(next.quality) - 1);
    sec.harmony[chordIndex] = next;
    sec.guideTones = guideTones(sec.harmony, doc.key);
    sec.voicing[chordIndex] = revoiceChord(sec.harmony, sec.voicing, chordIndex, doc.key, sec.energy);
    fitBass(doc, sec, [chordIndex]);
  }, 'harmony');
}

// The bass under chords that changed: rewritten to fit them unless the bass
// is locked, and each chord's downbeat on its bass note (its inversion), in
// the octave nearest the note it replaces.
function fitBass(doc: SongDoc, sec: SectionDef, changed: number[]) {
  const on = onsets(sec.bassRhythm);
  const fresh = sec.locks.bass ? null : generateBass(sec.bassRhythm, sec.harmony, doc.key, sec.energy, streamFor(doc.seed, sec.id, 'bass', sec.rolls.bass));
  for (const i of changed) {
    const chord = sec.harmony[i];
    if (fresh) {
      on.forEach((t, k) => {
        if (t < chord.start || t >= chord.start + chord.dur) return;
        sec.bass[k] = fresh[k];
        if (sec.bassStrings) sec.bassStrings[k] = null;
      });
    }
    const downbeat = on.indexOf(chord.start);
    if (downbeat === -1) continue;
    const pc = chordBassPc(chord);
    const around = sec.bass[downbeat] > 0 ? sec.bass[downbeat] : 40;
    let best = 0;
    for (let m = BASS_MIN; m <= BASS_MAX; m++) {
      if (mod12(m - 24 - doc.key.tonic) === pc && (best === 0 || Math.abs(m - around) < Math.abs(best - around))) best = m;
    }
    if (best) {
      sec.bass[downbeat] = best;
      if (sec.bassStrings) sec.bassStrings[downbeat] = null;
    }
  }
}

// Simplify a part's progression (simplify.ts): fewer different chords, one
// per bar, or plain triads. The chords that changed are re-voiced and the
// bass fitted under them, as for a single chord change; the rest keep their
// voicings. Like other edits it applies to every instance of the section
// and locks the harmony. The same document when there's nothing to simplify.
export function simplifyChords(doc: SongDoc, index: number, how: Simplify): SongDoc {
  const inst = doc.form[index];
  const s = inst && doc.sections[inst.sectionId];
  if (!s || !wouldSimplify(s.harmony, how, s.bars, doc.key.mode)) return doc;
  const harmony = simplified(s.harmony, how, s.bars, doc.key.mode);
  const kept = (c: ChordEvent) => s.harmony.some(o =>
    o.start === c.start && o.dur === c.dur && mod12(o.root) === mod12(c.root) && o.quality === c.quality && o.inversion === c.inversion);
  return withSection(doc, inst.sectionId, sec => {
    sec.harmony = harmony;
    sec.guideTones = guideTones(harmony, doc.key);
    sec.voicing = refitVoicings(s.harmony, s.voicing, harmony, doc.key, sec.energy);
    fitBass(doc, sec, harmony.flatMap((c, i) => (kept(c) ? [] : [i])));
  }, 'harmony');
}

// ---- Bass rhythm: split a note in half, or join two into one ---------------
//
// The rhythm strip under the staff, after the Classic engine's groove
// editor. A note splits into two halves when the half is a value the staff
// draws (half, dotted quarter, quarter, eighth -> quarters, dotted eighths,
// eighths, sixteenths). Two neighbours join when together they make one
// value from an eighth to a half note, without crossing a bar line. Both
// halves keep the note's pitch; a joined note keeps the first one's (or its
// rest). Durations are in ticks.

const SPLITTABLE = new Set([HALF, PPQ * 1.5, PPQ, EIGHTH]);
const JOINABLE = new Set([EIGHTH, EIGHTH * 1.5, PPQ, PPQ * 1.5, HALF]);

const onsets = (durations: number[]) => {
  const out: number[] = [];
  durations.reduce((pos, d) => (out.push(pos), pos + d), 0);
  return out;
};

export const canSplitBassNote = (rhythm: number[], k: number) => SPLITTABLE.has(rhythm[k]);

export function canJoinBassNotes(rhythm: number[], k: number): boolean {
  if (k < 0 || k + 1 >= rhythm.length) return false;
  const length = rhythm[k] + rhythm[k + 1];
  const start = onsets(rhythm)[k];
  return JOINABLE.has(length) && Math.floor(start / BAR) === Math.floor((start + length - 1) / BAR);
}

// The drum steps with a step starting at tick t, since every bass note has
// to start on one. A straight step is cut in two there; a triplet group t
// falls inside becomes straight sixteenths. The same array when one already
// starts there.
export function stepsWithBoundaryAt(steps: number[], t: number): number[] {
  if (onsets(steps).includes(t)) return steps;
  const out: number[] = [];
  let pos = 0;
  let i = 0;
  while (i < steps.length) {
    const d = steps[i];
    if (t > pos && t < pos + d) {
      if (d % SIXTEENTH === 0) {
        out.push(t - pos, pos + d - t);
        pos += d;
        i++;
      } else {
        // Triplet groups start on their own span's grid (an eighth's three
        // steps on an eighth, a sixteenth's on a sixteenth).
        const group = d * 3;
        const from = pos - (pos % group);
        for (let back = pos - from; back > 0;) back -= out.pop()!;
        for (let p = from; p < from + group; p += SIXTEENTH) out.push(SIXTEENTH);
        while (pos < from + group) pos += steps[i++];
      }
      continue;
    }
    out.push(d);
    pos += d;
    i++;
  }
  return out;
}

// Per-part drum overrides point at steps by index; keep each on the step
// that starts where its old one did (dropping any whose step is gone).
function remapOverrides(form: SectionInstance[], sectionId: string, oldSteps: number[], newSteps: number[]): SectionInstance[] {
  const oldOn = onsets(oldSteps);
  const newOn = onsets(newSteps);
  return form.map(f => (f.sectionId !== sectionId ? f : {
    ...f,
    drumOverrides: f.drumOverrides.flatMap(o => {
      const step = newOn.indexOf(oldOn[o.step]);
      return step === -1 ? [] : [{ ...o, step }];
    }),
  }));
}

export function splitBassNote(doc: SongDoc, index: number, k: number): SongDoc {
  const inst = doc.form[index];
  const s = inst && doc.sections[inst.sectionId];
  if (!s || !canSplitBassNote(s.bassRhythm, k)) return doc;
  const half = s.bassRhythm[k] / 2;
  const steps = stepsWithBoundaryAt(s.drumSteps, onsets(s.bassRhythm)[k] + half);
  const next = withSection(doc, inst.sectionId, sec => {
    sec.bassRhythm.splice(k, 1, half, half);
    sec.bass.splice(k, 0, sec.bass[k]);
    if (sec.bassStrings) sec.bassStrings.splice(k, 0, sec.bassStrings[k] ?? null);
    if (steps !== s.drumSteps) {
      sec.drums = remapDrums(s.drumSteps, s.drums, steps);
      sec.drumSteps = [...steps];
    }
  }, 'rhythm');
  return steps === s.drumSteps ? next : { ...next, form: remapOverrides(next.form, inst.sectionId, s.drumSteps, steps) };
}

// The drum steps after the bass note starting at tick t is joined away: the
// sixteenth a split cut there folds back into its eighth - when it pairs
// into one on an eighth-note beat and nothing plays on it in any part - so
// a split undone with "+" leaves the drum grid as it was. Otherwise the
// same array.
function stepsFoldedAt(doc: SongDoc, sectionId: string, t: number): number[] {
  const s = doc.sections[sectionId];
  const on = onsets(s.drumSteps);
  const j = on.indexOf(t);
  const foldable = j > 0 && s.drumSteps[j] === SIXTEENTH && s.drumSteps[j - 1] === SIXTEENTH && on[j - 1] % EIGHTH === 0 &&
    s.drums.every(row => !row[j]?.checked) &&
    doc.form.every(f => f.sectionId !== sectionId || f.drumOverrides.every(o => o.step !== j));
  return foldable ? [...s.drumSteps.slice(0, j - 1), EIGHTH, ...s.drumSteps.slice(j + 1)] : s.drumSteps;
}

export function joinBassNotes(doc: SongDoc, index: number, k: number): SongDoc {
  const inst = doc.form[index];
  const s = inst && doc.sections[inst.sectionId];
  if (!s || !canJoinBassNotes(s.bassRhythm, k)) return doc;
  const steps = stepsFoldedAt(doc, inst.sectionId, onsets(s.bassRhythm)[k + 1]);
  const next = withSection(doc, inst.sectionId, sec => {
    sec.bassRhythm.splice(k, 2, sec.bassRhythm[k] + sec.bassRhythm[k + 1]);
    sec.bass.splice(k + 1, 1);
    if (sec.bassStrings) sec.bassStrings.splice(k + 1, 1);
    if (steps !== s.drumSteps) {
      sec.drums = remapDrums(s.drumSteps, s.drums, steps);
      sec.drumSteps = [...steps];
    }
  }, 'rhythm');
  return steps === s.drumSteps ? next : { ...next, form: remapOverrides(next.form, inst.sectionId, s.drumSteps, steps) };
}
