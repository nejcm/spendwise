// The iOS share extension opens `<scheme>://dataUrl=<key>`; the payload is read by useShareIntent, not routed.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (!path.includes('dataUrl=')) return path;
  return initial ? '/' : null;
}
