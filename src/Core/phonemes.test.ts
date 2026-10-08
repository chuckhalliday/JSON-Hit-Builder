import { sungSyllables } from './phonemes';
import { lineSyllables } from './lyrics';

const read = (line: string) => sungSyllables(lineSyllables(line)).map(s => [...s.onset, s.vowel, ...s.coda].join(' '));

describe('sungSyllables', () => {
  it('reads words by spelling: vowel teams, silent e, r-colored vowels, consonant pairs', () => {
    const cases: Record<string, string> = {
      light: 'L AY T', rain: 'R EY N', sweet: 'S W IY T', moon: 'M UW N', book: 'B UH K', boat: 'B OW T',
      time: 'T AY M', cute: 'K UW T', hope: 'HH OW P', bird: 'B ER D', start: 'S T AA R T', think: 'TH IH NG K',
      yes: 'Y EH S', low: 'L OW', brown: 'B R AW N', judge: 'JH AH JH', change: 'CH EY N JH', chance: 'CH AE N S',
      dreams: 'D R IY M Z', gym: 'JH IH M', sky: 'S K AY', quick: 'K W IH K', black: 'B L AE K',
    };
    for (const [word, phones] of Object.entries(cases)) expect([word, read(word).join(' | ')]).toEqual([word, phones]);
  });

  it('knows the common lyric words spelling misleads on, read whole across syllables', () => {
    expect(read('love')).toEqual(['L AH V']);
    expect(read('the one')).toEqual(['DH AH', 'W AH N']);
    expect(read('to-night')).toEqual(['T AH', 'N AY T']);
    expect(read("don't")).toEqual(['D OW N T']);
    expect(read('heart')).toEqual(['HH AA R T']);
  });

  it('sings one vowel per syllable, with -le and mid-word consonants in place', () => {
    expect(read('little')).toEqual(['L IH', 'T AH L']);
    expect(read('standing')).toEqual(['S T AE N', 'D IH NG']);
    expect(read('summer')).toEqual(['S AH M', 'M ER']);
    expect(read('dar-kness')).toEqual(['D AA R', 'K N EH S']);
    expect(read('every-thing')).toEqual(['EH V R', 'TH IH NG']);
  });
});
