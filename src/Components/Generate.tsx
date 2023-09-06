import React, { useState } from "react";
import styles from "../Styles/App.module.scss";

interface GenerateProps {
  onClose: () => void;
}

const noteMapping: { [key: number]: string } = {
  2: "../notes/halfnote.webp",
  1.5: "../notes/dottedquarternote.webp",
  1: "../notes/quarternote.webp",
  0.75: "../notes/dottedeighthnote.webp",
  0.5: "../notes/eighthnote.webp",
  0.25: "../notes/sixteenthnote.webp",
};

export default function Generate({ onClose }: GenerateProps) {
  const [grooves, setGrooves] = useState([
    // Initial primary bass groove
    [2, 2, 2, 2],
  ]);

  const combineNumbers = (grooveIndex: number, index: number) => {
    const newGrooves = [...grooves];
    const numberSum = newGrooves[grooveIndex][index] + newGrooves[grooveIndex][index + 1];
    if (
      numberSum === 0.5 ||
      numberSum === 0.75 ||
      numberSum === 1 ||
      numberSum === 1.5 ||
      numberSum === 2
    ) {
      newGrooves[grooveIndex].splice(index, 2, numberSum);
      setGrooves(newGrooves);
    }
  };

  const divideNumbers = (grooveIndex: number, index: number) => {
    const newGrooves = [...grooves];
    if (newGrooves[grooveIndex][index] === 4) {
      newGrooves[grooveIndex].splice(index, 1, 2);
      newGrooves[grooveIndex].splice(index, 0, 2);
    } else if (newGrooves[grooveIndex][index] === 2) {
      newGrooves[grooveIndex].splice(index, 1, 1);
      newGrooves[grooveIndex].splice(index, 0, 1);
    } else if (newGrooves[grooveIndex][index] === 1) {
      newGrooves[grooveIndex].splice(index, 1, 0.5);
      newGrooves[grooveIndex].splice(index, 0, 0.5);
    } else if (newGrooves[grooveIndex][index] === 0.5) {
      newGrooves[grooveIndex].splice(index, 1, 0.25);
      newGrooves[grooveIndex].splice(index, 0, 0.25);
    }
    setGrooves(newGrooves);
  };

  const addGroove = () => {
    const newGrooves = [...grooves, [2, 2, 2, 2]]; // Add a new groove with initial values
    setGrooves(newGrooves);
  };

  const removeGroove = (grooveIndex: number) => {
    const newGrooves = [...grooves];
    newGrooves.splice(grooveIndex, 1); // Remove the groove at the specified index
    setGrooves(newGrooves);
  };

  return (
    <div className={styles.generateContainer}>
      <button onClick={onClose}>x</button>
      <div>
        <h2>Generate New Song</h2>
        <p>~Under Construction~</p>
        {grooves.map((groove, grooveIndex) => (
          <div key={grooveIndex}>
            <p>Bass Groove {grooveIndex + 1}:</p>
            <span className="number">
              {groove.map((item: number, index: number) => (
                index === groove.length - 1 ? (
                <span key={index}  onClick={() => divideNumbers(grooveIndex, index)}>
                  <span> </span>
                  <img className={styles.resize} src={noteMapping[item]} alt={`Note ${item}`} />
                  <span> </span>
                  </span>
                  ) : (
                <span key={index}>
                  <span onClick={() => divideNumbers(grooveIndex, index)}>
                    <img className={styles.resize} src={noteMapping[item]} alt={`Note ${item}`} />
                  </span>
                  <span> </span>
                  <button
                    className={styles.grooveButton}
                    onClick={() => combineNumbers(grooveIndex, index)}
                  >
                    +
                  </button>
                </span>
                )
              ))}
            </span>
            {grooveIndex > 0 && (
                <button onClick={() => removeGroove(grooveIndex)}>-</button>
            )}
            {grooveIndex < 3 && (
                <button onClick={addGroove}>+</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
