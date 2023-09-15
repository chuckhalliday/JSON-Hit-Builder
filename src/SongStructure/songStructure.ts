import { drawBass, bassMeasures } from "./bass";
import { chordLocation, createChordTones } from "./chords";

export function generateSongStructure(partsLength: number, bassVA: string[], bassGrooveV: number[], bassCA: string[], bassGrooveC: number[], bassBA: string[], bassGrooveB: number[], chordsVA: string[], chordsGrooveV: number[], chordsCA: string[], chordsGrooveC: number[], chordsBA: string[], chordsGrooveB: number[], 
drumVerse: { index: number; checked: boolean; accent?: boolean }[][], drumGrooveV: number[], drumChorus: { index: number; checked: boolean; accent?: boolean }[][], drumGrooveC: number[], drumBridge: { index: number; checked: boolean; accent?: boolean }[][], drumGrooveB: number[]) {

  const partTypes = ['Verse', 'Chorus', 'Bridge'];
  let verseCount: number = 0
  let chorusCount: number = 0
  let bridgeCount: number = 0

  const songStructure: {
    type: string;
    repeat: number;
    bass: string[];
    bassGroove: number[];
    bassGrid: number[];
    bassNoteLocations: {
        x: number;
        y: number;
        acc: string;
    }[];
    measureLines: number[];
    drums: { index: number; checked: boolean; accent?: boolean }[][]
    drumGroove: number[];
    stepIds: number[];
    chords: string[];
    chordTones: {
      oscTones: number[][],
      midiTones: number[][]
    }
    chordsGroove: number[];
    chordsLocation: number[];
  }[] = [];

  let remainingParts = partsLength;
  let lastPartType: string;
  let partBass: string[];
  let partBassGroove: number[];
  let partDrums: { index: number; checked: boolean; accent?: boolean }[][]
  let partDrumsGroove: number[];
  let partChords: string[];
  let partChordsGroove: number[];

  let randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 1);

  let [bassGrid, measureLines] = bassMeasures(bassGrooveV, drumGrooveV)
  let bassNoteLocations = (drawBass(bassVA, bassGrid))
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
    let randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    while (randomPartType === lastPartType) {
      randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
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

    randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 1);
    [bassGrid, measureLines] = bassMeasures(partBassGroove, partDrumsGroove)
    bassNoteLocations = drawBass(partBass, bassGrid)
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