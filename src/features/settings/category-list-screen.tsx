import type { CategoryAddModalRef } from '@/components/category-add-modal';
import * as React from 'react';

import { AlertRN, View } from 'react-native';
import { CategoryAddModal } from '@/components/category-add-modal';
import { CategoryGrid, FocusAwareStatusBar } from '@/components/ui';
import {
  useCategories,
  useDeleteCategory,
  useUpdateCategoryOrder,
} from '@/features/transactions/api';
import { translate } from '@/lib/i18n';

export function CategoryListScreen() {
  const { data: categories = [] } = useCategories();
  const deleteCategory = useDeleteCategory();
  const updateOrder = useUpdateCategoryOrder();
  const modalRef = React.useRef<CategoryAddModalRef>(null);

  const gridCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    sort_order: c.sort_order,
    type: c.type,
  }));

  const handleDelete = (id: string, catName: string) => {
    AlertRN.alert(translate('common.delete'), `Delete "${catName}"?`, [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.delete'),
        style: 'destructive',
        onPress: () => deleteCategory.mutate(id),
      },
    ]);
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <CategoryGrid
        categories={gridCategories}
        onReorder={(items) => updateOrder.mutate(items)}
        onAddPress={(type) => modalRef.current?.present(type)}
        onDeletePress={handleDelete}
      />
      <CategoryAddModal ref={modalRef} />
    </View>
  );
}
