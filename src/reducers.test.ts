import { configureStore } from '@reduxjs/toolkit';
import song, { newSong, setDrumState, setDrumCells, setBassState, setChordState, rerollLayer, toggleLock, setPartEnergy, reorderParts, setSong, SongState } from './reducers';
import { createRandomSong } from './SongStructure/createSong';
import { barCopyEdits, stepBarsOf } from './Core/drumBars';

const makeStore = () => configureStore({ reducer: { song: song.reducer } });
const state = (store: ReturnType<typeof makeStore>): SongState => store.getState().song;

describe('song reducer with a sculpted document', () => {
  const setup = () => {
    const store = makeStore();
    store.dispatch(newSong({ seed: 77, formId: 'verse-chorus', tonic: 7, mode: 'major' }) as any);
    const verses = state(store).songStructure.map((p, i) => (p.sectionId === 'verse' ? i : -1)).filter(i => i >= 0);
    return { store, verses };
  };

  it('loads a document and its realized parts', () => {
    const { store } = setup();
    expect(state(store).doc).not.toBeNull();
    expect(state(store).key).toBe('G Major');
    expect(state(store).songStructure.length).toBe(state(store).doc!.form.length);
  });

  it('propagates a drum edit to every instance of the section', () => {
    const { store, verses } = setup();
    const was = state(store).songStructure[verses[0]].drums[1][2].checked;
    store.dispatch(setDrumState({ index: verses[0], drumPart: 1, drumStep: 2, drums: { index: 2, checked: !was } }));
    verses.forEach(i => expect(state(store).songStructure[i].drums[1][2].checked).toBe(!was));
    expect(state(store).doc!.sections.verse.locks.drums).toBe(true);
  });

  const cells = (voice: number, steps: number[], checked: boolean) => steps.map(step => ({ voice, step, checked }));

  it('fills and clears a drum across the part or one bar', () => {
    const { store, verses } = setup();
    const v = verses[0];
    const all = state(store).songStructure[v].drums[2].map((_, i) => i);
    store.dispatch(setDrumCells({ index: v, cells: cells(2, all, true) }));
    // The whole part, through its transition fill, and (on the section) the
    // other verses' bars outside their own transitions.
    expect(state(store).songStructure[v].drums[2].every(c => c.checked)).toBe(true);
    const other = state(store).songStructure[verses[1]];
    const firstBar = stepBarsOf(other.drumGroove).filter(bar => bar === 0).length;
    expect(other.drums[2].slice(0, firstBar).every(c => c.checked)).toBe(true);
    expect(state(store).doc!.sections.verse.locks.drums).toBe(true);
    store.dispatch(setDrumCells({ index: v, cells: cells(0, all, true) }));
    expect(state(store).songStructure[v].drums[0].every(c => c.checked)).toBe(true);
    store.dispatch(setDrumCells({ index: v, cells: cells(0, all, false) }));
    expect(state(store).songStructure[v].drums[0].some(c => c.checked)).toBe(false);

    store.dispatch(setDrumCells({ index: v, cells: cells(2, [0, 1, 2], false) }));
    const row = state(store).songStructure[v].drums[2];
    expect(row.slice(0, 3).some(c => c.checked)).toBe(false);
    expect(row.slice(3).every(c => c.checked)).toBe(true);
  });

  it('copies the first bar of every drum to the later bars, through the transition fill', () => {
    const { store, verses } = setup();
    const v = verses[0];
    const voices = [...Array(9).keys()];
    const copy = () => {
      const { drums, drumGroove } = state(store).songStructure[v];
      const later = [...new Set(stepBarsOf(drumGroove))].filter(bar => bar > 0);
      return barCopyEdits(drums, drumGroove, voices, 0, later);
    };
    expect(copy().length).toBeGreaterThan(0);
    store.dispatch(setDrumCells({ index: v, cells: copy() }));
    expect(copy()).toEqual([]);
  });

  it('keeps a step edit under a transition fill local to its part', () => {
    const { store, verses } = setup();
    const v = verses[0];
    const kick = () => state(store).songStructure[v].drums[0];
    // The verse's last steps lead into the chorus with a fill, which clears
    // the kick under it whatever the section has there.
    const step = kick().length - 2;
    expect(kick()[step].checked).toBe(false);
    store.dispatch(setDrumState({ index: v, drumPart: 0, drumStep: step, drums: { index: step, checked: true } }));
    expect(kick()[step].checked).toBe(true);
    expect(state(store).doc!.form[v].drumOverrides).toContainEqual({ voice: 0, step, checked: true });
    expect(state(store).doc!.sections.verse.drums[0][step].checked).toBe(false);
  });

  it('leaves the song alone when a drum fill changes nothing', () => {
    const { store, verses } = setup();
    const before = state(store);
    const off = before.songStructure[verses[0]].drums[0].map((c, i) => (c.checked ? -1 : i)).filter(i => i >= 0);
    store.dispatch(setDrumCells({ index: verses[0], cells: cells(0, off, false) }));
    expect(state(store)).toBe(before);
  });

  it('propagates bass and chord edits', () => {
    const { store, verses } = setup();
    const locs = state(store).songStructure[verses[1]].bassNoteLocations.map(l => ({ ...l }));
    const k = locs.findIndex(l => l.midi > 0);
    locs[k] = { ...locs[k], y: 60, acc: 'sharp' }; // F#2
    store.dispatch(setBassState({ index: verses[1], bassNoteLocations: locs }));
    verses.forEach(i => expect(state(store).songStructure[i].bassNoteLocations[k].midi).toBe(42));

    store.dispatch(setChordState({ part: verses[0], beat: 0, midi: 86, osc: 0, checked: true }));
    verses.forEach(i => expect(state(store).songStructure[i].chordTones.midiTones[0]).toContain(86));
  });

  it('re-rolls a layer, respecting locks, without touching other sections', () => {
    const { store } = setup();
    const before = state(store).songStructure.map(p => JSON.stringify(p.drums));
    store.dispatch(toggleLock({ sectionId: 'chorus', layer: 'drums' }));
    store.dispatch(rerollLayer({ sectionId: 'chorus', layer: 'drums' }));
    expect(state(store).songStructure.map(p => JSON.stringify(p.drums))).toEqual(before);
    store.dispatch(toggleLock({ sectionId: 'chorus', layer: 'drums' }));
    store.dispatch(rerollLayer({ sectionId: 'chorus', layer: 'drums' }));
    const after = state(store).songStructure;
    after.forEach((p, i) => {
      if (p.sectionId !== 'chorus') expect(JSON.stringify(p.drums)).toBe(before[i]);
    });
    expect(after.some((p, i) => p.sectionId === 'chorus' && JSON.stringify(p.drums) !== before[i])).toBe(true);
  });

  it('keeps step ids contiguous after a rhythm re-roll', () => {
    const { store } = setup();
    store.dispatch(rerollLayer({ sectionId: 'verse', layer: 'rhythm' }));
    let next = 0;
    state(store).songStructure.forEach(p => p.stepIds.forEach(id => expect(id).toBe(next++)));
  });

  it('sets energy on one instance and reorders through the document', () => {
    const { store, verses } = setup();
    store.dispatch(setPartEnergy({ index: verses[0], energy: 0.1 }));
    expect(state(store).doc!.form[verses[0]].energy).toBe(0.1);
    expect(state(store).songStructure[verses[0]].energy).toBe(0.1);
    const order = state(store).songStructure.map(p => p.sectionId);
    store.dispatch(reorderParts({ from: 0, to: 1 }));
    const moved = state(store).songStructure.map(p => p.sectionId);
    expect(moved[1]).toBe(order[0]);
    expect(state(store).doc!.form.map(f => f.sectionId)).toEqual(moved);
  });

  it('still edits classic songs per part', () => {
    const store = makeStore();
    const { songStructure, key, bpm, seed, params } = createRandomSong(3);
    store.dispatch(setSong({ songStructure, key, bpm, seed, params }));
    expect(state(store).doc).toBeNull();
    const was = state(store).songStructure[0].drums[1][1].checked;
    store.dispatch(setDrumState({ index: 0, drumPart: 1, drumStep: 1, drums: { index: 1, checked: !was } }));
    expect(state(store).songStructure[0].drums[1][1].checked).toBe(!was);
    const steps = state(store).songStructure[0].drums[1].map((_, i) => i);
    store.dispatch(setDrumCells({ index: 0, cells: cells(1, steps, true) }));
    expect(state(store).songStructure[0].drums[1].every(c => c.checked)).toBe(true);
    expect(state(store).songStructure[1].drums[1].every(c => c.checked)).toBe(false);
  });
});
