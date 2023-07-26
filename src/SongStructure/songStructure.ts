import { drawBass } from "./bass";

export function generateSongStructure(partsLength: number, bassVA: string[], bassGrooveV: number[], bassCA: string[], bassGrooveC: number[], bassBA: string[], bassGrooveB: number[], 
  flairV: string, hiHatV: string, snareDrumV: string, bassDrumV: string, drumGrooveV: number[],
  flairC: string, hiHatC: string, snareDrumC: string, bassDrumC: string, drumGrooveC: number[],
  flairB: string, hiHatB: string, snareDrumB: string, bassDrumB: string, drumGrooveB: number[],
  chordsVA: string, chordsGrooveV: number[], chordsCA: string, chordsGrooveC: number[], chordsBA: string, chordsGrooveB: number[]) {
  const partTypes = ['Verse', 'Chorus', 'Bridge'];
  const songStructure: {
    type: string;
    repeat: number;
    bass: string[];
    bassGroove: number[];
    bassGrid: number[];
    bassNoteLocations: {
        x: number;
        y: number;
    }[];
    kick: string;
    snare: string;
    hiHat: string;
    flair: string;
    drumGroove: number[];
    chords: string;
    chordsGroove: number[];
}[] = [];
  let remainingParts = partsLength;
  let lastPartType = '';
  let partBass: string[];
  let partBassGroove: number[];
  let partKick: string;
  let partSnare: string;
  let partHiHat: string;
  let partFlair: string;
  let partDrumsGroove: number[];
  let partChords: string;
  let partChordsGroove: number[];

  const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 1);

  let bassArray: number[]=[115]
  let gridX: number = 115
  let bassSum: number = bassGrooveV[0]
  let drumSum: number = 0
  let bassIndex: number = 1
  for (let i = 0; i < drumGrooveV.length; i++) {
    drumSum+= drumGrooveV[i]
    if (drumSum >= 3.93 && drumSum <= 4.07 || drumSum >= 7.93 && drumSum <= 8.07) {
      gridX += 78
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

  for (let i = 0; i < randomPartLength; i++) {
  songStructure.push({ type: 'Verse', repeat: randomPartLength, bass: bassVA, bassGroove: bassGrooveV, bassGrid: bassGrid, bassNoteLocations: bassNoteLocations,
  kick: bassDrumV, snare: snareDrumV, hiHat: hiHatV, flair: flairV, drumGroove: drumGrooveV, chords: chordsVA, chordsGroove: chordsGrooveB });
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
      partKick = bassDrumV
      partSnare = snareDrumV
      partHiHat = hiHatV
      partFlair = flairV
      partDrumsGroove = drumGrooveV
    } else if (randomPartType === 'Chorus') {
      partChords = chordsCA
      partChordsGroove = chordsGrooveC
      partBass = bassCA
      partBassGroove = bassGrooveC
      partKick = bassDrumC
      partSnare = snareDrumC
      partHiHat = hiHatC
      partFlair = flairC
      partDrumsGroove = drumGrooveC
    } else {
      partChords = chordsBA
      partChordsGroove = chordsGrooveB
      partBass = bassBA
      partBassGroove = bassGrooveB
      partKick = bassDrumB
      partSnare = snareDrumB
      partHiHat = hiHatB
      partFlair = flairB
      partDrumsGroove = drumGrooveB
    }

    const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 1);

    let bassArray: number[]=[115]
    let gridX: number = 115
    let bassSum: number = partBassGroove[0]
    let drumSum: number = 0
    let bassIndex: number = 1
    for (let i = 0; i < partDrumsGroove.length; i++) {
      drumSum+= partDrumsGroove[i]
      if (drumSum >= 3.93 && drumSum <= 4.07 || drumSum >= 7.93 && drumSum <= 8.07) {
        gridX += 78
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
    for (let i = 0; i < randomPartLength; i++) {
    songStructure.push({ type: randomPartType, repeat: randomPartLength, bass: partBass, bassGroove: partBassGroove, bassGrid: bassGrid, bassNoteLocations: bassNoteLocations,
      kick: partKick, snare: partSnare, hiHat: partHiHat, flair: partFlair, drumGroove: partDrumsGroove, chords: partChords, chordsGroove: partChordsGroove });
    }
    remainingParts -= randomPartLength;
    lastPartType = randomPartType;
  }
  return songStructure;
}