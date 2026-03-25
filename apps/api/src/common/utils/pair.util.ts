/** Canonical ordering for unique user pairs (matches, conversations). */
export function orderedUserPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
