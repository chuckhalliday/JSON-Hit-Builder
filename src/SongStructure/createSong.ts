import { randomGroove, randomArrangement } from "./groove";
import generateSong from "./generateSong";
import { seedRng, rng, randomSeed } from "./rng";
import { SongStructure, SongParams } from "../types";

export interface GeneratedSong {
  songStructure: SongStructure;
  bpm: number;
  key: string;
  seed: number;
  params: SongParams;
}

// Builds a fresh random song that is fully reproducible from `seed`.
//
// This is the seeded entry point that replaces the old module-load generation
// in reducers.ts. Seeding happens up front, so the four bass grooves, the
// arrangement, and every downstream choice replay identically for a given seed.
// Omit `seed` to get a new random song (a fresh seed is chosen and returned).
export function createRandomSong(seed: number = randomSeed()): GeneratedSong {
  seedRng(seed);
  const bassGrooves: number[][] = [
    randomGroove(),
    randomGroove(),
    randomGroove(),
    randomGroove(),
  ];
  const { songStructure, bpm, key, params } = generateSong(bassGrooves, randomArrangement(), rng() / 4);
  return { songStructure, bpm, key, seed, params };
}
