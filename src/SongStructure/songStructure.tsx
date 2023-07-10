export function generateSongStructure(partsLength: number, bassVA: string, bassGrooveV: number[], bassCA: string, bassGrooveC: number[], bassBA: string, bassGrooveB: number[], 
  flairV: string, hiHatV: string, snareDrumV: string, bassDrumV: string, drumGrooveV: number[],
  flairC: string, hiHatC: string, snareDrumC: string, bassDrumC: string, drumGrooveC: number[],
  flairB: string, hiHatB: string, snareDrumB: string, bassDrumB: string, drumGrooveB: number[],
  chordsVA: string, chordsGrooveV: number[], chordsCA: string, chordsGrooveC: number[], chordsBA: string, chordsGrooveB: number[]) {
  const partTypes = ['Verse', 'Chorus', 'Bridge'];
  const songStructure = [];
  let remainingParts = partsLength;
  let lastPartType = '';
  let partBass: string;
  let partBassGroove: number[];
  let partKick: string;
  let partSnare: string;
  let partHiHat: string;
  let partFlair: string;
  let partDrumsGroove: number[];
  let partChords: string;
  let partChordsGroove: number[];

  while (remainingParts > 0) {
    let randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    while (randomPartType === lastPartType) {
      randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    }
    const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 1);
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
    }  else {
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

    songStructure.push({ type: randomPartType, repeat: randomPartLength, bass: partBass, bassGroove: partBassGroove,
      kick: partKick, snare: partSnare, hiHat: partHiHat, flair: partFlair, drumGroove: partDrumsGroove, chords: partChords, chordsGroove: partChordsGroove });
    remainingParts -= randomPartLength;
    lastPartType = randomPartType;
  }
  return songStructure;
}