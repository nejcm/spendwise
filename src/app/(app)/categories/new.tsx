import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { X } from '@/components/ui/icon';
import { CategoryForm } from '@/features/categories/category-form';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';

export default function NewCategoryRoute() {
  const router = useRouter();
  const onBack = () => goBackOrFallback(router);

  return (
    <>
      <View className="px-5 pt-2">
        <PageHeader
          title={translate('categories.add')}
          left={<HeaderButton icon={X} label={translate('common.close')} onPress={onBack} />}
        />
      </View>
      <CategoryForm initialValues={{ id: undefined }} onSuccess={onBack} />
    </>
  );
}
