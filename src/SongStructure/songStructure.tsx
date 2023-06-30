export function generateSongStructure(partsLength: number, bassVA: string, bassCA: string, bassBA: string, 
  flairV: string, hiHatV: string, snareDrumV: string, bassDrumV: string,
  flairC: string, hiHatC: string, snareDrumC: string, bassDrumC: string,
  flairB: string, hiHatB: string, snareDrumB: string, bassDrumB: string,
  chordsVA: string, chordsCA: string, chordsBA: string) {
  const partTypes = ['Verse', 'Chorus', 'Bridge'];
  const songStructure = [];
  let remainingParts = partsLength;
  let lastPartType = '';
  let partBass;
  let partKick;
  let partSnare;
  let partHiHat;
  let partFlair;
  let partChords;

  while (remainingParts > 0) {
    let randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    while (randomPartType === lastPartType) {
      randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    }
    const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 1);
    if (randomPartType === 'Verse') {
      partChords = chordsVA
      partBass = bassVA
      partKick = bassDrumV
      partSnare = snareDrumV
      partHiHat = hiHatV
      partFlair = flairV
    } else if (randomPartType === 'Chorus') {
      partChords = chordsCA
      partBass = bassCA
      partKick = bassDrumC
      partSnare = snareDrumC
      partHiHat = hiHatC
      partFlair = flairC
    }  else if (randomPartType === 'Bridge') {
      partChords = chordsBA
      partBass = bassBA
      partKick = bassDrumB
      partSnare = snareDrumB
      partHiHat = hiHatB
      partFlair = flairB
    }

    songStructure.push({ type: randomPartType, length: randomPartLength, bass: partBass, 
      kick: partKick, snare: partSnare, hiHat: partHiHat, flair: partFlair, chords: partChords });
    remainingParts -= randomPartLength;
    lastPartType = randomPartType;
  }
  return songStructure;
}