import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setSong, SongState } from "../reducers";
import generateSong from "../SongStructure/generateSong";
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
  const dispatch = useDispatch()
  const [grooves, setGrooves] = useState([
    // Initial primary bass groove
    [2, 2, 2, 2],
  ]);
  const [arrangement, setArrangement] = useState([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [triplet, setTriplet] = useState(0.0)

  const generateNew = generateSong(grooves, arrangement, triplet)
  
  const updateSong = () => {
    dispatch(setSong(generateNew))
  }

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
    setArrangement([   
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],])
  };

  const incrementPart = (value: number, partType: number, partNum: number) => {
    const newArr = [...arrangement]
    console.log(value)
    console.log(grooves.length)
    if (value < grooves.length - 1){
      newArr[partType].splice(partNum, 1, value+1)
      console.log(newArr)
      setArrangement(newArr)
    } else {
      newArr[partType].splice(partNum, 1, 0)
      console.log('no')
      setArrangement(newArr)
    }
  }

  return (
    <div className={styles.generateContainer}>
      <button onClick={onClose}>x</button>
      <div>
        <h2>Generate New Song</h2>
        <p>~Under Construction~</p>
        <p>Triplet Frequency:     
          <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          defaultValue="0" // Set an initial value (e.g., 5)
          className={styles.circularDial} // Apply your custom dial styles
          onChange={(e) => {
          const newValue = parseInt(e.target.value, 10);
          setTriplet(newValue)
          }}
        /></p>
        {grooves.map((groove, grooveIndex) => (
          <div key={grooveIndex}>
            <p>Bass Groove {grooveIndex + 1}:</p>
            <span>
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
        <div>
            <p>Verse Structure:</p>
            <button onClick={() => incrementPart(arrangement[0][0], 0, 0)}>BG: {arrangement[0][0]+1}</button>
            <button onClick={() => incrementPart(arrangement[0][1], 0, 1)}>BG: {arrangement[0][1]+1}</button>
            <button onClick={() => incrementPart(arrangement[0][2], 0, 2)}>BG: {arrangement[0][2]+1}</button>
            <button onClick={() => incrementPart(arrangement[0][3], 0, 3)}>BG: {arrangement[0][3]+1}</button>

            <p>Chorus Structure:</p>
            <button onClick={() => incrementPart(arrangement[1][0], 1, 0)}>BG: {arrangement[1][0]+1}</button>
            <button onClick={() => incrementPart(arrangement[1][1], 1, 1)}>BG: {arrangement[1][1]+1}</button>
            <button onClick={() => incrementPart(arrangement[1][2], 1, 2)}>BG: {arrangement[1][2]+1}</button>
            <button onClick={() => incrementPart(arrangement[1][3], 1, 3)}>BG: {arrangement[1][3]+1}</button>

            <p>Bridge Structure:</p>
            <button onClick={() => incrementPart(arrangement[2][0], 2, 0)}>BG: {arrangement[2][0]+1}</button>
            <button onClick={() => incrementPart(arrangement[2][1], 2, 1)}>BG: {arrangement[2][1]+1}</button>
            <button onClick={() => incrementPart(arrangement[2][2], 2, 2)}>BG: {arrangement[2][2]+1}</button>
            <button onClick={() => incrementPart(arrangement[2][3], 2, 3)}>BG: {arrangement[2][3]+1}</button>
        </div>
        <br/>
        <button onClick={() => updateSong()}>Regenerate</button>
      </div>
    </div>
  );
}
