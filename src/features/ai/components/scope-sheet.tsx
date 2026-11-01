import type { AiScope } from '../types';
import type { ModalSheetRef } from '@/components/ui';
import type { Account } from '@/features/accounts/types';
import type { PeriodSelection } from '@/lib/store/store';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View } from 'react-native';
import { Chip, ModalSheet, SolidButton, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { toggleScopeAccount } from '../helpers';
import { setAiScope } from '../store';

const FOCUS_PERIODS: { period: PeriodSelection; label: string }[] = [
  { period: { mode: 'today' }, label: translate('common.today') },
  { period: { mode: 'this-week' }, label: translate('common.this-week') },
  { period: { mode: 'this-month' }, label: translate('common.this-month') },
  { period: { mode: 'this-year' }, label: translate('common.this-year') },
  { period: { mode: 'all' }, label: translate('common.all-time') },
];

type ScopeSheetProps = {
  ref: ModalSheetRef<unknown>;
  scope: AiScope;
  accounts: readonly Account[];
  onClose: () => void;
};

export function ScopeSheet({ ref, scope, accounts, onClose }: ScopeSheetProps) {
  const [draft, setDraft] = React.useState(scope);
  const allPicked = draft.accountIds === 'all';

  return (
    <ModalSheet ref={ref} title={translate('ai.scope_title')} snapPoints={['70%']} onDismiss={() => setDraft(scope)}>
      <BottomSheetScrollView style={defaultStyles.transparentBg} contentContainerClassName="px-5 pt-2 pb-6">
        <Text className="text-row font-semibold">{translate('ai.scope_focus')}</Text>
        <Text className="mt-1 text-meta text-muted-foreground">{translate('ai.scope_focus_hint')}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {FOCUS_PERIODS.map(({ period, label }) => (
            <Chip key={period.mode} label={label} tone="solid" selected={draft.period.mode === period.mode} onPress={() => setDraft({ ...draft, period })} />
          ))}
        </View>
        <Text className="mt-6 text-row font-semibold">{translate('ai.scope_accounts')}</Text>
        <Text className="mt-1 text-meta text-muted-foreground">{translate('ai.scope_accounts_hint')}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Chip label={translate('ai.scope_all_accounts')} tone="solid" selected={allPicked} onPress={() => setDraft({ ...draft, accountIds: 'all' })} />
          {accounts.map((account) => (
            <Chip
              key={account.id}
              label={account.name}
              icon={account.icon ?? undefined}
              tone="solid"
              selected={!allPicked && draft.accountIds.includes(account.id)}
              onPress={() => setDraft({ ...draft, accountIds: toggleScopeAccount(draft.accountIds, account.id) })}
            />
          ))}
        </View>
        <SolidButton
          className="mt-6"
          color="primary"
          size="lg"
          fullWidth
          label={translate('common.apply')}
          onPress={() => {
            setAiScope(draft);
            onClose();
          }}
        />
      </BottomSheetScrollView>
    </ModalSheet>
  );
}
