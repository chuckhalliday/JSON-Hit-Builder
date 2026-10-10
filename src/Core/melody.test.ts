import { configureStore } from '@reduxjs/toolkit';
import { songReducer, newSong, setPartLyrics, setMelodyEnabled, setMelodyNote, rerollMelody, toggleMelodyLock, rerollLayer, setLyricTiming, setLyricMeter, setMelodySplits, setMelodyTurn, moveSyllables, undo, SongState } from '../reducers';
import { melodySegments } from '../Playback/playMelody';
import { canSplitMelodyNote, diatonicStep, fitToChord, melodyFor, noteValue, pitchAtStep, restsBetween, writtenValues, MELODY_HIGH, MELODY_LOW } from './melody';
import { LyricMeter, partLyrics, placeLyrics, pushedSteps } from './lyrics';
import { chordAt } from './bassline';
import { chordTones, mod12 } from './theory';
import { transposedKey } from './realize';
import { songToMidi } from './exportMidi';
import { readMidiFile } from './midiFile';

const VERSE = 'standing in the kitchen light\nevery-thing is quiet now\nI remember how it felt\nwaiting for the summer rain';
const CHORUS = "oh carry me home\ncarry me home tonight\ndon't let me go\nuntil the morning light";

function setup(seed = 77, formId = 'verse-chorus', melody = true) {
  const store = configureStore({ reducer: { song: songReducer }, middleware: d => d({ serializableCheck: false, immutableCheck: false }) });
  store.dispatch(newSong({ seed, formId, liftFinalChorus: true }) as any);
  const st = (): SongState => store.getState().song;
  const v = st().songStructure.findIndex(p => p.type === 'Verse');
  const c = st().songStructure.findIndex(p => p.type === 'Chorus');
  store.dispatch(setPartLyrics({ part: v, text: VERSE }));
  store.dispatch(setPartLyrics({ part: c, text: CHORUS }));
  if (melody) store.dispatch(setMelodyEnabled(true));
  return { store, st, v, c };
}

