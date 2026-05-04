// Deterministic seeded RNG so demo data is stable across runs and SSR/client.
// Uses Mulberry32 — small, fast, decent distribution for non-cryptographic use.

export function seedFromString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngForKey(...parts: (string | number)[]): () => number {
  return mulberry32(seedFromString(parts.join("|")));
}

// Box-Muller transform → normal distribution with given mean and stddev.
export function normal(rng: () => number, mean: number, stddev: number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stddev * z;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function intRound(n: number): number {
  return Math.max(0, Math.round(n));
}
