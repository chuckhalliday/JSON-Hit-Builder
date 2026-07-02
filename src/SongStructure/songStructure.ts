import { drawBass, bassMeasures } from "./bass";
import { chordLocation, createChordTones } from "./chords";
import { SongStructure, NoteLocation, DrumHit } from "../types";
import { rng } from "./rng";

export function generateSongStructure(partsLength: number, bassVA: string[], bassGrooveV: number[], bassCA: string[], bassGrooveC: number[], bassBA: string[], bassGrooveB: number[], chordsVA: string[], chordsGrooveV: number[], chordsCA: string[], chordsGrooveC: number[], chordsBA: string[], chordsGrooveB: number[], 
drumVerse: DrumHit[][], drumGrooveV: number[], drumChorus: DrumHit[][], drumGrooveC: number[], drumBridge: DrumHit[][], drumGrooveB: number[]) {

  const partTypes = ['Verse', 'Chorus', 'Bridge'];
  let verseCount: number = 0
  let chorusCount: number = 0
  let bridgeCount: number = 0

  const songStructure: SongStructure = [];

  let remainingParts = partsLength;
  let lastPartType: string;
  let partBass: string[];
  let partBassGroove: number[];
  let partDrums: DrumHit[][]
  let partDrumsGroove: number[];
  let partChords: string[];
  let partChordsGroove: number[];

  let randomPartLength = Math.min(remainingParts, Math.floor(rng() * 3) + 1);

  // drawBass returns one more note-location than the groove has durations: the
  // bass grid carries an extra leading coordinate (the clef offset), so the last
  // note-location is an off-staff rest with no matching duration. Playback pairs
  // pattern[i] with groove[i], so trim any excess trailing entries to keep the
  // pattern the same length as the groove. Only ever shortens, never pads.
  const trimToGroove = (
    locs: NoteLocation[],
    groove: number[]
  ) => (locs.length > groove.length ? locs.slice(0, groove.length) : locs);

  let [bassGrid, measureLines] = bassMeasures(bassGrooveV, drumGrooveV)
  let bassNoteLocations = trimToGroove(drawBass(bassVA, bassGrid), bassGrooveV)
  let chordLocations = (chordLocation(bassNoteLocations, bassGrooveV, chordsGrooveV))
  let chordTones = createChordTones(chordsVA)

  for (let i = 0; i < randomPartLength; i++) {
  verseCount++
  songStructure.push({ type: 'Verse', repeat: verseCount, bass: bassVA, bassGroove: bassGrooveV, bassGrid: bassGrid, bassNoteLocations: bassNoteLocations, measureLines: measureLines,
  drums: drumVerse, drumGroove: drumGrooveV, stepIds: [], chords: chordsVA, chordTones: chordTones, chordsGroove: chordsGrooveV, chordsLocation: chordLocations });
  }
  remainingParts -= randomPartLength;
  lastPartType = 'Verse'

  while (remainingParts > 0) {
    let randomPartType = partTypes[Math.floor(rng() * partTypes.length)];
    while (randomPartType === lastPartType) {
      randomPartType = partTypes[Math.floor(rng() * partTypes.length)];
    }
    if (randomPartType === 'Verse') {
      partChords = chordsVA
      partChordsGroove = chordsGrooveV
      partBass = bassVA
      partBassGroove = bassGrooveV
      partDrums = drumVerse
      partDrumsGroove = drumGrooveV
    } else if (randomPartType === 'Chorus') {
      partChords = chordsCA
      partChordsGroove = chordsGrooveC
      partBass = bassCA
      partBassGroove = bassGrooveC
      partDrums = drumChorus
      partDrumsGroove = drumGrooveC
    } else {
      partChords = chordsBA
      partChordsGroove = chordsGrooveB
      partBass = bassBA
      partBassGroove = bassGrooveB
      partDrums = drumBridge
      partDrumsGroove = drumGrooveB
    }

    randomPartLength = Math.min(remainingParts, Math.floor(rng() * 3) + 1);
    [bassGrid, measureLines] = bassMeasures(partBassGroove, partDrumsGroove)
    bassNoteLocations = trimToGroove(drawBass(partBass, bassGrid), partBassGroove)
    chordLocations = (chordLocation(bassNoteLocations, partBassGroove, partChordsGroove))
    chordTones = createChordTones(partChords)

    for (let i = 0; i < randomPartLength; i++) {
      let repeat: number;
      if (randomPartType === 'Verse') {
        verseCount++
        repeat = verseCount
      } else if (randomPartType === 'Chorus') {
        chorusCount++
        repeat = chorusCount
      } else if (randomPartType === 'Bridge') {
        bridgeCount++
        repeat = bridgeCount
      } else {
        repeat = 0
      }
    songStructure.push({ type: randomPartType, repeat: repeat, bass: partBass, bassGroove: partBassGroove, bassGrid: bassGrid, bassNoteLocations: bassNoteLocations, measureLines: measureLines,
      drums: partDrums, drumGroove: partDrumsGroove, stepIds: [], chords: partChords, chordTones: chordTones, chordsGroove: partChordsGroove, chordsLocation: chordLocations });
    }
    remainingParts -= randomPartLength;
    lastPartType = randomPartType;
  }
  return songStructure;
}