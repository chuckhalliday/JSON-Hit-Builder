export function lampToPositions(lampId: number, drumGroove: number[], bassGroove: number[], chordsGroove: number[]): [number, number, number] {
  let drumPosition = 0
  let bassPosition = 0
  let chordPosition = 0
  let drumSum = 0
  let bassSum = bassGroove[0]
  let chordSum = chordsGroove[0]
  let bassIndex = 1
  let chordIndex = 1

  for (let i = 0; i < lampId; i++) {
    drumSum += drumGroove[i]
    drumSum = parseFloat(drumSum.toFixed(2))
    if (drumSum === chordSum && bassSum === chordSum) {
      drumPosition = i + 1
      bassPosition = bassIndex
      chordPosition = chordIndex
    }
    if (drumSum === chordSum) {
      chordSum += chordsGroove[chordIndex]
      chordSum = parseFloat(chordSum.toFixed(2))
      chordIndex++
    }
    if (drumSum === bassSum) {
      bassSum += bassGroove[bassIndex]
      bassSum = parseFloat(bassSum.toFixed(2))
      bassIndex++
    }
  }
  return [drumPosition, bassPosition, chordPosition]
}

export function indexToLamp(sourceGroove: number[], sourceIndex: number, drumGroove: number[]): number {
  let targetSum = 0
  for (let i = 0; i < sourceIndex; i++) {
    targetSum += sourceGroove[i]
  }
  targetSum = parseFloat(targetSum.toFixed(2))

  let drumSum = 0
  for (let i = 0; i < drumGroove.length; i++) {
    if (parseFloat(drumSum.toFixed(2)) === targetSum) {
      return i
    }
    drumSum += drumGroove[i]
  }
  return Math.max(drumGroove.length - 1, 0)
}
