import { configureStore } from '@reduxjs/toolkit';
import { songReducer, newSong, setPartLyrics, setMelodyEnabled, setMelodyNote, rerollMelody, toggleMelodyLock, rerollLayer, setLyricTiming, setMelodySplits, undo, SongState } from '../reducers';
import { melodySegments } from '../Playback/playMelody';
import { canSplitMelodyNote, diatonicStep, melodyFor, noteValue, pitchAtStep, MELODY_HIGH, MELODY_LOW } from './melody';
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