describe('melodyFor', () => {
  it('sings nothing until the melody is added, nor where there are no words', () => {
    const { st, v } = setup(77, 'verse-chorus', false);
    expect(melodyFor(st().doc, st().songStructure, v)).toBeNull();
    const { st: st2 } = setup();
    const intro = st2().songStructure.findIndex(p => p.type === 'Intro');
    expect(melodyFor(st2().doc, st2().songStructure, intro)).toBeNull();
  });

  it('gives each placed syllable a note there, held to the next one, in a singable range', () => {
    const { st, v } = setup();
    const m = melodyFor(st().doc, st().songStructure, v)!;
    expect(m.owner).toBe(v);
    expect(m.notes.map(n => n.text).join(' ')).toBe('stan ding in the kit chen light every thing is quiet now I re mem ber how it felt wai ting for the sum mer rain');
    m.notes.forEach((n, k) => {
      expect(n.midi).toBeGreaterThanOrEqual(MELODY_LOW);
      expect(n.midi).toBeLessThanOrEqual(MELODY_HIGH);
      const next = m.notes[k + 1];
      if (next) expect(n.dur).toBeCloseTo(Math.min(4, next.beat - n.beat));
    });
  });

  it('follows the chords and moves mostly by step, without parallel fifths or octaves against the bass', () => {
    let strong = 0, strongChord = 0, intervals = 0, steps = 0, parallels = 0;
    for (const formId of ['pop', 'verse-chorus', 'blues']) for (let seed = 1; seed <= 12; seed++) {
      const { st } = setup(seed, formId);
      const s = st();
      s.songStructure.forEach((p, i) => {
        const m = melodyFor(s.doc, s.songStructure, i);
        if (!m || m.owner !== i) return;
        const inst = s.doc!.form[i];
        const harmony = s.doc!.sections[inst.sectionId].harmony;
        const key = transposedKey(s.doc!.key, inst.transpose);
        const bassOn: number[] = [];
        p.bassGroove.reduce((t, d) => (bassOn.push(t), t + d), 0);
        const bassAt = (beat: number) => {
          let k = 0;
          bassOn.forEach((t, j) => { if (t <= beat + 1e-6) k = j; });
          const midi = p.bassNoteLocations[k]?.midi ?? 0;
          return midi > 0 ? midi : null;
        };
        m.notes.forEach((n, k) => {
          const tick = Math.round(n.beat * 960);
          const isChord = chordTones(chordAt(harmony, tick)).map(r => mod12(key.tonic + r)).includes(mod12(n.midi));
          if (tick % 1920 === 0) { strong++; if (isChord) strongChord++; }
          const prev = m.notes[k - 1];
          if (!prev) return;
          intervals++;
          const step = Math.abs(n.midi - prev.midi);
          if (step <= 2) steps++;
          // A tone outside the chord only ever comes by step.
          if (!isChord) expect(step).toBeLessThanOrEqual(2);
          const b = bassAt(n.beat), pb = bassAt(prev.beat);
          if (b === null || pb === null || b === pb || n.midi === prev.midi) return;
          const iv = mod12(n.midi - b);
          if ((iv === 0 || iv === 7) && iv === mod12(prev.midi - pb) && Math.sign(n.midi - prev.midi) === Math.sign(b - pb)) parallels++;
        });
      });
    }
    expect(strongChord / strong).toBeGreaterThan(0.98);
    expect(steps / intervals).toBeGreaterThan(0.6);
    expect(parallels).toBe(0);
  });

  it('is the same every time for the same song, and a re-roll changes it', () => {
    const a = setup();
    const b = setup();
    const tune = (x: ReturnType<typeof setup>) => melodyFor(x.st().doc, x.st().songStructure, x.v)!.notes.map(n => n.midi);
    expect(tune(a)).toEqual(tune(b));
    a.store.dispatch(rerollMelody({ part: a.v }));
    expect(tune(a)).not.toEqual(tune(b));
    expect(a.st().past!.at(-1)!.label).toBe('melody re-roll');
  });

  it('has a repeated chorus sing the first one\'s tune, lifted with its key', () => {
    const { st, c } = setup();
    const s = st();
    const first = melodyFor(s.doc, s.songStructure, c)!;
    const repeats = s.songStructure.map((p, i) => i).filter(i => i > c && s.songStructure[i].type === 'Chorus');
    expect(repeats.length).toBeGreaterThan(0);
    repeats.forEach(i => {
      const m = melodyFor(s.doc, s.songStructure, i)!;
      expect(m.owner).toBe(c);
      expect(m.shift).toBe(s.doc!.form[i].transpose - s.doc!.form[c].transpose);
      expect(m.notes.map(n => n.midi - m.shift)).toEqual(first.notes.map(n => n.midi));
    });
    expect(repeats.some(i => s.doc!.form[i].transpose > 0)).toBe(true);
  });

  it('carries its notes with dragged syllables', () => {
    const { store, st, v } = setup();
    const before = melodyFor(st().doc, st().songStructure, v)!.notes;
    store.dispatch(setLyricTiming({ part: v, line: 0, at: 0, beat: before[0].beat - 1 }));
    const after = melodyFor(st().doc, st().songStructure, v)!.notes;
    expect(after[0].beat).toBe(before[0].beat - 1);
    expect(after.length).toBe(before.length);
  });
});

describe('editing, locking and re-rolling a melody', () => {
  it('sets one note, freezing and locking the rest of the tune', () => {
    const { store, st, v } = setup();
    const before = melodyFor(st().doc, st().songStructure, v)!.notes;
    store.dispatch(setMelodyNote({ part: v, line: 0, at: 2, midi: 72 }));
    const after = melodyFor(st().doc, st().songStructure, v)!;
    expect(after.melody.locked).toBe(true);
    after.notes.forEach((n, k) => expect(n.midi).toBe(k === 2 ? 72 : before[k].midi));
    // Locked: a re-roll does nothing; chord changes leave the frozen tune alone.
    store.dispatch(rerollMelody({ part: v }));
    store.dispatch(rerollLayer({ sectionId: st().songStructure[v].sectionId!, layer: 'harmony', part: v }));
    expect(melodyFor(st().doc, st().songStructure, v)!.notes.map(n => n.midi)).toEqual(after.notes.map(n => n.midi));
    expect(st().past!.some(p => p.label === 'melody edit')).toBe(true);
    store.dispatch(undo());
    store.dispatch(undo());
    expect(melodyFor(st().doc, st().songStructure, v)!.notes.map(n => n.midi)).toEqual(before.map(n => n.midi));
  });

  it('locks the tune as it stands, and unlocking lets a re-roll replace it', () => {
    const { store, st, v } = setup();
    const before = melodyFor(st().doc, st().songStructure, v)!.notes.map(n => n.midi);
    store.dispatch(toggleMelodyLock({ part: v }));
    expect(st().doc!.form[v].melody!.locked).toBe(true);
    store.dispatch(rerollLayer({ sectionId: st().songStructure[v].sectionId!, layer: 'harmony', part: v }));
    expect(melodyFor(st().doc, st().songStructure, v)!.notes.map(n => n.midi)).toEqual(before);
    store.dispatch(toggleMelodyLock({ part: v }));
    store.dispatch(rerollMelody({ part: v }));
    expect(st().doc!.form[v].melody).toEqual({ roll: 1 });
  });

  it('comes and goes with the song-wide switch, keeping each part\'s tune', () => {
    const { store, st, v } = setup();
    store.dispatch(rerollMelody({ part: v }));
    const tune = melodyFor(st().doc, st().songStructure, v)!.notes.map(n => n.midi);
    store.dispatch(setMelodyEnabled(false));
    expect(melodyFor(st().doc, st().songStructure, v)).toBeNull();
    store.dispatch(setMelodyEnabled(true));
    expect(melodyFor(st().doc, st().songStructure, v)!.notes.map(n => n.midi)).toEqual(tune);
  });
});

