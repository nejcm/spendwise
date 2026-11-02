import type { Category } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { FocusAwareStatusBar, getPressedStyle, IconTile, SolidButton, Text, useModalSheet } from '@/components/ui';
import { GripVertical, Minus, Plus } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { categoryIcon, isUncategorised } from '../helpers';
import { useCategories, useFormatMoney, useUpdateCategoryOrder } from '../hooks';
import { DeleteCategorySheet } from './delete-category-sheet';

export function CategoriesEditList() {
  const router = useRouter();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const { data = [], isPending } = useCategories();
  const categories = React.useMemo(() => data.filter((c) => !isUncategorised(c.id)), [data]);
  const updateOrder = useUpdateCategoryOrder();
  const sheet = useModalSheet();
  const [deleting, setDeleting] = React.useState<Category | null>(null);

  const handleDragEnd = React.useCallback(({ data: sorted }: { data: Category[] }) => {
    updateOrder.mutate(sorted.map((c, index) => ({ id: c.id, sort_order: index })));
  }, [updateOrder]);

  const closeDelete = () => {
    sheet.close();
    setDeleting(null);
  };

  const confirmDelete = (category: Category) => {
    setDeleting(category);
    sheet.present();
  };

  return (
    <>
      <FocusAwareStatusBar />
      <Animated.ScrollView ref={scrollRef} className="flex-1" style={defaultStyles.transparentBg}>
        <View className="px-5 pt-2 pb-6">
          <View className="h-12 flex-row items-center gap-2">
            <Text accessibilityRole="header" className="min-w-0 flex-1 text-page-title font-bold tracking-page-title" numberOfLines={1}>
              {translate('categories.edit_title')}
            </Text>
            <SolidButton size="sm" color="primary" label={translate('common.done')} onPress={() => router.navigate('/categories')} />
          </View>
          <Text className="mt-1 mb-4 text-row text-muted-foreground">{translate('categories.edit_hint')}</Text>
          {isPending
            ? <SkeletonRows count={5} />
            : (
                <View className="overflow-hidden rounded-card bg-card">
                  <Sortable.Grid
                    data={categories}
                    columns={1}
                    hapticsEnabled
                    scrollableRef={scrollRef}
                    dimensionsAnimationType="none"
                    itemEntering={null}
                    itemExiting={null}
                    itemsLayoutTransitionMode="reorder"
                    customHandle
                    keyExtractor={(c) => c.id}
                    onDragEnd={handleDragEnd}
                    renderItem={({ item }) => (
                      <EditRow
                        category={item}
                        onPress={() => router.push({ pathname: '/categories/[id]/edit', params: { id: item.id } })}
                        onDelete={() => confirmDelete(item)}
                      />
                    )}
                  />
                </View>
              )}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/categories/new')}
            style={getPressedStyle}
            className="mt-3 h-12.5 flex-row items-center justify-center gap-2 rounded-full border-[1.5px] border-dashed border-track"
          >
            <Plus size={18} colorClassName="accent-muted-foreground" />
            <Text className="text-sm font-medium text-muted-foreground">{translate('categories.new')}</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>
      <DeleteCategorySheet ref={sheet.ref} category={deleting} onClose={closeDelete} />
    </>
  );
}

function EditRow({ category, onPress, onDelete }: { category: Category; onPress: () => void; onDelete: () => void }) {
  const format = useFormatMoney();
  const meta = category.kind === 'income'
    ? translate('categories.kind_income')
    : category.budget
      ? translate('categories.budget_per_month', { amount: format(category.budget) })
      : translate('categories.no_budget');

  return (
    <View className="h-14.5 flex-row items-center gap-3 bg-card px-3">
      <Sortable.Handle>
        <View accessibilityLabel={translate('categories.drag_handle')} className="h-full justify-center px-1">
          <GripVertical size={18} colorClassName="accent-muted-foreground" />
        </View>
      </Sortable.Handle>
      <Pressable accessibilityRole="button" onPress={onPress} style={getPressedStyle} className="min-w-0 flex-1 flex-row items-center gap-3">
        <IconTile size="sm" className="size-9 rounded-[11px]" color={category.color} icon={categoryIcon(category.id, category.icon, category.name)} />
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-medium" numberOfLines={1}>{category.name}</Text>
          <Text className="text-meta text-muted-foreground" numberOfLines={1}>{meta}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('categories.delete.title', { name: category.name })}
        onPress={onDelete}
        hitSlop={8}
        className="size-7 items-center justify-center rounded-full bg-negative/15"
      >
        <Minus size={16} strokeWidth={2.5} colorClassName="accent-negative" />
      </Pressable>
    </View>
  );
}
