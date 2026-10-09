import { barCopyEdits, stepBarsOf } from './drumBars';
import { DrumHit } from '../types';

const row = (pattern: string): DrumHit[] => [...pattern].map((c, index) => ({ index, checked: c === 'x' }));
const after = (drums: DrumHit[][], edits: ReturnType<typeof barCopyEdits>) => {
  const out = drums.map(r => r.map(c => ({ ...c })));
  edits.forEach(e => { out[e.voice][e.step].checked = e.checked; });
  return out.map(r => r.map(c => (c.checked ? 'x' : '.')).join(''));
};

describe('drum bars', () => {
  const eighths = Array(8).fill(0.5);
  const sixteenths = Array(16).fill(0.25);
  // An eighth-note triplet on beat 2, as the realized grid rounds it.
  const triplets = [0.5, 0.5, 0.16, 0.17, 0.17, 0.5, 0.5, 0.5, 0.5, 0.5];

  it('places each step in its bar', () => {
    expect(stepBarsOf([...eighths, ...sixteenths, ...triplets])).toEqual([
      ...Array(8).fill(0), ...Array(16).fill(1), ...Array(10).fill(2),
    ]);
  });

  it('copies a bar onto every later bar of the same grid', () => {
    const groove = [...eighths, ...eighths, ...eighths];
    const drums = [row('x...x.x.' + '.x.x....' + 'xxxxxxxx'), row('..x...x.' + '..x...x.' + '........')];
    expect(after(drums, barCopyEdits(drums, groove, [0, 1], 0, [1, 2]))).toEqual([
      'x...x.x.x...x.x.x...x.x.',
      '..x...x...x...x...x...x.',
    ]);
    // Only the asked-for voices, and only cells that change.
    const kickOnly = barCopyEdits(drums, groove, [0], 0, [1]);
    expect(kickOnly.every(e => e.voice === 0 && e.step >= 8 && e.step < 16)).toBe(true);
    expect(kickOnly).toHaveLength(5);
  });

  it('copies from the bar before, matching steps by their place in the bar', () => {
    // Bar 1 is eighths, bar 2 sixteenths: the in-between sixteenths clear.
    const groove = [...eighths, ...sixteenths];
    const drums = [row('x.xx...x' + 'xxxxxxxxxxxxxxxx')];
    expect(after(drums, barCopyEdits(drums, groove, [0], 0, [1]))).toEqual(['x.xx...x' + 'x...x.x.......x.']);
    // The other way, the sixteenths between the eighths are left behind.
    const back = [row('x.xx...x' + 'xxxxxxxxxxxxxxxx')];
    expect(after(back, barCopyEdits(back, [...eighths, ...sixteenths], [0], 1, [0]))).toEqual(['xxxxxxxx' + 'xxxxxxxxxxxxxxxx']);
  });

  it('lines rounded triplets up across bars', () => {
    const groove = [...triplets, ...triplets];
    const drums = [row('..x.x.....' + '..........')];
    expect(after(drums, barCopyEdits(drums, groove, [0], 0, [1]))).toEqual(['..x.x.......x.x.....']);
  });
});