describe("the melody's rhythm strip", () => {
  const notesOf = (x: ReturnType<typeof setup>) => melodyFor(x.st().doc, x.st().songStructure, x.v)!.notes;

  it('splits a note in half: the syllable stays on the first half, a rest takes the second', () => {
    const x = setup();
    const before = notesOf(x);
    const k = before.findIndex(n => n.full >= 1);
    const n = before[k];
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 1 }));
    const after = notesOf(x);
    expect(after[k]).toMatchObject({ text: n.text, beat: n.beat, midi: n.midi, full: n.full, dur: n.full / 2, splits: 1 });
    expect(after[k].rests).toEqual([{ beat: n.beat + n.full / 2, dur: n.full / 2 }]);
    // Splitting again halves the note again, leaving rests shortest first.
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 2 }));
    expect(notesOf(x)[k].dur).toBe(n.full / 4);
    expect(notesOf(x)[k].rests.map(r => r.dur)).toEqual([n.full / 4, n.full / 2]);
    // Other notes and every pitch are untouched; it's one undo step each.
    notesOf(x).forEach((m, i) => { expect(m.midi).toBe(before[i].midi); if (i !== k) expect(m.dur).toBe(before[i].dur); });
    expect(x.st().past!.at(-1)!.label).toBe('melody rhythm');
  });

  it('rejoins to the original length, and playback hears the rest', () => {
    const x = setup();
    const n = notesOf(x).find(m => m.full >= 1)!;
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 1 }));
    const split = notesOf(x).find(m => m.line === n.line && m.at === n.at)!;
    const segment = melodySegments({ notes: [split], from: 0, to: split.beat + split.full }).find(sg => sg.midi !== null)!;
    expect(segment.sound).toBe(n.full / 2);
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 0 }));
    expect(notesOf(x).find(m => m.line === n.line && m.at === n.at)).toMatchObject({ dur: n.full, splits: 0, rests: [] });
    expect(x.st().doc!.form[x.v].melody!.rhythm).toBeUndefined();
  });

  it('keeps splits through re-rolls and locking, and drops them when the line is reworded', () => {
    const x = setup();
    const n = notesOf(x).find(m => m.full >= 1 && m.line === 0)!;
    x.store.dispatch(setMelodySplits({ part: x.v, line: 0, at: n.at, splits: 1 }));
    x.store.dispatch(rerollMelody({ part: x.v }));
    x.store.dispatch(toggleMelodyLock({ part: x.v }));
    expect(notesOf(x).find(m => m.line === 0 && m.at === n.at)!.splits).toBe(1);
    x.store.dispatch(setPartLyrics({ part: x.v, text: VERSE.replace('kitchen', 'bedroom') }));
    expect(notesOf(x).every(m => m.splits === 0)).toBe(true);
  });

  it('splits down to sixteenths', () => {
    expect(canSplitMelodyNote({ dur: 0.5, splits: 0 })).toBe(true);
    expect(canSplitMelodyNote({ dur: 0.25, splits: 1 })).toBe(false);
    expect(canSplitMelodyNote({ dur: 4, splits: 4 })).toBe(false);
  });
});

