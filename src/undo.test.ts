import { configureStore } from '@reduxjs/toolkit';
import { songReducer, newSong, undo, retractDrumEdit, editHarmony, deletePart, duplicatePart, setDrumState, setCurrentBeat, setIsPlaying, rerollLayer, setSong, setSounds, SongState } from './reducers';
import { SoundPick } from './Core/timbre';

const makeStore = () => configureStore({ reducer: { song: songReducer }, middleware: d => d({ serializableCheck: false, immutableCheck: false }) });
const st = (store: ReturnType<typeof makeStore>): SongState => store.getState().song;

describe('undo', () => {
  const setup = () => {
    const store = makeStore();
    store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 0, mode: 'major' }) as any);
    return store;
  };

  it('has nothing to undo after the first song loads', () => {
    const store = setup();
    expect(st(store).past ?? []).toEqual([]);
  });

  it('undoes edits and structure changes in reverse order', () => {
    const store = setup();
    const original = st(store).songStructure;
    const v = original.findIndex(p => p.type === 'Verse');
    store.dispatch(editHarmony({ part: v, chord: 0, change: { root: 5, quality: 'maj' } }));
    const afterChord = st(store).songStructure;
    store.dispatch(deletePart(0));
    store.dispatch(duplicatePart(0));
    expect(st(store).past!.map(p => p.label)).toEqual(['chord change', 'delete', 'duplicate']);

    store.dispatch(undo());
    store.dispatch(undo());
    expect(st(store).songStructure).toBe(afterChord);
    store.dispatch(undo());
    expect(st(store).songStructure).toBe(original);
    expect(st(store).songStructure[v].chords[0]).not.toBe('F');
    expect(st(store).past).toEqual([]);
    // Nothing more to undo: a no-op.
    store.dispatch(undo());
    expect(st(store).songStructure).toBe(original);
  });

  it('restores the song document, so later edits build on the undone state', () => {
    const store = setup();
    const v = st(store).songStructure.findIndex(p => p.type === 'Verse');
    const doc = st(store).doc;
    store.dispatch(rerollLayer({ sectionId: 'verse', layer: 'harmony', part: v }));
    store.dispatch(undo());
    expect(st(store).doc).toBe(doc);
    const was = st(store).songStructure[v].drums[1][2].checked;
    store.dispatch(setDrumState({ index: v, drumPart: 1, drumStep: 2, drums: { index: 2, checked: !was } }));
    expect(st(store).songStructure[v].chords).toEqual(st(store).past![0].songStructure[v].chords);
  });

  it('retracts a drum toggle and its undo entry without stopping playback', () => {
    const store = setup();
    store.dispatch(duplicatePart(0));
    store.dispatch(setIsPlaying({ isPlaying: true }));
    store.dispatch(setCurrentBeat([1, 3, 0, 0]));
    const before = st(store).songStructure;
    const doc = st(store).doc;
    const was = before[1].drums[1][2].checked;
    store.dispatch(setDrumState({ index: 1, drumPart: 1, drumStep: 2, drums: { index: 2, checked: !was } }));
    const after = st(store).songStructure;
    store.dispatch(retractDrumEdit({ before, after }));
    expect(st(store).songStructure).toBe(before);
    expect(st(store).doc).toBe(doc);
    expect(st(store).past!.map(p => p.label)).toEqual(['duplicate']);
    expect(st(store).isPlaying).toBe(true);
    expect(st(store).selectedBeat).toEqual([1, 3, 0, 0]);
  });

  it('leaves the song alone if it changed since the drum toggle', () => {
    const store = setup();
    const before = st(store).songStructure;
    const was = before[0].drums[1][2].checked;
    store.dispatch(setDrumState({ index: 0, drumPart: 1, drumStep: 2, drums: { index: 2, checked: !was } }));
    const after = st(store).songStructure;
    store.dispatch(duplicatePart(0));
    const now = st(store).songStructure;
    store.dispatch(retractDrumEdit({ before, after }));
    expect(st(store).songStructure).toBe(now);
    expect(st(store).past!.map(p => p.label)).toEqual(['drum edit', 'duplicate']);
  });

  it('ignores playback and no-op actions', () => {
    const store = setup();
    store.dispatch(setCurrentBeat([1, 2, 0, 0]));
    store.dispatch(editHarmony({ part: 999, chord: 0, change: { root: 2 } }));
    expect(st(store).past ?? []).toEqual([]);
  });

  it('undoes generating a new song', () => {
    const store = setup();
    const first = st(store).songStructure;
    store.dispatch(newSong({ seed: 78 }) as any);
    expect(st(store).past!.map(p => p.label)).toEqual(['new song']);
    store.dispatch(undo());
    expect(st(store).songStructure).toBe(first);
    expect(st(store).key).toBe('C Major');
  });

  it('keeps the sound choice with its song', () => {
    const store = setup();
    const piano: SoundPick = { style: 'band', drums: 'Tight studio kit', bass: 'Picked electric bass', chords: 'Grand piano' };
    const organ: SoundPick = { ...piano, chords: 'Drawbar-style organ' };
    expect(st(store).sounds).toBeNull();
    store.dispatch(setSounds(piano));
    expect(st(store).sounds).toEqual(piano);
    // Choosing sounds isn't an undo step, and edits (or undoing them) keep it.
    expect(st(store).past ?? []).toEqual([]);
    store.dispatch(duplicatePart(0));
    store.dispatch(setSounds(organ));
    store.dispatch(undo());
    expect(st(store).sounds).toEqual(organ);

    // A new song starts on the best match; undoing it brings the choice back.
    const { past: _past, ...saved } = st(store);
    store.dispatch(newSong({ seed: 78 }) as any);
    expect(st(store).sounds).toBeNull();
    store.dispatch(undo());
    expect(st(store).sounds).toEqual(organ);
    // Loading a saved song (the state Save stores) brings its choice along.
    store.dispatch(newSong({ seed: 79 }) as any);
    store.dispatch(setSong(saved));
    expect(st(store).sounds).toEqual(organ);
    expect(st(store).songStructure).toBe(saved.songStructure);
  });

  it('keeps at most 50 steps', () => {
    const store = setup();
    for (let i = 0; i < 52; i++) store.dispatch(duplicatePart(0));
    expect(st(store).past!.length).toBe(50);
  });
});
