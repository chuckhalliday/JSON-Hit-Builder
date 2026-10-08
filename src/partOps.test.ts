import { configureStore } from '@reduxjs/toolkit';
import song, { songReducer, newSong, duplicatePart, deletePart, editHarmony, setSong, setCurrentBeat, setLoop, setPartSection, setPartLinked, undo, SongState } from './reducers';
import { createRandomSong } from './SongStructure/createSong';

const makeStore = () => configureStore({ reducer: { song: song.reducer }, middleware: d => d({ serializableCheck: false, immutableCheck: false }) });
const st = (store: ReturnType<typeof makeStore>): SongState => store.getState().song;
const labels = (store: ReturnType<typeof makeStore>) => st(store).songStructure.map(p => `${p.type[0]}${p.repeat}`).join(' ');
const contiguous = (store: ReturnType<typeof makeStore>) => {
  let next = 0;
  st(store).songStructure.forEach(p => p.stepIds.forEach(id => expect(id).toBe(next++)));
};

describe('duplicate and delete parts', () => {
  const setup = () => {
    const store = makeStore();
    store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 0, mode: 'major' }) as any);
    return store;
  };

  it('duplicates a part into the next slot, linked to the original', () => {
    const store = setup();
    const n = st(store).songStructure.length;
    const v = st(store).songStructure.findIndex(p => p.type === 'Verse');
    store.dispatch(duplicatePart(v));
    const parts = st(store).songStructure;
    expect(parts.length).toBe(n + 1);
    expect(parts[v + 1].sectionId).toBe(parts[v].sectionId);
    expect(JSON.stringify(parts[v + 1].chords)).toBe(JSON.stringify(parts[v].chords));
    expect(st(store).doc!.form.length).toBe(n + 1);
    contiguous(store);
    // Repeats renumber in order.
    expect(parts.filter(p => p.type === 'Verse').map(p => p.repeat)).toEqual(parts.filter(p => p.type === 'Verse').map((_, i) => i + 1));
    // Linked: editing the copy changes the original too.
    store.dispatch(editHarmony({ part: v + 1, chord: 0, change: { root: 5, quality: 'maj' } }));
    expect(st(store).songStructure[v].chords[0]).toBe('F');
  });

  it('deletes a part and drops a section nothing plays', () => {
    const store = setup();
    const before = labels(store);
    const bridge = st(store).songStructure.findIndex(p => p.type === 'Bridge');
    store.dispatch(deletePart(bridge));
    expect(st(store).songStructure.some(p => p.type === 'Bridge')).toBe(false);
    expect(st(store).doc!.sections.bridge).toBeUndefined();
    expect(st(store).songStructure.length).toBe(before.split(' ').length - 1);
    contiguous(store);
  });

  it('keeps the playhead on its part and clears the loop', () => {
    const store = setup();
    store.dispatch(setCurrentBeat([4, 3, 1, 1]));
    store.dispatch(setLoop({ start: { part: 1, beat: 0 }, end: { part: 2, beat: 4 } }));
    store.dispatch(duplicatePart(1));
    expect(st(store).selectedBeat).toEqual([5, 3, 1, 1]);
    expect(st(store).loop).toBeNull();
    store.dispatch(deletePart(5));
    expect(st(store).selectedBeat[0]).toBe(5);
    store.dispatch(deletePart(0));
    expect(st(store).selectedBeat[0]).toBe(4);
  });

  it('never deletes the last part', () => {
    const store = setup();
    while (st(store).songStructure.length > 1) store.dispatch(deletePart(0));
    store.dispatch(deletePart(0));
    expect(st(store).songStructure.length).toBe(1);
  });

  it('works for classic songs', () => {
    const store = makeStore();
    const { songStructure, key, bpm, seed, params } = createRandomSong(5);
    store.dispatch(setSong({ songStructure, key, bpm, seed, params }));
    const n = songStructure.length;
    store.dispatch(duplicatePart(0));
    expect(st(store).songStructure.length).toBe(n + 1);
    expect(st(store).songStructure[1].type).toBe(st(store).songStructure[0].type);
    contiguous(store);
    store.dispatch(deletePart(0));
    expect(st(store).songStructure.length).toBe(n);
    contiguous(store);
  });
});