describe("the melody's meter (Rhythm menu)", () => {
  const notesOf = (x: ReturnType<typeof setup>, part = x.v) => melodyFor(x.st().doc, x.st().songStructure, part)!.notes;

  // Every stretch of the part is a note, a rest split off one, or a silence
  // written as rests - one after another, from the top to the end.
  const expectTiled = (x: ReturnType<typeof setup>, part: number) => {
    const m = melodyFor(x.st().doc, x.st().songStructure, part)!;
    const spans = [
      ...m.notes.flatMap(n => [{ beat: n.beat, dur: n.dur }, ...n.rests]),
      ...m.rests,
    ].sort((a, b) => a.beat - b.beat);
    let at = 0;
    spans.forEach(s => { expect(s.beat).toBeCloseTo(at, 1); at = s.beat + s.dur; });
    expect(at).toBeCloseTo(x.st().songStructure[part].drumGroove.reduce((a, b) => a + b, 0), 1);
  };

  it('sets the words in it, on the part and its form instance, as one undo step', () => {
    const x = setup();
    const even = notesOf(x).map(n => n.beat);
    x.store.dispatch(setLyricMeter({ part: x.v, meter: 'trochaic' }));
    expect(x.st().songStructure[x.v].lyricMeter).toBe('trochaic');
    expect(x.st().doc!.form[x.v].lyricMeter).toBe('trochaic');
    expect(notesOf(x).map(n => n.beat)).not.toEqual(even);
    expect(x.st().past!.at(-1)!.label).toBe('meter');
    // Even is the plain setting, stored as no meter at all.
    x.store.dispatch(setLyricMeter({ part: x.v, meter: 'even' }));
    expect(x.st().songStructure[x.v].lyricMeter).toBeUndefined();
    expect(notesOf(x).map(n => n.beat)).toEqual(even);
    x.store.dispatch(undo());
    expect(x.st().songStructure[x.v].lyricMeter).toBe('trochaic');
  });

  it('puts back syllables dragged and notes split by hand', () => {
    const x = setup();
    const n = notesOf(x).find(m => m.full >= 1)!;
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 1 }));
    x.store.dispatch(setLyricTiming({ part: x.v, line: 0, at: 0, beat: notesOf(x)[0].beat - 1 }));
    x.store.dispatch(setLyricMeter({ part: x.v, meter: 'iambic' }));
    expect(x.st().songStructure[x.v].lyricTiming).toBeUndefined();
    expect(x.st().doc!.form[x.v].lyricTiming).toBeUndefined();
    expect(x.st().doc!.form[x.v].melody?.rhythm).toBeUndefined();
    expect(notesOf(x).every(m => m.splits === 0)).toBe(true);
  });

  it("sings a falling meter's unstressed syllables as eighths, and playback hears the rests", () => {
    const x = setup();
    x.store.dispatch(setLyricMeter({ part: x.v, meter: 'dactylic' }));
    // Every verse line fits its two bars of dactyls: the syllables off beats
    // 1 and 3 are the unstressed ones, a line's last included ("quiet now":
    // DUM-da-da DUM-da).
    const notes = notesOf(x);
    const weak = notes.filter(m => m.beat % 2 !== 0);
    expect(weak.some((m, k) => notes[notes.indexOf(m) + 1]?.line !== m.line)).toBe(true);
    weak.forEach(m => expect(m.dur).toBe(0.5));
    const lineEnd = weak.find(m => notes[notes.indexOf(m) + 1]?.line !== m.line)!;
    const segment = melodySegments({ notes: [lineEnd], from: 0, to: lineEnd.beat + 2 }).find(sg => sg.midi !== null)!;
    expect(segment.sound).toBe(0.5);
  });

  it('carries to a repeated chorus singing the same words', () => {
    const x = setup();
    x.store.dispatch(setLyricMeter({ part: x.c, meter: 'anapestic' }));
    const s = x.st();
    const repeat = s.songStructure.findIndex((p, i) => i > x.c && p.type === 'Chorus');
    expect(partLyrics(s.songStructure, repeat).meter).toBe('anapestic');
    expect(melodyFor(s.doc, s.songStructure, repeat)!.notes.length).toBe(notesOf(x, x.c).length);
  });

  it('leaves no stretch of the part unwritten, in any meter', () => {
    for (const meter of ['even', 'iambic', 'trochaic', 'anapestic', 'dactylic'] as LyricMeter[]) {
      const x = setup();
      x.store.dispatch(setLyricMeter({ part: x.v, meter }));
      x.store.dispatch(setLyricMeter({ part: x.c, meter }));
      x.st().songStructure.forEach((_, i) => { if (melodyFor(x.st().doc, x.st().songStructure, i)) expectTiled(x, i); });
    }
  });

  it('writes a silence as the longest rests that start on their own beat', () => {
    expect(restsBetween(1.5, 8)).toEqual([{ beat: 1.5, dur: 0.5 }, { beat: 2, dur: 2 }, { beat: 4, dur: 4 }]);
    expect(restsBetween(3, 5.25)).toEqual([{ beat: 3, dur: 1 }, { beat: 4, dur: 1 }, { beat: 5, dur: 0.25 }]);
    expect(restsBetween(4, 4)).toEqual([]);
  });
});

