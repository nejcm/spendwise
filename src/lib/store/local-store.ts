import { create } from 'zustand';
import { createSelectors } from '../utils';

export type ScanTriggeredType = 'camera' | 'gallery' | 'select';

export type LocalStoreState = {
  scanTriggered: undefined | ScanTriggeredType;
};

const defaultState: LocalStoreState = {
  scanTriggered: undefined,
};

const _useLocalStore = create<LocalStoreState>(() => (defaultState));

export const useLocalStore = createSelectors(_useLocalStore);

export function updateLocalState(state: Partial<LocalStoreState> | ((prev: LocalStoreState) => Partial<LocalStoreState>)): void {
  useLocalStore.setState((prev) => ({ ...prev, ...(typeof state === 'function' ? state(prev) : state) }));
}
export function triggerScan(type: ScanTriggeredType = 'select'): void {
  updateLocalState({ scanTriggered: type });
}
export function triggerScanPicker(): void {
  updateLocalState({ scanTriggered: 'select' });
}
export function closeScan(): void {
  updateLocalState({ scanTriggered: undefined });
}
