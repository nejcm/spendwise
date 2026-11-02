import type { Href } from 'expo-router';
import type { SetupStepKey } from '../helpers';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, OutlineButton, Text, useModalSheet } from '@/components/ui';
import { Check, ChevronRight, Upload } from '@/components/ui/icon';
import { useCategories } from '@/features/categories/api';
import { BudgetSheet } from '@/features/stats/components/budget-sheet';
import { useGlobalBudget } from '@/features/stats/hooks';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { getSetupSteps } from '../helpers';

const STEP_HREFS: Record<Exclude<SetupStepKey, 'budget'>, Href> = {
  profile: '/settings/profile',
  transaction: '/transactions/new',
  accounts: '/accounts/new',
};

export function SetupChecklist({ accountCount }: { accountCount: number }) {
  const router = useRouter();
  const profileName = useAppStore.use.profile().name;
  const { data: globalBudget } = useGlobalBudget();
  const { data: categories = [] } = useCategories();
  const budgetSheet = useModalSheet();
  const hasBudget = !!globalBudget?.amountCents || categories.some((category) => (category.budget ?? 0) > 0);
  const steps = getSetupSteps({ profileName, hasTransactions: false, hasBudget, accountCount });
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <View>
      <View className="flex-row items-baseline justify-between pt-[26px] pb-3">
        <Text accessibilityRole="header" className="text-header-title font-semibold">{translate('home.setup.title')}</Text>
        <Text className="text-sm text-muted-foreground">{translate('home.setup.progress', { done: doneCount, total: steps.length })}</Text>
      </View>
      <View className="flex-row gap-1.5 pb-3.5">
        {steps.map((step, index) => <View key={step.key} className={cn('h-1 flex-1 rounded-full', index < doneCount ? 'bg-accent' : 'bg-track')} />)}
      </View>
      <View className="rounded-card bg-card px-[18px] py-1">
        {steps.map(({ key, done }, index) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ checked: done }}
            onPress={() => (key === 'budget' ? budgetSheet.present() : router.push(STEP_HREFS[key]))}
            style={getPressedStyle}
            className={cn('h-[72px] flex-row items-center gap-3.5', index > 0 && 'border-t border-border')}
          >
            <View className={cn('size-7 items-center justify-center rounded-full border-[1.5px]', done ? 'border-accent bg-accent' : 'border-muted-foreground')}>
              {done && <Check size={14} strokeWidth={3} colorClassName="accent-accent-foreground" />}
            </View>
            <View className="min-w-0 flex-1">
              <Text className={cn('text-row font-medium', done && 'text-muted-foreground line-through')} numberOfLines={1}>{translate(`home.setup.${key}_title`)}</Text>
              <Text className="text-meta text-muted-foreground" numberOfLines={1}>{translate(`home.setup.${key}_body`)}</Text>
            </View>
            <ChevronRight size={18} colorClassName="accent-muted-foreground" />
          </Pressable>
        ))}
      </View>
      <OutlineButton
        size="md"
        color="default"
        fullWidth
        className="mt-3.5 border-accent-line"
        label={translate('home.setup.import_csv')}
        iconLeft={<Upload size={18} strokeWidth={1.8} colorClassName="accent-foreground" className="mr-2" />}
        onPress={() => router.push('/settings/import-export')}
      />
      <BudgetSheet ref={budgetSheet.ref} />
    </View>
  );
}
