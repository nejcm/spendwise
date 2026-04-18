import type { SheetConfig } from '../sheet';
import { create } from 'zustand';
import { createSelectors } from '../utils';

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

export function updateLocalState(state: Partial<LocalStoreState> | ((prev: LocalStoreState) => Partial<LocalStoreState>)): void {
  useLocalStore.setState((prev) => ({ ...prev, ...(typeof state === 'function' ? state(prev) : state) }));
}
export function openSheet(config: SheetConfig): void {
  updateLocalState({ sheet: config });
}
export function closeSheet(): void {
  updateLocalState({ sheet: undefined });
}
export function setSheetProps(props: SheetConfig['props']): void {
  updateLocalState((prev) => ({ sheet: { ...prev.sheet, props } as SheetConfig }));
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
