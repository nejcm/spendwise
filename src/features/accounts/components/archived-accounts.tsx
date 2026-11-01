import type { Account } from '../types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, IconTile, ListRow, ModalSheet, SolidButton, Text, useModalSheet } from '@/components/ui';
import { Archive, ChevronRight } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { useUnarchiveAccount } from '../api';
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS } from '../types';

export function ArchivedAccounts({ accounts }: { accounts: Account[] }) {
  const sheet = useModalSheet();
  const unarchive = useUnarchiveAccount();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={sheet.present}
        style={getPressedStyle}
        className="mt-2.5 flex-row items-center gap-3.5 rounded-card border-[1.5px] border-dashed border-track px-[18px] py-3"
      >
        <View className="size-10 items-center justify-center rounded-xl bg-card-2">
          <Archive size={18} strokeWidth={1.8} colorClassName="accent-muted-foreground" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-row font-medium">{translate('accounts.archived_count', { count: accounts.length })}</Text>
          <Text className="text-meta text-muted-foreground" numberOfLines={1}>
            {accounts.map((account) => account.name).join(', ')}
          </Text>
        </View>
        <ChevronRight size={16} colorClassName="accent-muted-foreground" />
      </Pressable>

      <ModalSheet ref={sheet.ref} title={translate('accounts.archived')} snapPoints={['50%']}>
        <BottomSheetScrollView style={defaultStyles.transparentBg} contentContainerClassName="px-5 pb-6">
          {accounts.map((account) => (
            <ListRow
              key={account.id}
              icon={<IconTile icon={account.icon || '💵'} color={account.color ?? ACCOUNT_TYPE_COLORS[account.type]} />}
              title={account.name}
              meta={`${ACCOUNT_TYPE_LABELS[account.type]} · ${account.currency}`}
              trailing={(
                <SolidButton
                  size="sm"
                  color="tonal"
                  label={translate('accounts.unarchive')}
                  disabled={unarchive.isPending}
                  onPress={() => unarchive.mutate(account.id)}
                />
              )}
            />
          ))}
        </BottomSheetScrollView>
      </ModalSheet>
    </>
  );
}
