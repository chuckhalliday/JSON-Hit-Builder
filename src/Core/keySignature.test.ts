import { partKey, shownAccidentals, signatureAlteration, signaturePlaces, StaffNote } from './keySignature';
import { keySignature } from './theory';
import { generateDoc } from './generate';

// Letters, 0 = C .. 6 = B.
const [C, D, E, F, G, A, B] = [0, 1, 2, 3, 4, 5, 6];
const note = (bar: number, place: number, letter: number, alteration: number): StaffNote => ({ bar, place, letter, alteration });

describe('key signatures', () => {
  it('sharpens or flattens the letters in signature order', () => {
    // D major: F# C#.
    expect([C, D, E, F, G, A, B].map(l => signatureAlteration(2, l))).toEqual([1, 0, 0, 1, 0, 0, 0]);
    // Eb major: Bb Eb Ab.
    expect([C, D, E, F, G, A, B].map(l => signatureAlteration(-3, l))).toEqual([0, 0, -1, 0, 0, -1, -1]);
    expect([C, D, E, F, G, A, B].map(l => signatureAlteration(0, l))).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('places sharps and flats in the usual zigzag on each clef', () => {
    // F5 C5 G5 on the treble staff; Bb2 Eb3 on the bass.
    expect(signaturePlaces(3, 'treble')).toEqual([38, 35, 39]);
    expect(signaturePlaces(-2, 'bass')).toEqual([20, 23]);
    expect(signaturePlaces(0, 'treble')).toEqual([]);
  });

  it('reads the key from the song, lifted by a part\'s transposition', () => {
    const doc = generateDoc({ seed: 3, formId: 'pop' });
    const lifted = { ...doc, form: doc.form.map((f, i) => (i === 1 ? { ...f, transpose: 2 } : f)) };
    expect(partKey(lifted, 'ignored', 0)).toEqual(doc.key);
    expect(partKey(lifted, 'ignored', 1)).toEqual({ ...doc.key, tonic: (doc.key.tonic + 2) % 12 });
    expect(keySignature(partKey(null, 'Bb Major', 0))).toBe(-2);
    expect(keySignature(partKey(null, 'D# Minor', 0))).toBe(6);
    expect(partKey(null, '', 0)).toEqual({ tonic: 0, mode: 'major' });
  });
});

describe('accidentals', () => {
  it('shows none on notes the key signature already gives', () => {
    // Bb major: Bb, Eb, F, C all in key.
    expect(shownAccidentals([note(0, 20, B, -1), note(0, 23, E, -1), note(0, 24, F, 0), note(0, 21, C, 0)], -2))
      .toEqual([null, null, null, null]);
  });

  it('marks notes outside the key, and naturals against the signature', () => {
    // G major (F#): F natural needs a natural; C# a sharp; Bb a flat.
    expect(shownAccidentals([note(0, 24, F, 0), note(0, 21, C, 1), note(0, 20, B, -1)], 1)).toEqual([0, 1, -1]);
  });

  it('holds an accidental to the end of its bar, on its own line or space', () => {
    // C major: C# then C on the same place in the bar needs a natural back;
    // the next bar starts fresh; another octave's C isn't affected.
    const notes = [note(0, 21, C, 1), note(0, 21, C, 1), note(0, 28, C, 0), note(0, 21, C, 0), note(1, 21, C, 1), note(1, 21, C, 0)];
    expect(shownAccidentals(notes, 0)).toEqual([1, null, null, 0, 1, 0]);
  });

  it('skips rests without forgetting the bar', () => {
    expect(shownAccidentals([note(0, 21, C, 1), null, note(0, 21, C, 1)], 0)).toEqual([1, null, null]);
  });
});