describe('notes held over a bar line', () => {
  // The verse's first syllable dragged `beats` later, pushing the rest along.
  const pushVerse = (x: ReturnType<typeof setup>, beats: number) => {
    const p = x.st().songStructure[x.v];
    const onsets: number[] = [];
    p.drumGroove.reduce((t, d) => (onsets.push(t), t + d), 0);
    const placed = placeLyrics(p.lyrics!, p.drumGroove, p.lyricTiming, p.lyricMeter).syllables;
    const to = onsets.findIndex(t => Math.abs(t - placed[0].beat - beats) < 0.02);
    const steps = pushedSteps(placed.map(s => s.step), 0, to, onsets)!;
    x.store.dispatch(moveSyllables({ part: x.v, moves: placed.map((s, k) => ({ line: s.line, at: s.at, beat: onsets[steps[k]] })) }));
  };
  const keyOf = (x: ReturnType<typeof setup>) => transposedKey(x.st().doc!.key, x.st().doc!.form[x.v].transpose);
  const chordAtBeat = (x: ReturnType<typeof setup>, beat: number) =>
    chordAt(x.st().doc!.sections[x.st().doc!.form[x.v].sectionId].harmony, Math.round(beat * 960));
  const chordPcs = (x: ReturnType<typeof setup>, beat: number) => chordTones(chordAtBeat(x, beat)).map(r => mod12(keyOf(x).tonic + r));

  it('writes them in pieces cut at the bar line: tied on, or slurred to a chord tone the next bar has', () => {
    let crossing = 0, slurs = 0;
    for (const seed of [77, 3, 41, 12, 500, 9]) for (const beats of [3, 2.5, 1]) {
      const x = setup(seed);
      pushVerse(x, beats);
      notesOf(x).forEach(n => {
        expect(n.pieces[0]).toMatchObject({ beat: n.beat, midi: n.midi });
        expect(n.pieces[0].join).toBeUndefined();
        let at = n.beat;
        n.pieces.forEach((p, j) => {
          // One after another through the note, none across a bar line.
          expect(p.beat).toBeCloseTo(at, 6);
          expect(Math.floor(p.beat / 4 + 1e-6)).toBe(Math.floor(p.beat + p.dur - 1e-3) >> 2);
          at = p.beat + p.dur;
          if (j === 0) return;
          const prev = n.pieces[j - 1];
          const newBar = Math.abs(p.beat % 4) < 1e-6;
          if (p.join === 'tie') {
            expect(p.midi).toBe(prev.midi);
            if (newBar) expect(chordPcs(x, p.beat)).toContain(mod12(p.midi));
          } else {
            expect(p.join).toBe('slur');
            expect(newBar).toBe(true);
            expect(chordPcs(x, p.beat)).not.toContain(mod12(prev.midi));
            // The nearest one (on a two-note chord, that can be a third away).
            expect(p.midi).toBe(fitToChord(prev.midi, chordAtBeat(x, p.beat), keyOf(x)));
            slurs++;
          }
          if (newBar) crossing++;
        });
        expect(at).toBeCloseTo(n.beat + n.dur, 6);
      });
    }
    expect(crossing).toBeGreaterThan(0);
    expect(slurs).toBeGreaterThan(0);
  });

  const notesOf = (x: ReturnType<typeof setup>) => melodyFor(x.st().doc, x.st().songStructure, x.v)!.notes;

  it('writes a length the staff has no one value for as tied values, from the beat', () => {
    expect(writtenValues(0, 4)).toEqual([{ beat: 0, dur: 4 }]);
    expect(writtenValues(0.5, 2)).toEqual([{ beat: 0.5, dur: 1.5 }]);
    expect(writtenValues(1.75, 3.5)).toEqual([{ beat: 1.75, dur: 0.25 }, { beat: 2, dur: 1.5 }]);
    expect(writtenValues(0.5, 4)).toEqual([{ beat: 0.5, dur: 0.5 }, { beat: 1, dur: 3 }]);
    expect(writtenValues(0, 2.5)).toEqual([{ beat: 0, dur: 2 }, { beat: 2, dur: 0.5 }]);
    // A triplet's remnant stays on the note it's part of.
    expect(writtenValues(0, 1 / 3)).toEqual([{ beat: 0, dur: 1 / 3 }]);
  });

  it('fits a held pitch to the next chord: kept if a chord tone, else to the nearest, falling on a tie', () => {
    const cMajor = { tonic: 0, mode: 'major' as const };
    const c = { root: 0, quality: 'maj' as const };
    expect(fitToChord(64, c, cMajor)).toBe(64);
    expect(fitToChord(65, c, cMajor)).toBe(64);
    expect(fitToChord(62, c, cMajor)).toBe(60);
  });

  it('sings a slurred syllable on to its new pitch, the vowel carrying over', () => {
    const note = { beat: 3, dur: 2, midi: 64, text: 'light', hyphen: false, pieces: [{ beat: 3, dur: 1, midi: 64 }, { beat: 4, dur: 1, midi: 62, join: 'slur' as const }] };
    const sung = melodySegments({ notes: [note], from: 0, to: 6 }).filter(s => s.midi !== null);
    expect(sung.map(s => [s.midi, s.length, s.sound])).toEqual([[64, 1, 1], [62, 2, 1]]);
    expect(sung[0].syllable!.onset.length).toBeGreaterThan(0);
    expect(sung[0].syllable!.coda).toEqual([]);
    expect(sung[1].syllable!.onset).toEqual([]);
    expect(sung[1].syllable!.coda.length).toBeGreaterThan(0);
    expect(sung[1].syllable!.vowel).toBe(sung[0].syllable!.vowel);
  });

  it('exports a slurred syllable as a note per pitch, under its one lyric', () => {
    const x = setup();
    pushVerse(x, 3);
    const s = x.st();
    const melody = s.songStructure.map((_, i) => melodyFor(s.doc, s.songStructure, i)?.notes ?? null);
    const track = readMidiFile(songToMidi({ songStructure: s.songStructure, bpm: s.bpm, key: s.key, melody })).tracks.find(t => t.some(e => e.metaType === 0x03 && e.text === 'Melody'))!;
    const sung = melody.flatMap(m => m ?? []);
    const pitches = sung.reduce((n, m) => n + 1 + m.pieces.filter(p => p.join === 'slur').length, 0);
    expect(track.filter(e => e.metaType === 0x05).length).toBe(sung.length);
    expect(track.filter(e => (e.status & 0xf0) === 0x90).length).toBe(pitches);
  });

  it("fits a frozen tune's moved notes to the chords they land on, keeping those that fit", () => {
    let refitted = 0;
    for (const seed of [77, 3, 41]) {
      const x = setup(seed);
      x.store.dispatch(toggleMelodyLock({ part: x.v }));
      const before = notesOf(x).map(n => n.midi);
      pushVerse(x, 2.5);
      const inst = x.st().doc!.form[x.v];
      const key = transposedKey(x.st().doc!.key, inst.transpose);
      const scale = [0, 2, 4, 5, 7, 9, 11].map(s => mod12(key.tonic + (key.mode === 'major' ? s : [0, 2, 3, 5, 7, 8, 10][[0, 2, 4, 5, 7, 9, 11].indexOf(s)])));
      notesOf(x).forEach((n, k, all) => {
        const tones = chordPcs(x, n.beat);
        const strong = all[k + 1]?.line !== n.line || Math.round(n.beat * 960) % 1920 === 0;
        const fitted = tones.includes(mod12(before[k])) || (!strong && scale.includes(mod12(before[k])));
        if (fitted) expect(n.midi).toBe(before[k]);
        else { expect(tones).toContain(mod12(n.midi)); refitted++; }
      });
      expect(x.st().doc!.form[x.v].melody!.locked).toBe(true);
      x.store.dispatch(undo());
      expect(notesOf(x).map(n => n.midi)).toEqual(before);
    }
    expect(refitted).toBeGreaterThan(0);
  });
});

