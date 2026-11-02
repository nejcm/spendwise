import type { RecurringTemplate } from '../constants';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, IconTile, Text } from '@/components/ui';
import { Plus } from '@/components/ui/icon';
import { useCategories } from '@/features/categories/api';
import { formatCurrency, todayISO } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { FREQUENCY_OPTIONS, RECURRING_TEMPLATES } from '../constants';
import { templateParams } from '../helpers';

export function RecurringEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="flex-1">
      <Text accessibilityRole="header" className="pt-6.5 text-[26px]/tight font-bold tracking-page-title">{translate('scheduled.empty.title')}</Text>
      <Text className="pt-2 text-row/snug text-muted-foreground">{translate('scheduled.empty.body')}</Text>
      <Text accessibilityRole="header" className="pt-5.5 pb-2.5 text-sm font-semibold">{translate('scheduled.empty.templates')}</Text>
      <View className="flex-row flex-wrap gap-2.5">
        {RECURRING_TEMPLATES.map((template) => <TemplateTile key={template.key} template={template} />)}
      </View>
      <View className="mt-auto pt-6">
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          style={getPressedStyle}
          className="h-14 flex-row items-center justify-center gap-2 rounded-full bg-card"
        >
          <Plus size={18} colorClassName="accent-foreground" />
          <Text className="text-base font-medium">{translate('scheduled.empty.scratch')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TemplateTile({ template }: { template: RecurringTemplate }) {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const { data: categories = [] } = useCategories();
  const name = translate(`scheduled.templates.${template.key}`);
  const meta = [
    FREQUENCY_OPTIONS.find((o) => o.value === template.frequency)?.label,
    template.startsOnFirst && translate('scheduled.empty.on_first'),
    template.type === 'income' && translate('scheduled.empty.income'),
    template.amount && formatCurrency(template.amount, currency, { numberFormat, currencyFormat }),
  ].filter(Boolean).join(' · ');
  const onPress = () => router.push({
    pathname: '/scheduled/new',
    params: templateParams(template, { name, categories, currency, today: todayISO() }),
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${meta}`}
      onPress={onPress}
      style={getPressedStyle}
      className="h-15 min-w-[45%] flex-1 basis-[45%] flex-row items-center gap-2.5 rounded-[18px] bg-card px-3"
    >
      <IconTile color={template.color} icon={template.icon} className="size-9 rounded-[11px]" />
      <View className="min-w-0 shrink">
        <Text className="text-row font-medium" numberOfLines={1}>{name}</Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>{meta}</Text>
      </View>
    </Pressable>
  );
}
