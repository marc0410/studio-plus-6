import type { InkType } from '@/data/inkTokens';
import { inkTokens } from '@/data/inkTokens';

const cache = new Map<string, string[]>();

/** Deterministic, lightweight paths. The seed keeps each annotation stable between renders. */
export function handDrawnPaths(type: InkType, seed = 1): string[] {
  const key = `${type}:${seed}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const n = ((Math.abs(seed) * 9301 + 49297) % 233280) / 233280;
  const j = (n - .5) * inkTokens.jitter;
  const overshoot = inkTokens.overshoot * 100;
  const paths: Record<InkType, string[]> = {
    circle: [`M ${8+j} ${52+j} C ${9+j} ${20-j},${29+j} ${8+j},${55+j} ${9+j} C ${82-j} ${9+j},${96-j} ${26+j},${94-j} ${52+j} C ${93-j} ${78-j},${73+j} ${93-j},${48+j} ${92-j} C ${23+j} ${91-j},${7+j} ${76+j},${8+j} ${52+j} C ${8+j} ${47+j},${10+j} ${43+j},${8+overshoot+j} ${39+j}`],
    underline: [`M 2 ${62+j} C 25 ${59-j},49 ${66+j},71 ${61-j} S 96 ${59+j},99 ${62+j}`],
    wave: [`M 2 ${61+j} C 13 ${48+j},22 ${73-j},34 ${60+j} S 54 ${48+j},66 ${61-j} S 87 ${72-j},99 ${58+j}`],
    double: [`M 2 56 C 25 52,48 61,72 55 S 94 54,99 57`, `M 5 67 C 28 64,49 70,73 66 S 94 65,97 67`],
    heart: ['M 50 91 C 41 81,9 61,12 35 C 15 13,39 13,50 34 C 62 12,86 14,89 35 C 92 61,60 82,50 91 Z'],
    star: ['M 50 7 L 59 37 L 89 25 L 68 48 L 91 67 L 60 61 L 51 94 L 41 62 L 10 73 L 33 50 L 11 29 L 42 39 Z'],
    check: ['M 14 53 C 26 59,32 70,39 78 C 52 56,67 36,88 18'],
    arrow: ['M 7 75 C 25 26,64 15,91 48', 'M 91 48 L 72 44', 'M 91 48 L 81 66'],
    spark: ['M 50 7 C 53 34,64 45,92 50 C 65 54,54 66,50 93 C 46 66,35 55,8 50 C 36 45,47 34,50 7 Z'],
    loop: ['M 9 52 C 9 22,33 7,56 13 C 83 19,96 43,84 66 C 72 90,44 96,25 80 C 10 68,19 45,38 39 C 54 34,68 47,64 59 C 61 68,49 72,42 66'],
  };
  const result = paths[type];
  cache.set(key, result);
  return result;
}
