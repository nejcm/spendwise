import type { CnOptions, TVConfig } from 'tailwind-variants';
import { cnMerge, createTV } from 'tailwind-variants';

// Custom @theme tokens from global.css; unregistered names are merged as colours.
export const twMergeConfig = {
  extend: {
    theme: {
      text: ['hero', 'page-title', 'header-title', 'row', 'meta'],
      radius: ['hero', 'card', 'tile', 'sheet'],
      tracking: ['hero', 'page-title'],
    },
  },
} satisfies TVConfig['twMergeConfig'];

const config: TVConfig = { twMergeConfig };

export const tv = createTV(config);

export function cn<T extends CnOptions>(...classes: T) {
  return cnMerge(...classes)(config);
}
