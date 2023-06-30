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
      newArr.push(trip, trip, tripAlt); // add rounded triplets
    } else {
      // keep original element
      newArr.push(groove[i]);
    }
  }

  return newArr;
}
