import type { SheetConfig } from './sheet';
import { create } from 'zustand';
import { createSelectors } from './utils';

export type LocalStoreState = {
  sheet: SheetConfig | undefined;
};

const defaultState: LocalStoreState = {
  sheet: undefined,
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
