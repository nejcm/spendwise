import type { Category } from '../types';
import type { ModalSheetRef } from '@/components/ui';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, GhostButton, IconTile, ModalSheet, SolidButton, Text } from '@/components/ui';
import { SkeletonRows } from '@/components/ui/skeleton';
import { DEFAULT_CATEGORY_ID } from '@/config';
import { useCategorySpendByRange } from '@/features/insights/api';
import { cn } from '@/lib/cn';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { CategoryPicker } from '../category-picker';
import { categoryIcon, categoryName, isUncategorised, monthBarsRange, rankMoveTargets, translateCount } from '../helpers';
import { useCategories, useCategoryUsage, useDeleteCategory, useFormatMoney } from '../hooks';

type DeleteCategorySheetProps = {
  ref: ModalSheetRef<unknown>;
  category: Category | null;
  onDeleted?: () => void;
  onClose: () => void;
};

export function DeleteCategorySheet({ ref, category, onDeleted, onClose }: DeleteCategorySheetProps) {
  const { data: usage } = useCategoryUsage(category?.id);
  const used = !!usage && usage.transactions + usage.rules > 0;

  return (
    <ModalSheet
      ref={ref}
      snapPoints={[used ? '85%' : '45%']}
      onDismiss={onClose}
      title={category && (
        <View className="flex-row items-center gap-3">
          <IconTile size="lg" color={category.color} icon={categoryIcon(category.id, category.icon, category.name)} />
          <Text accessibilityRole="header" className="min-w-0 flex-1 text-xl font-bold" numberOfLines={2}>
            {translate('categories.delete.title', { name: category.name })}
          </Text>
        </View>
      )}
    >
      <BottomSheetScrollView style={defaultStyles.transparentBg} contentContainerClassName="px-5 pt-2 pb-6">
        {category && usage
          ? <DeleteCategoryBody key={category.id} category={category} usage={usage} onDeleted={onDeleted} onClose={onClose} />
          : <SkeletonRows count={3} />}
      </BottomSheetScrollView>
    </ModalSheet>
  );
}

type DeleteCategoryBodyProps = {
  category: Category;
  usage: { transactions: number; rules: number };
  onDeleted?: () => void;
  onClose: () => void;
};

function DeleteCategoryBody({ category, usage, onDeleted, onClose }: DeleteCategoryBodyProps) {
  const format = useFormatMoney();
  const yearMonth = useCurrentYearMonth();
  const [spendStart, spendEnd] = monthBarsRange(yearMonth, 3);
  const { data: categories = [] } = useCategories();
  const { data: spend = [] } = useCategorySpendByRange(spendStart, spendEnd);
  const deleteCategory = useDeleteCategory(onDeleted);
  const used = usage.transactions + usage.rules > 0;

  const ranked = React.useMemo(() => {
    const spendById = Object.fromEntries(spend.map((row) => [
      row.category_id,
      category.kind === 'income' ? row.income_total : row.expense_total,
    ]));
    return rankMoveTargets(category, categories, spendById);
  }, [category, categories, spend]);
  const [picked, setPicked] = React.useState<string | null>(null);
  const targetId = picked ?? ranked[0]?.id ?? DEFAULT_CATEGORY_ID;
  const shown = ranked.slice(0, 3);
  const other = categories.find((c) => c.id === picked);
  if (other && !isUncategorised(other.id) && !shown.includes(other)) shown.push(other);

  const parts = [
    usage.transactions > 0 && translateCount('categories.delete.transactions', usage.transactions),
    usage.rules > 0 && translateCount('categories.delete.rules', usage.rules),
  ].filter(Boolean).join(translate('categories.delete.and'));
  const budget = category.kind === 'expense' && category.budget
    ? ` ${translate('categories.delete.budget_goes', { amount: format(category.budget) })}`
    : '';

  const remove = () => deleteCategory.mutate(
    { id: category.id, targetId: used ? targetId : undefined },
    { onSuccess: onClose },
  );

  if (!used) {
    return (
      <>
        <Text className="text-row text-muted-foreground">{translate('categories.delete.unused') + budget}</Text>
        <SolidButton className="mt-6" color="danger" size="lg" fullWidth label={translate('categories.delete_category')} loading={deleteCategory.isPending} onPress={remove} />
        <GhostButton className="mt-2" fullWidth label={translate('categories.delete.keep')} onPress={onClose} />
      </>
    );
  }

  return (
    <>
      <Text className="text-row text-muted-foreground">
        {`${translateCount('categories.delete.use_it', usage.transactions + usage.rules, { what: parts })}${budget} ${translate('categories.delete.history_kept')}`}
      </Text>
      <Text className="mt-5 mb-2 px-1 text-meta font-medium text-muted-foreground">{translate('categories.delete.move_to')}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={translate('categories.delete.move_to')} className="rounded-card bg-card-2 px-1">
        {shown.map((c, index) => (
          <TargetRow
            key={c.id}
            selected={targetId === c.id}
            onPress={() => setPicked(c.id)}
            icon={categoryIcon(c.id, c.icon, c.name)}
            color={c.color}
            name={c.name}
            hint={index === 0 && c === ranked[0] ? translate('categories.delete.closest') : undefined}
          />
        ))}
        <TargetRow
          selected={targetId === DEFAULT_CATEGORY_ID}
          onPress={() => setPicked(DEFAULT_CATEGORY_ID)}
          icon={categoryIcon(DEFAULT_CATEGORY_ID, null, '')}
          name={categoryName(DEFAULT_CATEGORY_ID, '')}
          hint={translate('categories.delete.later')}
        />
      </View>
      <CategoryPicker
        type={category.kind}
        selectedId={targetId}
        onSelect={(c) => c.id !== category.id && setPicked(c.id)}
        showChevron={false}
        inputClassName="h-auto self-center border-0 bg-transparent px-0"
        containerClassName="mt-3"
        renderSelectedItem={() => (
          <Text className="py-1 text-sm font-medium text-muted-foreground underline">{translate('categories.delete.choose_other')}</Text>
        )}
      />
      <SolidButton
        className="mt-5"
        color="danger"
        size="lg"
        fullWidth
        label={translateCount('categories.delete.move_and_delete', usage.transactions || usage.rules)}
        loading={deleteCategory.isPending}
        onPress={remove}
      />
      <GhostButton className="mt-2" fullWidth label={translate('categories.delete.keep')} onPress={onClose} />
    </>
  );
}

type TargetRowProps = { selected: boolean; onPress: () => void; icon: string; color?: string; name: string; hint?: string };

function TargetRow({ selected, onPress, icon, color, name, hint }: TargetRowProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={getPressedStyle}
      className="min-h-[58px] flex-row items-center gap-3 px-3 py-2"
    >
      <IconTile size="sm" color={color} icon={icon} />
      <View className="min-w-0 flex-1">
        <Text className="text-row font-medium" numberOfLines={1}>{name}</Text>
        {hint && <Text className="text-meta text-muted-foreground">{hint}</Text>}
      </View>
      <View className={cn('size-[22px] items-center justify-center rounded-full border-2', selected ? 'border-primary' : 'border-track')}>
        {selected && <View className="size-3 rounded-full bg-primary" />}
      </View>
    </Pressable>
  );
}
