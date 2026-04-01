import type { SheetConfig } from './sheet';
import { create } from 'zustand';
import { createSelectors } from './utils';

export type ScanTriggeredType = 'camera' | 'gallery' | 'select';

export type LocalStoreState = {
  sheet: SheetConfig | undefined;
  scanTriggered: undefined | ScanTriggeredType;
};

const defaultState: LocalStoreState = {
  sheet: undefined,
  scanTriggered: undefined,
};

const _useLocalStore = create<LocalStoreState>(() => (defaultState));

export const useLocalStore = createSelectors(_useLocalStore);

// ---------------------------------------------------------------------------
// Public helpers – call these from anywhere in the app
// ---------------------------------------------------------------------------
export function openSheet(config: SheetConfig): void {
  useLocalStore.setState({ sheet: config });
}
export function closeSheet(): void {
  useLocalStore.setState({ sheet: undefined });
}
export function triggerScan(type: ScanTriggeredType = 'select'): void {
  useLocalStore.setState({ scanTriggered: type });
}
export function triggerScanPicker(): void {
  useLocalStore.setState({ scanTriggered: 'select' });
}
export function closeScan(): void {
  useLocalStore.setState({ scanTriggered: undefined });
}
