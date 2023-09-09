export function randomGroove() {
  const initBass: number[] = [0.5];
  let measureSum = 0.5;
  let beatSum = 0.5;

  const randomValues = [0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.5, 1, 1.5, 2, 0.25, 0.75];

  while (measureSum < 8) {
    const random = randomValues[Math.floor(Math.random() * randomValues.length)];
    if (beatSum + random <= 2) {
      initBass.push(random);
      beatSum += random;
    } else {
    }
    if (beatSum === 2) {
      beatSum = 0;
      measureSum += 2;
    }
  }
  return initBass;
}

function getRandomSection() {
  const section = [];
  for (let i = 0; i < 4; i++) {
    const roll = Math.random();
    if (roll > 0.6) {
      section.push(0);
    } else if (roll > 0.4) {
      section.push(1);
    } else if (roll > 0.2) {
      section.push(2);
    } else {
      section.push(3);
    }
  }
  return section;
}

export function randomArrangement() {
  const verse = getRandomSection();
  const chorus = getRandomSection();
  const bridge = getRandomSection();
  const arrangement = [verse, chorus, bridge];
  console.log(arrangement)
  return arrangement;
}

export function sumArray(groove: number[]) {
  let sum = 0;
  for (let i = 0; i < groove.length; i++) {
    sum += groove[i];
  }
  return sum;
}

export function shuffleArray(groove: number[]) {
  // Fisher-Yates Shuffle algorithm 
  // First element (0.5) left in place to avoid rest on beat one
  let newArray: number[] = [];
  for (let i = groove.length - 2; i > 1; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [groove[j], groove[i]];
  }
  return newArray;
}

export function subdivideArray(groove: number[]) {
  let newArr: number[] = [];

  for (let i = 0; i < groove.length; i++) {
    if ((groove[i] === 0.5 || groove[i] === 0.25) && Math.random() < 0.2) {
      // randomly subdivide element
      let val = groove[i] / 3;
      let trip = parseFloat(val.toFixed(2));
      let lastDigit = val.toFixed(4)[5];
      let tripAlt: number;

      if (lastDigit === "3") {
        tripAlt = parseFloat((trip + 0.01).toFixed(2));
      } else if (lastDigit === "7") {
        tripAlt = parseFloat((trip - 0.01).toFixed(2));
      } else {
        tripAlt = 0
      }
      newArr.push(tripAlt, trip, trip); // add rounded triplets
    } else {
      // keep original element
      newArr.push(groove[i]);
    }
  }

  return newArr;
}
