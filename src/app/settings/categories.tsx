import { Stack } from 'expo-router';
import * as React from 'react';

import { CategoryListScreen } from '@/features/settings/category-list-screen';
import { translate } from '@/lib/i18n';

export default function CategoriesRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('settings.categories') }} />
      <CategoryListScreen />
    </>
  );
}
