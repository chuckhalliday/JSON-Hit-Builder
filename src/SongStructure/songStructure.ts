import { drawBass } from "./bass";
import { chordLocation } from "./chords";

export function generateSongStructure(partsLength: number, bassVA: string[], bassGrooveV: number[], bassCA: string[], bassGrooveC: number[], bassBA: string[], bassGrooveB: number[], 
drumVerse: { index: number; checked: boolean; accent?: boolean }[][], drumGrooveV: number[],
drumChorus: { index: number; checked: boolean; accent?: boolean }[][], drumGrooveC: number[],
drumBridge: { index: number; checked: boolean; accent?: boolean }[][], drumGrooveB: number[],
chordsVA: string[], chordsGrooveV: number[], chordsCA: string[], chordsGrooveC: number[], chordsBA: string[], chordsGrooveB: number[]) {
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
    chordsGroove: number[];
    chordsLocation: number[];
}[] = [];
  let remainingParts = partsLength;
  let lastPartType = '';
  let partBass: string[];
  let partBassGroove: number[];
  let partDrums: { index: number; checked: boolean; accent?: boolean }[][]
  let partDrumsGroove: number[];
  let partChords: string[];
  let partChordsGroove: number[];

  const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 1);

  let bassArray: number[]=[115]
  let gridX: number = 115
  let bassSum: number = bassGrooveV[0]
  let drumSum: number = 0
  let bassIndex: number = 1
  let measureLines: number[] = []
  for (let i = 0; i < drumGrooveV.length; i++) {
    drumSum+= drumGrooveV[i]
    if (drumSum >= 3.93 && drumSum <= 4.07 || drumSum >= 7.93 && drumSum <= 8.07) {
      gridX += 78
      measureLines.push(gridX - 42)
    } else if (Math.abs(Math.round(drumSum) - drumSum) <= 0.005) {
      gridX += 48
    } else {
      gridX += 38
    }
    if (bassSum - drumSum <= 0.05) {
      bassArray.push(gridX)
    if (bassSum >= 7.95 && drumSum >= 7.95) {
      bassSum = 0
      drumSum = 0
    }
    bassSum += bassGrooveV[bassIndex]
    bassIndex++
    }
  }

  const bassGrid = bassArray

  const bassNoteLocations = (drawBass(bassVA, bassGrid))
  const chordLocations = (chordLocation(bassNoteLocations, bassGrooveV, chordsGrooveV))

  for (let i = 0; i < randomPartLength; i++) {
  verseCount++
  songStructure.push({ type: 'Verse', repeat: verseCount, bass: bassVA, bassGroove: bassGrooveV, bassGrid: bassGrid, bassNoteLocations: bassNoteLocations, measureLines: measureLines,
  drums: drumVerse, drumGroove: drumGrooveV, stepIds: [], chords: chordsVA, chordsGroove: chordsGrooveB, chordsLocation: chordLocations });
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

    const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 1);

    let bassArray: number[]=[115]
    let gridX: number = 115
    let bassSum: number = partBassGroove[0]
    let drumSum: number = 0
    let bassIndex: number = 1
    let measureLines: number[] = []
    for (let i = 0; i < partDrumsGroove.length; i++) {
      drumSum+= partDrumsGroove[i]
      if (drumSum >= 3.93 && drumSum <= 4.07 || drumSum >= 7.93 && drumSum <= 8.07) {
        gridX += 78
        measureLines.push(gridX - 42)
      } else if (Math.abs(Math.round(drumSum) - drumSum) <= 0.005) {
        gridX += 48
      } else {
        gridX += 38
      }
      if (bassSum - drumSum <= 0.05) {
        bassArray.push(gridX)
      if (bassSum >= 7.95 && drumSum >= 7.95) {
        bassSum = 0
        drumSum = 0
      }
      bassSum += partBassGroove[bassIndex]
      bassIndex++
      }
    }

    const bassGrid = bassArray

    const bassNoteLocations = drawBass(partBass, bassGrid)
    const chordLocations = (chordLocation(bassNoteLocations, partBassGroove, partChordsGroove))
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
      drums: partDrums, drumGroove: partDrumsGroove, stepIds: [], chords: partChords, chordsGroove: partChordsGroove, chordsLocation: chordLocations });
    }
    remainingParts -= randomPartLength;
    lastPartType = randomPartType;
  }
  return songStructure;
}