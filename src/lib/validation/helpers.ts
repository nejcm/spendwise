import { toNumber } from '../number';

export function refinePositiveNumber(v: string | number | null | undefined): boolean {
  const n = toNumber(v);
  return n !== undefined && n !== null && n > 0;
}

export function refinePositiveNumberOrNull(v: string | number | null | undefined): boolean {
  if (v == null || v === undefined || v === '') return true;
  return refinePositiveNumber(v);
}