describe("singing a syllable on past its first pitch", () => {
  const notesOf = (x: ReturnType<typeof setup>) => melodyFor(x.st().doc, x.st().songStructure, x.v)!.notes;
  // The verse's first line pushed 3 beats later: "light" is then held over
  // into the next bar.
  const held = () => {
    const x = setup();
    const p = x.st().songStructure[x.v];
    const placed = placeLyrics(p.lyrics!, p.drumGroove).syllables;
    x.store.dispatch(moveSyllables({ part: x.v, moves: placed.map(s => ({ line: s.line, at: s.at, beat: s.beat + 3 })) }));
    const k = notesOf(x).findIndex(n => n.pieces.some(q => q.turn?.kind === 'bar'));
    return { x, k };
  };

  it('sets the pitch held over a bar line by hand, slurred to, as one locked undo step', () => {
    const { x, k } = held();
    expect(k).toBeGreaterThan(-1);
    const n = notesOf(x)[k];
    const over = n.pieces.find(q => q.turn?.kind === 'bar')!;
    const pastBefore = x.st().past!.length;
    // A pitch neither the syllable's nor the one the chord took.
    const pick = [1, 2, 3, 4].map(d => n.midi + d).find(m => m !== over.midi)!;
    x.store.dispatch(setMelodyTurn({ part: x.v, line: n.line, at: n.at, turn: { kind: 'bar', index: 0 }, midi: pick }));
    const after = notesOf(x)[k];
    const set = after.pieces.filter(q => q.turn?.kind === 'bar');
    expect(set.map(q => q.midi)).toEqual(set.map(() => pick));
    expect(set[0].join).toBe('slur');
    // The syllable's own pitch, and every other note, stay.
    expect(after.midi).toBe(n.midi);
    expect(x.st().doc!.form[x.v].melody!.locked).toBe(true);
    expect(x.st().past!.length).toBe(pastBefore + 1);
    expect(x.st().past!.at(-1)!.label).toBe('melody edit');
    // Set to the pitch held, it's tied again.
    x.store.dispatch(setMelodyTurn({ part: x.v, line: n.line, at: n.at, turn: { kind: 'bar', index: 0 }, midi: n.pieces[0].midi }));
    expect(notesOf(x)[k].pieces.find(q => q.turn?.kind === 'bar')!.join).toBe('tie');
    x.store.dispatch(undo());
    x.store.dispatch(undo());
    expect(notesOf(x)[k].pieces).toEqual(n.pieces);
  });

  it('sings a split rest when it gets a pitch: slurred to, the syllable carrying on', () => {
    const x = setup();
    const k = notesOf(x).findIndex(m => m.full === 1 && m.beat % 4 < 2);
    const n = notesOf(x)[k];
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 1 }));
    x.store.dispatch(setMelodyTurn({ part: x.v, line: n.line, at: n.at, turn: { kind: 'fill', index: 0 }, midi: n.midi + 2 }));
    const sung = notesOf(x)[k];
    expect(sung.rests).toEqual([{ beat: n.beat + 0.5, dur: 0.5, midi: n.midi + 2 }]);
    expect(sung.pieces.map(q => [q.beat, q.dur, q.midi, q.join])).toEqual([[n.beat, 0.5, n.midi, undefined], [n.beat + 0.5, 0.5, n.midi + 2, 'slur']]);
    expect(sung.pieces[1].turn).toEqual({ kind: 'fill', index: 0 });
    // No rest left there to write, and playback sings both pitches on the one syllable.
    expect(melodyFor(x.st().doc, x.st().songStructure, x.v)!.rests.some(r => r.beat >= n.beat && r.beat < n.beat + 1)).toBe(false);
    const segments = melodySegments({ notes: notesOf(x), from: n.beat, to: n.beat + 1 }).filter(s => s.midi !== null);
    expect(segments.map(s => [s.midi, s.sound])).toEqual([[n.midi, 0.5], [n.midi + 2, 0.5]]);
    expect(segments[1].syllable!.onset).toEqual([]);
    // Rested again from the strip, it's a rest.
    x.store.dispatch(setMelodyTurn({ part: x.v, line: n.line, at: n.at, turn: { kind: 'fill', index: 0 }, midi: null }));
    expect(notesOf(x)[k].rests).toEqual([{ beat: n.beat + 0.5, dur: 0.5 }]);
    expect(notesOf(x)[k].pieces.length).toBe(1);
  });

  it("sings rests only in order, and lays them out anew (rested) when the note's split again", () => {
    const x = setup();
    const k = notesOf(x).findIndex(m => m.full === 1 && m.beat % 4 < 2);
    const n = notesOf(x)[k];
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 2 }));
    // The second rest given a pitch past a first still rested: not heard.
    x.store.dispatch(setMelodyTurn({ part: x.v, line: n.line, at: n.at, turn: { kind: 'fill', index: 1 }, midi: n.midi + 1 }));
    expect(notesOf(x)[k].pieces.length).toBe(1);
    x.store.dispatch(setMelodyTurn({ part: x.v, line: n.line, at: n.at, turn: { kind: 'fill', index: 0 }, midi: n.midi - 1 }));
    expect(notesOf(x)[k].pieces.map(q => q.midi)).toEqual([n.midi, n.midi - 1, n.midi + 1]);
    // Another note's edit keeps them; a new split rests them all.
    x.store.dispatch(setMelodyNote({ part: x.v, line: 0, at: 0, midi: 67 }));
    expect(notesOf(x)[k].pieces.length).toBe(3);
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 1 }));
    expect(notesOf(x)[k].rests.every(r => r.midi === undefined)).toBe(true);
    // As does a new meter, which sets the rhythm afresh.
    x.store.dispatch(setMelodyTurn({ part: x.v, line: n.line, at: n.at, turn: { kind: 'fill', index: 0 }, midi: n.midi - 1 }));
    x.store.dispatch(setLyricMeter({ part: x.v, meter: 'iambic' }));
    expect(x.st().doc!.form[x.v].melody!.lines!.every(e => !e?.on)).toBe(true);
  });

  it('exports a rest sung as a note of its own under the one lyric', () => {
    const x = setup();
    const n = notesOf(x).find(m => m.full === 1 && m.beat % 4 < 2)!;
    x.store.dispatch(setMelodySplits({ part: x.v, line: n.line, at: n.at, splits: 1 }));
    x.store.dispatch(setMelodyTurn({ part: x.v, line: n.line, at: n.at, turn: { kind: 'fill', index: 0 }, midi: n.midi + 2 }));
    const s = x.st();
    const melody = s.songStructure.map((_, i) => melodyFor(s.doc, s.songStructure, i)?.notes ?? null);
    const track = readMidiFile(songToMidi({ songStructure: s.songStructure, bpm: s.bpm, key: s.key, melody })).tracks.find(t => t.some(e => e.metaType === 0x03 && e.text === 'Melody'))!;
    const sungNotes = melody.flatMap(m => m ?? []);
    expect(track.filter(e => e.metaType === 0x05).length).toBe(sungNotes.length);
    expect(track.filter(e => (e.status & 0xf0) === 0x90).length).toBe(sungNotes.reduce((c, m) => c + 1 + m.pieces.filter(q => q.join === 'slur').length, 0));
  });
});

