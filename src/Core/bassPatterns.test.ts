import { configureStore } from '@reduxjs/toolkit';
import { BASS_PATTERNS, BassPatternId, TRIPLET_EIGHTH, bassPattern, patternCells, patternGrid, patternRhythm, playsPattern } from './bassPatterns';
import { applyBassPattern } from './edits';
import { generateDoc } from './generate';
import { realizeSong } from './realize';
import { HAT_C, SongDoc } from './doc';
import { ChordEvent } from './theory';
import { BAR, EIGHTH, HALF, PPQ } from './time';
import { lampToPositions } from '../SongStructure/beatMapping';
import { songReducer, newSong, setBassPattern, undo, SongState } from '../reducers';

const onsets = (d: number[]) => { const o: number[] = []; d.reduce((p, x) => (o.push(p), p + x), 0); return o; };
const sum = (d: number[]) => d.reduce((a, b) => a + b, 0);
const pattern = (id: BassPatternId) => bassPattern(id)!;
const chord = (start: number, dur: number): ChordEvent => ({ start, dur, root: 0, quality: 'maj', inversion: 0, fn: 'T' } as ChordEvent);

// Every bass note must start on a drum step for the staff to place it.
const bassOnSteps = (doc: SongDoc) => Object.values(doc.sections).forEach(s => {
  const steps = new Set(onsets(s.drumSteps));
  onsets(s.bassRhythm).forEach(t => expect(steps.has(t)).toBe(true));
  expect(sum(s.bassRhythm)).toBe(sum(s.drumSteps));
  expect(s.bass.length).toBe(s.bassRhythm.length);
  s.drums.forEach(row => expect(row.length).toBe(s.drumSteps.length));
});

const verse = (doc: SongDoc) => doc.form.findIndex(f => doc.sections[f.sectionId].label === 'Verse');

describe('patternRhythm', () => {
  it('repeats the bar through the section', () => {
    const harmony = [chord(0, BAR), chord(BAR, BAR)];
    BASS_PATTERNS.forEach(p => {
      expect(sum(p.bar)).toBe(BAR);
      const r = patternRhythm(p, 2, harmony);
      expect(r).toEqual([...p.bar, ...p.bar]);
    });
  });

  it('puts a note on every chord change, cutting the note it falls in', () => {
    const harmony = [chord(0, HALF), chord(HALF, HALF)];
    expect(patternRhythm(pattern('threeThreeTwo'), 1, harmony)).toEqual([PPQ * 1.5, EIGHTH, PPQ, PPQ]);
    // The others already have a note on beat 3.
    BASS_PATTERNS.filter(p => p.id !== 'threeThreeTwo').forEach(p => expect(patternRhythm(p, 1, harmony)).toEqual(p.bar));
  });

  it('knows a part already playing a pattern', () => {
    const harmony = [chord(0, BAR)];
    expect(playsPattern(pattern('quarters').bar, pattern('quarters'), 1, harmony)).toBe(true);
    expect(playsPattern(pattern('eighths').bar, pattern('quarters'), 1, harmony)).toBe(false);
  });
});

describe('patternCells', () => {
  it('draws a bar on eighths, or triplets for the shuffle', () => {
    const lit = (id: BassPatternId) => patternCells(pattern(id)).map(beat => beat.map(on => (on ? 'x' : '.')).join('')).join(' ');
    expect(lit('eighths')).toBe('xx xx xx xx');
    expect(lit('quarters')).toBe('x. x. x. x.');
    expect(lit('dottedQuarter')).toBe('x. .x x. .x');
    expect(lit('oneTwoAndThree')).toBe('x. xx x. ..');
    expect(lit('threeThreeTwo')).toBe('x. .x .. x.');
    expect(lit('shuffle')).toBe('x.x x.x x.x x.x');
  });
});

