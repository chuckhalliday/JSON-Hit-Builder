export function sumArray(array) {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum;
}

export function shuffleArray(array) {
  // Fisher-Yates Shuffle algorithm 
  // First element (0.5) left in place to avoid rest on beat one
  let newArray = [];
  for (let i = array.length - 2; i > 1; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [array[j], array[i]];
  }
  return newArray;
}

export function subdivideArray(arr) {
  let newArr = [];

  for (let i = 0; i < arr.length; i++) {
    if ((arr[i] === 0.5 || arr[i] === 0.25) && Math.random() < 0.2) {
      // randomly subdivide element
      let val = arr[i] / 3;
      let trip = parseFloat(val.toFixed(2));
      let lastDigit = val.toFixed(4)[5];
      let tripAlt;

      if (lastDigit === "3") {
        tripAlt = parseFloat((trip + 0.01).toFixed(2));
      } else if (lastDigit === "7") {
        tripAlt = parseFloat((trip - 0.01).toFixed(2));
      }
      newArr.push(trip, trip, tripAlt); // add rounded triplets
    } else {
      // keep original element
      newArr.push(arr[i]);
    }
  }

  return newArr;
}
