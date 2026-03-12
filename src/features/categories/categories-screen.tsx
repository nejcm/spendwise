import type { CategoryManageModalProps } from '@/components/category-manage-modal';
import { format } from 'date-fns';
import * as React from 'react';

import { View } from 'react-native';
import { CategoryManageModal } from '@/components/category-manage-modal';
import { CategoryGrid, FocusAwareStatusBar } from '@/components/ui';
import { useCategorySpend } from '@/features/insights/api';
import { useUpdateCategoryOrder } from '@/features/transactions/api';

export function CategoriesScreen() {
  const [modelProps, setModelProps] = React.useState<CategoryManageModalProps['initialValues'] | undefined>();
  const currentMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const { data } = useCategorySpend(currentMonth);
  const updateOrder = useUpdateCategoryOrder();

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <CategoryGrid
        categories={data || []}
        onReorder={(items) => updateOrder.mutate(items)}
        onAddPress={() => setModelProps({ id: undefined })}
        onPress={(category) => setModelProps(category
          ? {
              id: category.category_id,
              name: category.category_name,
              type: category.category_type,
              color: category.category_color,
              sort_order: category.sort_order,
            }
          : undefined)}
      />
      <CategoryManageModal isOpen={!!modelProps} onClose={() => setModelProps(undefined)} initialValues={modelProps} />
    </View>
  );
}