describe('treble staff helpers', () => {
  it('places pitches by letter and reads the key\'s accidentals back', () => {
    expect(diatonicStep(64, { letter: 'E', acc: 0 })).toBe(30); // bottom line
    expect(diatonicStep(77, { letter: 'F', acc: 0 })).toBe(38); // top line
    expect(diatonicStep(61, { letter: 'C', acc: 1 })).toBe(28);
    expect(diatonicStep(61, { letter: 'D', acc: -1 })).toBe(29);
    const dMajor = { tonic: 2, mode: 'major' as const };
    expect(pitchAtStep(31, dMajor)).toEqual({ midi: 66, spelled: { letter: 'F', acc: 1 } });
    expect(pitchAtStep(31, dMajor, 0).midi).toBe(65);
    expect(pitchAtStep(28, dMajor).midi).toBe(61); // C# in D major
  });

  it('draws lengths as the nearest note value', () => {
    expect([0.25, 0.33, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map(noteValue)).toEqual([0.25, 0.25, 0.5, 0.75, 1, 1.5, 1.5, 2, 2.5, 4]);
  });
});

describe('exporting the melody', () => {
  it('writes a Melody track: a note per syllable, the words as lyric events', () => {
    const { st } = setup();
    const s = st();
    const melody = s.songStructure.map((_, i) => melodyFor(s.doc, s.songStructure, i)?.notes ?? null);
    const file = readMidiFile(songToMidi({ songStructure: s.songStructure, bpm: s.bpm, key: s.key, melody }));
    const track = file.tracks.find(t => t.some(e => e.metaType === 0x03 && e.text === 'Melody'))!;
    expect(track).toBeDefined();
    const sung = melody.flatMap(m => m ?? []);
    const lyrics = track.filter(e => e.metaType === 0x05).map(e => e.text);
    expect(lyrics.length).toBe(sung.length);
    expect(lyrics.slice(0, 3)).toEqual(['stan-', 'ding', 'in']);
    expect(track.filter(e => (e.status & 0xf0) === 0x90).length).toBe(sung.length);
    // No melody, no track.
    expect(readMidiFile(songToMidi({ songStructure: s.songStructure, bpm: s.bpm, key: s.key })).tracks.length).toBe(file.tracks.length - 1);
  });
});
