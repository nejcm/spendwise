import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { Text } from '@/components/ui';
import { X } from '@/components/ui/icon';
import { useCategories } from '@/features/categories/api';
import { CategoryForm } from '@/features/categories/category-form';
import { isUncategorised } from '@/features/categories/helpers';
import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';

export default function EditCategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();
  const category = React.useMemo(() => isUncategorised(id) ? undefined : categories.find((item) => item.id === id), [categories, id]);
  const onBack = () => goBackOrFallback(router);

  return (
    <>
      <View className="px-5 pt-2">
        <PageHeader
          title={translate('categories.edit')}
          left={<HeaderButton icon={X} label={translate('common.close')} onPress={onBack} />}
        />
      </View>
      {isLoading
        ? <Text className="mt-10 text-center text-muted-foreground">{translate('common.loading')}</Text>
        : !category
            ? <Text className="mt-10 px-5 text-center text-muted-foreground">{translate('categories.not_found')}</Text>
            : (
                <CategoryForm
                  initialValues={{
                    id: category.id,
                    name: category.name,
                    color: category.color,
                    kind: category.kind,
                    icon: category.icon || null,
                    budget: category.budget ? String(centsToAmount(category.budget)) : null,
                  }}
                  onSuccess={onBack}
                  onDeleted={() => router.dismissTo('/categories')}
                />
              )}
    </>
  );
}
