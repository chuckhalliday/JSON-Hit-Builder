export function shuffleArray(array) {
    // Fisher-Yates Shuffle algorithm
    let newArray = []
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [array[j], array[i]];
        }
        return newArray;
    }
    
    export function subdivideArray(arr) {
        let newArr = [];
      
        for (let i = 0; i < arr.length; i++) {
          if ((arr[i] === 0.5 || arr[i] === 0.25) && Math.random() < 0.2) { // randomly subdivide element
            let val = arr[i] / 3;
            let trip = parseFloat(val.toFixed(4))
            let lastDigit = trip.toFixed(4)[5];
            let tripAlt;
            
            if (lastDigit === '3') {
              tripAlt = parseFloat((trip + 0.0001).toFixed(4))
            } else if (lastDigit === '7') {
              tripAlt = parseFloat((trip - 0.0001).toFixed(4))
            } 
            newArr.push(trip, trip, tripAlt); // add 3 new values with rounding
          } else { // keep original element
            newArr.push(arr[i]);
          }
        }
      
        return newArr;
      }