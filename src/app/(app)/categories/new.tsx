import { useRouter } from 'expo-router';
import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { CategoryForm } from '@/features/categories/category-form';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';

export default function NewCategoryRoute() {
  const router = useRouter();
  const onBack = () => goBackOrFallback(router);

  return (
    <>
      <ScreenHeader title={translate('categories.add')} />
      <CategoryForm initialValues={{ id: undefined }} onSuccess={onBack} onCancel={onBack} />
    </>
  );
}
