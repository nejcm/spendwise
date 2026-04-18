export function toNumber<TFallback extends number | undefined>(
  value: string | number | null | undefined,
  fallback?: TFallback,
): TFallback | number {
  if (value == null || value === '') return fallback as TFallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback as TFallback : num;
}

export function shortenNumber(val: number, above = 1_000_000, round = 1): [number, string] {
  if (Math.abs(val) < above) return [val, ''];
  const isNegative = val < 0;
  if (isNegative ? val > -1000 : val < 1000) return [Number(val.toFixed(round)), ''];
  if (isNegative ? val > -1000000 : val < 1000000) {
    return [Number((val / 1000).toFixed(round)), 'k'];
  }
  if (isNegative ? val > -1000000000 : val < 1000000000) {
    return [Number((val / 1000000).toFixed(round)), 'm'];
  }
  return [Number((val / 1000000000).toFixed(round)), 'b'];
};

export function shortenNumberString<T extends number | undefined>(
  val: T,
  above = 1_000_000,
  round = 1,
  format?: (val: number) => number | string,
): string | T {
  if (val === undefined) return val;
  const response = shortenNumber(val, above, round);
  return `${format ? format(response[0]) : response[0]}${response[1]}`;
};
