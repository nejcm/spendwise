import { toNumber } from '../number';

export function refinePositiveNumber(v: string | number | null | undefined): boolean {
  const n = toNumber(v);
  return n !== undefined && n !== null && n > 0;
}
