// Key signatures, and the accidentals printed music shows around them.
//
// A staff opens with its key's sharps or flats; a note then shows an
// accidental only where its pitch differs from what the key signature - or
// an accidental earlier in the same bar, on the same line or space - gives
// it. That accidental holds for the rest of the bar, so a note going back
// to the key's pitch there shows a natural (or the key's sharp or flat).

import { Key } from './theory';
import { SongDoc } from './doc';
import { transposedKey } from './realize';
import { parseKeyString } from './exportMidi';

// The letters (0 = C .. 6 = B) a signature sharpens or flattens, in the
// order it adds them.
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // B E A D G C F

// What a signature (positive = sharps, as keySignature counts) does to a
// letter: 1 sharpens it, -1 flattens it, 0 leaves it natural.
export function signatureAlteration(signature: number, letter: number): number {
  if (signature > 0) return SHARP_ORDER.slice(0, signature).includes(letter) ? 1 : 0;
  if (signature < 0) return FLAT_ORDER.slice(0, -signature).includes(letter) ? -1 : 0;
  return 0;
}

// Where each of a signature's sharps or flats sits, as diatonic steps
// (letters counted up from C0, as written): the usual zigzag, kept on the
// staff.
const PLACES: Record<'treble' | 'bass', { sharps: number[], flats: number[] }> = {
  treble: { sharps: [38, 35, 39, 36, 33, 37, 34], flats: [34, 37, 33, 36, 32, 35, 31] },
  bass: { sharps: [24, 21, 25, 22, 19, 23, 20], flats: [20, 23, 19, 22, 18, 21, 17] },
};

export function signaturePlaces(signature: number, clef: 'treble' | 'bass'): number[] {
  const places = PLACES[clef];
  return signature > 0 ? places.sharps.slice(0, signature) : places.flats.slice(0, -signature);
}

// A note as the staff sees it: its bar, the line or space it sits on (any
// number that's the same for the same line or space), its letter, and how
// far its pitch is raised or lowered from that letter's natural.
export interface StaffNote {
  bar: number;
  place: number;
  letter: number;
  alteration: number;
}

// The accidental each note shows (1 sharp, -1 flat, 0 natural), or null for
// none. Notes in the order they're played; null for rests.
export function shownAccidentals(notes: Array<StaffNote | null>, signature: number): Array<number | null> {
  let bar = NaN;
  let held = new Map<number, number>();
  return notes.map((note) => {
    if (!note) return null;
    if (note.bar !== bar) {
      bar = note.bar;
      held = new Map();
    }
    const expected = held.get(note.place) ?? signatureAlteration(signature, note.letter);
    if (note.alteration === expected) return null;
    held.set(note.place, note.alteration);
    return note.alteration;
  });
}

// The key a part is written in: the song's, lifted by the part's own
// transposition (a final-chorus lift); C major if it can't be read.
export function partKey(doc: SongDoc | null | undefined, songKey: string, part: number): Key {
  if (doc) return transposedKey(doc.key, doc.form[part]?.transpose ?? 0);
  return parseKeyString(songKey) ?? { tonic: 0, mode: 'major' };
}
