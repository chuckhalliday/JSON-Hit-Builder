import { configureStore } from '@reduxjs/toolkit';
import { songReducer, newSong, setPartLyrics, setLyricTiming, setPartSection, editHarmony, reorderParts, duplicatePart, rerollLayer, setSong, undo, SongState } from './reducers';
import { createRandomSong } from './SongStructure/createSong';

const makeStore = () => configureStore({ reducer: { song: songReducer }, middleware: d => d({ serializableCheck: false, immutableCheck: false }) });
const st = (store: ReturnType<typeof makeStore>): SongState => store.getState().song;
const setup = () => {
  const store = makeStore();
  store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 0, mode: 'major' }) as any);
  return store;
};

describe('part lyrics', () => {
  it('starts every new song without words', () => {
    const store = setup();
    expect(st(store).songStructure.some(p => p.lyrics)).toBe(false);
    expect(st(store).doc!.form.some(f => f.lyrics)).toBe(false);
  });

  it('keeps a part\'s words on the part and its form instance, through re-renders', () => {
    const store = setup();
    const v = st(store).songStructure.findIndex(p => p.type === 'Verse');
    store.dispatch(setPartLyrics({ part: v, text: 'first line\nsecond line' }));
    expect(st(store).songStructure[v].lyrics).toBe('first line\nsecond line');
    expect(st(store).doc!.form[v].lyrics).toBe('first line\nsecond line');
    // Words belong to the part, not the section: the other verse has none.
    const v2 = st(store).songStructure.findIndex((p, i) => p.type === 'Verse' && i !== v);
    expect(st(store).songStructure[v2].lyrics).toBeUndefined();
    // Section edits and re-rolls re-render the part; the words stay.
    store.dispatch(editHarmony({ part: v, chord: 0, change: { root: 5, quality: 'maj' } }));
    store.dispatch(rerollLayer({ sectionId: st(store).songStructure[v].sectionId!, layer: 'rhythm', part: v }));
    expect(st(store).songStructure[v].lyrics).toBe('first line\nsecond line');
    // They move with the part, and survive a change of section kind.
    store.dispatch(reorderParts({ from: v, to: v + 1 }));
    expect(st(store).songStructure[v + 1].lyrics).toBe('first line\nsecond line');
    store.dispatch(setPartSection({ part: v + 1, label: 'Bridge' }));
    expect(st(store).songStructure[v + 1].lyrics).toBe('first line\nsecond line');
    store.dispatch(duplicatePart(v + 1));
    expect(st(store).songStructure[v + 2].lyrics).toBe('first line\nsecond line');
  });

  it('clears the words when the box is emptied', () => {
    const store = setup();
    store.dispatch(setPartLyrics({ part: 1, text: 'la la' }));
    store.dispatch(setPartLyrics({ part: 1, text: '' }));
    expect('lyrics' in st(store).songStructure[1]).toBe(false);
    expect('lyrics' in st(store).doc!.form[1]).toBe(false);
  });

  it('undoes a run of typing in one part as a single step', () => {
    const store = setup();
    const before = st(store).songStructure;
    for (const text of ['h', 'he', 'hel', 'hello']) store.dispatch(setPartLyrics({ part: 1, text }));
    expect(st(store).past!.length).toBe(1);
    // Typing in another part is its own step.
    store.dispatch(setPartLyrics({ part: 2, text: 'yo' }));
    expect(st(store).past!.length).toBe(2);
    store.dispatch(undo());
    expect(st(store).songStructure[1].lyrics).toBe('hello');
    store.dispatch(undo());
    expect(st(store).songStructure).toBe(before);
    expect('mergeKey' in st(store)).toBe(false);
  });

  it('works for classic songs', () => {
    const store = makeStore();
    const { songStructure, key, bpm, seed, params } = createRandomSong(5);
    store.dispatch(setSong({ songStructure, key, bpm, seed, params }));
    store.dispatch(setPartLyrics({ part: 0, text: 'old school' }));
    expect(st(store).songStructure[0].lyrics).toBe('old school');
    store.dispatch(duplicatePart(0));
    expect(st(store).songStructure[1].lyrics).toBe('old school');
  });

  it('keeps dragged syllables with the words, one undo step per drag', () => {
    const store = setup();
    const c = st(store).songStructure.findIndex(p => p.type === 'Chorus');
    store.dispatch(setPartLyrics({ part: c, text: 'carry me home\nhold on' }));
    const pastBefore = st(store).past!.length;
    store.dispatch(setLyricTiming({ part: c, line: 0, at: 1, beat: 2.5 }));
    expect(st(store).songStructure[c].lyricTiming).toEqual([{ text: 'carry me home', beats: [null, 2.5, null, null] }, null]);
    expect(st(store).doc!.form[c].lyricTiming).toEqual(st(store).songStructure[c].lyricTiming);
    expect(st(store).past!.length).toBe(pastBefore + 1);
    expect(st(store).past!.at(-1)!.label).toBe('syllable move');
    // Re-rendering the section keeps them.
    store.dispatch(editHarmony({ part: c, chord: 0, change: { root: 5, quality: 'maj' } }));
    expect(st(store).songStructure[c].lyricTiming![0]!.beats[1]).toBe(2.5);
    // Rewording that line drops its moves.
    store.dispatch(setPartLyrics({ part: c, text: 'carry me away\nhold on' }));
    expect(st(store).songStructure[c].lyricTiming).toBeUndefined();
    store.dispatch(undo()); // the rewording
    expect(st(store).songStructure[c].lyricTiming![0]!.beats[1]).toBe(2.5);
    store.dispatch(undo()); // the chord change
    store.dispatch(undo()); // the drag
    expect(st(store).songStructure[c].lyricTiming).toBeUndefined();
  });
});
