import { beatsToTickPositions } from '../Core/time'

// The last place at or before drum step `lampId` where a drum step, a bass
// note and a chord all start: their indices there. Compared as positions
// snapped to whole ticks, so rounded triplets (0.16, 0.17) and a shuffle's
// exact thirds of a beat both line up.
export function lampToPositions(lampId: number, drumGroove: number[], bassGroove: number[], chordsGroove: number[]): [number, number, number] {
  const drumAt = beatsToTickPositions(drumGroove)
  const bassAt = beatsToTickPositions(bassGroove)
  const chordAt = beatsToTickPositions(chordsGroove)
  for (let step = Math.min(lampId, drumGroove.length); step > 0; step--) {
    const bass = bassAt.indexOf(drumAt[step])
    const chord = chordAt.indexOf(drumAt[step])
    if (bass !== -1 && chord !== -1) return [step, bass, chord]
  }
  return [0, 0, 0]
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
