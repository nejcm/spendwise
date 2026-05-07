import { useRouter } from 'expo-router';
import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { CategoryFormModal } from '@/features/categories/category-form';
import { translate } from '@/lib/i18n';

export default function NewCategoryRoute() {
  const router = useRouter();
  const onBack = () => router.back();

  return (
    <>
      <ScreenHeader title={translate('categories.add')} />
      <CategoryFormModal initialValues={{ id: undefined }} onSuccess={onBack} onCancel={onBack} />
    </>
  );
}
