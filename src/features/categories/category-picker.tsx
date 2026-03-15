import type { Category } from './types';
import * as React from 'react';
import ContentLoader, { Rect } from 'react-content-loader/native';

import { Select } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useCategories } from '../transactions/api';

export type CategoryPickerProps = {
  selectedId: string | null;
  onSelect: (category: Category) => void;
  label?: string;
  error?: string;
};

export function CategoryPicker({ selectedId, onSelect, label, error }: CategoryPickerProps) {
  const { data: categories = [], isLoading } = useCategories();

  const options = React.useMemo(() => categories.map((c) => ({
    label: c.icon ? `${c.icon} ${c.name}` : c.name,
    value: c.id,
  })), [categories]);

  const handleSelect = React.useCallback(
    (value: string | number) => {
      const category = categories.find((c) => c.id === value);
      if (category) onSelect(category);
    },
    [categories, onSelect],
  );

  if (isLoading) {
    return (
      <ContentLoader
        viewBox="0 0 400 44"
        width={400}
        height={44}
        style={{ width: '100%' }}
      >
        <Rect x="0" y="0" rx="8" ry="8" width="400" height="44" />
      </ContentLoader>
    );
  }
  return (
    <Select
      label={label}
      value={selectedId ?? undefined}
      options={options}
      onSelect={handleSelect}
      placeholder={translate('categories.select_category')}
      error={error}
      title={translate('categories.select_category')}
      stackBehavior="push"
    />
  );
}