describe('change a part to another kind of section', () => {
  const setup = () => {
    const store = makeStore();
    store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 0, mode: 'major' }) as any);
    return store;
  };
  const types = (store: ReturnType<typeof makeStore>) => st(store).songStructure.map(p => p.type);

  it('joins the song\'s section of that kind, in the same spot', () => {
    const store = setup();
    const before = types(store);
    const v = before.indexOf('Verse');
    const c = before.indexOf('Chorus');
    store.dispatch(setPartSection({ part: v, label: 'Chorus' }));
    const parts = st(store).songStructure;
    expect(types(store)).toEqual(before.map((t, i) => (i === v ? 'Chorus' : t)));
    expect(parts[v].sectionId).toBe(parts[c].sectionId);
    expect(JSON.stringify(parts[v].chords)).toBe(JSON.stringify(parts[c].chords));
    expect(st(store).doc!.form[v].drumOverrides).toEqual([]);
    contiguous(store);
    // Repeats renumber in song order.
    expect(parts.filter(p => p.type === 'Chorus').map(p => p.repeat)).toEqual(parts.filter(p => p.type === 'Chorus').map((_, i) => i + 1));
    // Linked: editing it changes the other choruses too.
    store.dispatch(editHarmony({ part: v, chord: 0, change: { root: 5, quality: 'maj' } }));
    expect(st(store).songStructure[c].chords[0]).toBe('F');
  });

  it('generates a section the song doesn\'t have yet', () => {
    const store = setup();
    expect(types(store)).not.toContain('Pre-Chorus');
    const v = types(store).indexOf('Verse');
    store.dispatch(setPartSection({ part: v, label: 'Pre-Chorus' }));
    const doc = st(store).doc!;
    expect(doc.sections['pre-chorus'].bars).toBe(4); // the pop template's spec
    expect(doc.form[v].sectionId).toBe('pre-chorus');
    expect(st(store).songStructure[v].type).toBe('Pre-Chorus');
    expect(st(store).songStructure[v].chords.length).toBeGreaterThan(0);
    contiguous(store);
  });

  it('drops the section it leaves when nothing else plays it', () => {
    const store = setup();
    const intro = types(store).indexOf('Intro');
    expect(types(store).filter(t => t === 'Intro').length).toBe(1);
    store.dispatch(setPartSection({ part: intro, label: 'Verse' }));
    expect(st(store).doc!.sections.intro).toBeUndefined();
    expect(Object.values(st(store).doc!.sections).every(s => st(store).doc!.form.some(f => f.sectionId === s.id))).toBe(true);
  });

  it('leaves a "this part only" part on its own copy', () => {
    const store = setup();
    const bridge = types(store).indexOf('Bridge');
    store.dispatch(setPartLinked({ part: bridge, linked: false }));
    const v = types(store).indexOf('Verse');
    store.dispatch(setPartSection({ part: v, label: 'Bridge' }));
    const doc = st(store).doc!;
    expect(doc.form[v].sectionId).not.toBe(doc.form[bridge].sectionId);
    expect(doc.form[bridge].detached).toBe(true);
    store.dispatch(editHarmony({ part: v, chord: 0, change: { root: 5, quality: 'maj' } }));
    expect(st(store).songStructure[bridge].chords[0]).not.toBe(st(store).songStructure[v].chords[0]);
  });

  it('sends a playhead inside the part back to its start, and ignores no-op picks', () => {
    const store = setup();
    const v = types(store).indexOf('Verse');
    store.dispatch(setCurrentBeat([v, 5, 3, 1]));
    const doc = st(store).doc;
    store.dispatch(setPartSection({ part: v, label: 'Verse' }));
    expect(st(store).doc).toBe(doc);
    store.dispatch(setPartSection({ part: v, label: 'Chorus' }));
    expect(st(store).selectedBeat).toEqual([v, 0, 0, 0]);
  });

  it('can be undone', () => {
    const store = configureStore({ reducer: { song: songReducer }, middleware: d => d({ serializableCheck: false, immutableCheck: false }) });
    store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 0, mode: 'major' }) as any);
    const before = store.getState().song.songStructure;
    store.dispatch(setPartSection({ part: 1, label: 'Bridge' }));
    expect(store.getState().song.past!.at(-1)!.label).toBe('part change');
    store.dispatch(undo());
    expect(store.getState().song.songStructure).toBe(before);
  });
});
