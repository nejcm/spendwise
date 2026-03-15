export function toNumber<TFallback extends number | undefined>(value: string | number | null | undefined, fallback?: TFallback): TFallback | number {
  if (value == null || value === '') return fallback as TFallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback as TFallback : num;
}
