import { configureStore } from '@reduxjs/toolkit';
import song, { newSong, setBassState, setSong, SongState } from './reducers';
import { createRandomSong } from './SongStructure/createSong';
import { NoteLocation } from './types';

const makeStore = () => configureStore({ reducer: { song: song.reducer }, middleware: d => d({ serializableCheck: false, immutableCheck: false }) });
const st = (store: ReturnType<typeof makeStore>): SongState => store.getState().song;

// What the staff sends when a note's rest choice is picked.
const toRest = (notes: NoteLocation[], k: number) =>
  notes.map((n, i) => (i === k ? { ...n, y: -20, acc: 'none', string: undefined } : n));

describe('turning a bass note into its matching rest', () => {
  it('rests that note in every linked part, keeping its length, and a staff click brings a note back', () => {
    const store = makeStore();
    store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 0, mode: 'major' }) as any);
    const parts = st(store).songStructure;
    const v = parts.findIndex(p => p.type === 'Verse');
    const linked = parts.findIndex((p, i) => i !== v && p.sectionId === parts[v].sectionId);
    const k = parts[v].bassNoteLocations.findIndex(n => n.midi > 0);
    const groove = parts[v].bassGroove;

    store.dispatch(setBassState({ index: v, bassNoteLocations: toRest(parts[v].bassNoteLocations, k) }));
    const after = st(store).songStructure;
    expect(after[v].bass[k]).toBe('-');
    expect(after[v].bassNoteLocations[k].midi).toBeLessThanOrEqual(0);
    expect(after[v].bassGroove).toEqual(groove);
    expect(after[linked].bass[k]).toBe('-');
    expect(st(store).doc!.sections[parts[v].sectionId!].bass[k]).toBe(0);
    // Other notes are untouched.
    after[v].bassNoteLocations.forEach((n, i) => { if (i !== k) expect(n.midi).toBe(parts[v].bassNoteLocations[i].midi); });

    // Clicking the column on the staff's top line puts a note (A2) back.
    const back = after[v].bassNoteLocations.map((n, i) => (i === k ? { ...n, y: 45 } : n));
    store.dispatch(setBassState({ index: v, bassNoteLocations: back }));
    expect(st(store).songStructure[v].bassNoteLocations[k].midi).toBe(45);
  });

  it('works for classic songs', () => {
    const store = makeStore();
    const { songStructure, key, bpm, seed, params } = createRandomSong(5);
    store.dispatch(setSong({ songStructure, key, bpm, seed, params }));
    const notes = st(store).songStructure[0].bassNoteLocations;
    const k = notes.findIndex(n => n.midi > 0);
    store.dispatch(setBassState({ index: 0, bassNoteLocations: toRest(notes, k) }));
    const rested = st(store).songStructure[0].bassNoteLocations[k];
    expect(rested.midi).toBeLessThanOrEqual(0);
    expect(rested.osc).toBeLessThanOrEqual(0);
  });
});