describe('patternGrid', () => {
  it('swings each beat onto triplets, moving its hits to the triplet they are heard on', () => {
    // A beat of eighths, then one of sixteenths.
    const { steps, moved } = patternGrid([480, 480, 240, 240, 240, 240], true);
    expect(steps).toEqual([320, 320, 320, 320, 320, 320]);
    expect(moved).toEqual([0, 640, 960, 960 + 320, 960 + 640, 960 + 640]);
  });

  it('turns a shuffled beat back into eighths, leaving straight beats alone', () => {
    const { steps, moved } = patternGrid([320, 320, 320, 480, 160, 160, 160], false);
    expect(steps).toEqual([480, 480, 480, 160, 160, 160]);
    expect(moved).toEqual([0, 480, 480, 960, 1440, 1600, 1760]);
  });
});

describe('applyBassPattern', () => {
  it('sets every part to each pattern, keeping each note on a drum step and the parts realizable', () => {
    for (const seed of [3, 11, 42]) {
      const doc = generateDoc({ seed, formId: 'verse-chorus', triplet: 0.6 });
      // One part of each section (its other parts follow).
      const firsts = doc.form.flatMap((f, i) => (doc.form.findIndex(g => g.sectionId === f.sectionId) === i ? [i] : []));
      firsts.forEach(index => BASS_PATTERNS.forEach(p => {
        const next = applyBassPattern(doc, index, p.id);
        const s = next.sections[doc.form[index].sectionId];
        expect(s.bassRhythm).toEqual(patternRhythm(p, s.bars, s.harmony));
        expect(s.locks.rhythm).toBe(true);
        // A fresh line, all notes.
        expect(s.bass.every(m => m > 0)).toBe(true);
        bassOnSteps(next);
        realizeSong(next).forEach((part, i) => {
          if (next.form[i].sectionId !== s.id) return;
          expect(part.chordsLocation.length).toBe(part.chords.length);
          const xs = part.bassNoteLocations.map(n => n.x);
          xs.forEach((x, k) => expect(k === 0 || x > xs[k - 1]).toBe(true));
        });
      }));
      // The input is untouched.
      expect(doc).toEqual(generateDoc({ seed, formId: 'verse-chorus', triplet: 0.6 }));
    }
  });

  it('keeps a locked bass line, each note on the pitch sounding where it starts', () => {
    const doc = generateDoc({ seed: 9, formId: 'verse-chorus' });
    const index = verse(doc);
    const id = doc.form[index].sectionId;
    const locked: SongDoc = { ...doc, sections: { ...doc.sections, [id]: { ...doc.sections[id], locks: { ...doc.sections[id].locks, bass: true } } } };
    const old = locked.sections[id];
    const s = applyBassPattern(locked, index, 'eighths').sections[id];
    const oldOn = onsets(old.bassRhythm);
    onsets(s.bassRhythm).forEach((t, k) => {
      let at = 0;
      oldOn.forEach((o, i) => { if (o <= t) at = i; });
      if (old.bass[at] > 0) expect(s.bass[k]).toBe(old.bass[at]);
      else expect(s.bass[k]).toBeGreaterThan(0); // a rest it fell in takes a note
    });
  });

  it('swings the drums for a shuffle, and straightens them again', () => {
    const doc = generateDoc({ seed: 5, formId: 'verse-chorus', triplet: 0 });
    const index = verse(doc);
    const id = doc.form[index].sectionId;
    const before = doc.sections[id];
    const shuffled = applyBassPattern(doc, index, 'shuffle');
    const s = shuffled.sections[id];
    expect(s.drumSteps.every(d => d === TRIPLET_EIGHTH)).toBe(true);
    expect(s.bassRhythm.slice(0, 2)).toEqual([640, 320]);
    // Hits on the beat stay; an "e" plays on the middle triplet, an "&" or
    // "a" on the last.
    const hitsAt = (sec: typeof s, voice: number) => onsets(sec.drumSteps).filter((_, i) => sec.drums[voice][i].checked);
    const swing = (t: number) => t - (t % PPQ) + (t % PPQ === 0 ? 0 : t % PPQ < EIGHTH ? 320 : 640);
    expect(hitsAt(before, HAT_C).length).toBeGreaterThan(0);
    before.drums.forEach((_, voice) => {
      expect(hitsAt(s, voice)).toEqual([...new Set(hitsAt(before, voice).map(swing))]);
    });
    bassOnSteps(shuffled);

    // Straight again: the swung hits back on the "&".
    const straight = applyBassPattern(shuffled, index, 'eighths').sections[id];
    expect(straight.drumSteps.every(d => d === EIGHTH)).toBe(true);
    before.drums.forEach((_, voice) => {
      const back = new Set(hitsAt(straight, voice));
      hitsAt(before, voice).filter(t => t % EIGHTH === 0).forEach(t => expect(back.has(t)).toBe(true));
    });
  });

  it("moves a part's drum overrides with their steps", () => {
    const doc = generateDoc({ seed: 5, formId: 'verse-chorus', triplet: 0 });
    const index = verse(doc);
    const s = doc.sections[doc.form[index].sectionId];
    const step = onsets(s.drumSteps).indexOf(PPQ + EIGHTH); // the "&" of 2
    const withOverride: SongDoc = { ...doc, form: doc.form.map((f, i) => (i === index ? { ...f, drumOverrides: [{ voice: 0, step, checked: true }] } : f)) };
    const next = applyBassPattern(withOverride, index, 'shuffle');
    const moved = next.form[index].drumOverrides[0];
    expect(onsets(next.sections[s.id].drumSteps)[moved.step]).toBe(PPQ + 640);
  });

  it('leaves a part already playing the pattern alone', () => {
    const doc = applyBassPattern(generateDoc({ seed: 8 }), 0, 'quarters');
    expect(applyBassPattern(doc, 0, 'quarters')).toBe(doc);
  });

  it("lines a shuffled part's lamps up with its notes and chords", () => {
    const doc = applyBassPattern(generateDoc({ seed: 5, formId: 'verse-chorus' }), 0, 'shuffle');
    const part = realizeSong(doc)[0];
    // The last place all three start together, at or before each lamp: the
    // previous chord change.
    const chordAt = onsets(doc.sections[doc.form[0].sectionId].harmony.map(c => c.dur));
    part.drumGroove.forEach((_, lamp) => {
      const [step, bass, chordIndex] = lampToPositions(lamp, part.drumGroove, part.bassGroove, part.chordsGroove);
      const tick = Math.round(sum(part.drumGroove.slice(0, step)) * PPQ);
      expect(chordAt[chordIndex]).toBe(tick);
      expect(Math.round(sum(part.bassGroove.slice(0, bass)) * PPQ)).toBe(tick);
      expect(chordAt.filter(t => t > tick && t <= Math.round(sum(part.drumGroove.slice(0, lamp)) * PPQ))).toEqual([]);
    });
  });
});

describe('setBassPattern', () => {
  it('sets the rhythm through the store as one undoable step', () => {
    const store = configureStore({ reducer: { song: songReducer }, middleware: d => d({ serializableCheck: false, immutableCheck: false }) });
    store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 0, mode: 'major' }) as any);
    const st = (): SongState => store.getState().song;
    const v = st().songStructure.findIndex(p => p.type === 'Verse');
    const before = st().songStructure;
    store.dispatch(setBassPattern({ part: v, pattern: 'quarters' }));
    expect(st().songStructure[v].bassGroove.every(d => d === 1)).toBe(true);
    // Every verse follows.
    st().songStructure.forEach(p => { if (p.type === 'Verse') expect(p.bassGroove.every(d => d === 1)).toBe(true); });
    expect(st().past!.at(-1)!.label).toBe('bass rhythm');
    const after = st();
    store.dispatch(setBassPattern({ part: v, pattern: 'quarters' }));
    expect(st()).toBe(after);
    store.dispatch(undo());
    expect(st().songStructure).toBe(before);
  });
});
