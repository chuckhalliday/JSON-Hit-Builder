import React, { useState } from "react";
import styles from "../Styles/App.module.scss";

interface GenerateProps {
  onClose: () => void;
}

const noteMapping: { [key: number]: string } = {
    2: "../notes/halfnote.webp",
    1.5: "../notes/dottedquarternote.webp", 
    1: "..//notes/quarternote.webp",
    0.75: "../notes/dottedeighthnote.webp",
    0.5: "../notes/eighthnote.webp",
    0.25: "../notes/sixteenthnote.webp",
  };

export default function Generate({ onClose }: GenerateProps) {
  const [numbers, setNumbers] = useState([2, 2, 2, 2]);

  const combineNumbers = (index: number) => {
    const newNumbers = [...numbers];
    const numberSum = numbers[index] + numbers[index + 1];
    if (
      numberSum === 0.5 ||
      numberSum === 0.75 ||
      numberSum === 1 ||
      numberSum === 1.5 ||
      numberSum === 2
    ) {
      newNumbers.splice(index, 2, numberSum);
      setNumbers(newNumbers);
    }
  };

  const divideNumbers = (index: number) => {
    const newNumbers = [...numbers]; // Create a copy of the numbers array
    if (numbers[index] === 4) {
      newNumbers.splice(index, 1, 2);
      newNumbers.splice(index, 0, 2);
    } else if (numbers[index] === 2) {
      newNumbers.splice(index, 1, 1);
      newNumbers.splice(index, 0, 1);
    } else if (numbers[index] === 1) {
      newNumbers.splice(index, 1, 0.5);
      newNumbers.splice(index, 0, 0.5);
    } else if (numbers[index] === 0.5) {
      newNumbers.splice(index, 1, 0.25);
      newNumbers.splice(index, 0, 0.25);
    }
    setNumbers(newNumbers); // Update the state with the new array
  };

  return (
    <div className={styles.generateContainer}>
      <button onClick={onClose}>x</button>
      <div>
        <h2>Generate New Song</h2>
        <p>~Under Construction~</p>
        <p>Primary Bass Groove:</p>
        <span className="number">
          {numbers.map((item: number, index: number) =>
            index === numbers.length - 1 ? (
              <span key={index} onClick={() => divideNumbers(index)}>
                <span> </span>
                <img className={styles.resize} src={noteMapping[item]} alt={`Note ${item}`} />
              </span>
            ) : (
              <span key={index}>
                <span> </span>
                <span onClick={() => divideNumbers(index)}><img className={styles.resize} src={noteMapping[item]} alt={`Note ${item}`} /></span>
                <span> </span>
                <button
                  className={styles.grooveButton}
                  onClick={() => combineNumbers(index)}
                >+</button>
              </span>
            )
          )}
        </span>
      </div>
    </div>
  );
}
