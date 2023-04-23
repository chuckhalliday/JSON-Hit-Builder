export function generateSongStructure(partsLength) {
  const partTypes = ['Verse', 'Chorus', 'Bridge'];
  const songStructure = [];
  let remainingParts = partsLength;
  let lastPartType = '';

  while (remainingParts > 0) {
    let randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    while (randomPartType === lastPartType) {
      randomPartType = partTypes[Math.floor(Math.random() * partTypes.length)];
    }
    const randomPartLength = Math.min(remainingParts, Math.floor(Math.random() * 3) + 2);

    songStructure.push({ type: randomPartType, length: randomPartLength });
    remainingParts -= randomPartLength;
    lastPartType = randomPartType;
  }
  return songStructure;
}