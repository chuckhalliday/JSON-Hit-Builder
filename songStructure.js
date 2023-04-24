export function generateSongStructure(partsLength, bassVA, bassCA, bassBA, 
  flairV, hiHatV, snareDrumV, bassDrumV,
  flairC, hiHatC, snareDrumC, bassDrumC,
  flairB, hiHatB, snareDrumB, bassDrumB) {
  const partTypes = ['Verse', 'Chorus', 'Bridge'];
  const songStructure = [];
  let remainingParts = partsLength;
  let lastPartType = '';
  let partBass;
  let partKick;
  let partSnare;
  let partHiHat;
  let partFlair

  while (remainingParts > 0) {
    let randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    while (randomPartType === lastPartType) {
      randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    }
    const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 2);
    if (randomPartType === 'Verse') {
      partBass = bassVA
      partKick = bassDrumV
      partSnare = snareDrumV
      partHiHat = hiHatV
      partFlair = flairV
    } else if (randomPartType === 'Chorus') {
      partBass = bassCA
      partKick = bassDrumC
      partSnare = snareDrumC
      partHiHat = hiHatC
      partFlair = flairC
    }  else if (randomPartType === 'Bridge') {
      partBass = bassBA
      partKick = bassDrumB
      partSnare = snareDrumB
      partHiHat = hiHatB
      partFlair = flairB
    }

    songStructure.push({ type: randomPartType, length: randomPartLength, bass: partBass, 
      kick: partKick, snare: partSnare, hiHat: partHiHat, flair: partFlair });
    remainingParts -= randomPartLength;
    lastPartType = randomPartType;
  }
  return songStructure;
}