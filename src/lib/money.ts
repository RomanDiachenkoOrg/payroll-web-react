/** Rounds half-up to cents (the epsilon guards against 1.005 being stored as 1.00499...). */
export function round2(value: number): number {
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * 100 + 1e-7)) / 100;
}

export function sum(values: number[]): number {
  return round2(values.reduce((a, b) => a + b, 0));
}
