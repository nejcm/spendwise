import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import ScreenHeader from '@/components/screen-header';
import { GhostButton, Text } from '@/components/ui';
import { useCategories } from '@/features/categories/api';
import { CategoryFormModal } from '@/features/categories/category-form';
import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';

export default function EditCategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();
  const category = React.useMemo(() => categories.find((item) => item.id === id), [categories, id]);
  const onBack = () => router.back();

  if (isLoading) {
    return (
      <>
        <ScreenHeader title={translate('categories.edit')} />
        <View className="flex-1 items-center justify-center bg-background">
          <Text>{translate('common.loading')}</Text>
        </View>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <ScreenHeader title={translate('categories.edit')} />
        <View className="flex-1 items-center justify-center gap-4 bg-background px-4">
          <Text className="text-center text-muted-foreground">{translate('categories.not_found')}</Text>
          <GhostButton color="secondary" label={translate('common.back')} onPress={() => router.back()} />
        </View>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title={translate('categories.edit')} />
      <CategoryFormModal
        initialValues={{
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon || null,
          budget: category.budget ? String(centsToAmount(category.budget)) : null,
        }}
        onSuccess={onBack}
        onCancel={onBack}
      />
    </>
  );
}
