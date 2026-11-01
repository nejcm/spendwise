import { useRouter } from 'expo-router';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { FocusAwareStatusBar, ScrollView, View } from '@/components/ui';
import { ChevronLeft } from '@/components/ui/icon';
import { NAV_BAR_HEIGHT } from '@/components/ui/nav-tab-bar';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { defaultStyles } from '@/lib/theme/styles';

/** Settings sub-screen chrome: wash, back + centred title, padded scroll body. */
export function SettingsPage({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" style={defaultStyles.transparentBg} contentContainerStyle={{ paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 16 }}>
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-wash to-background" />
        <View className="px-5 pt-2">
          <PageHeader
            title={title}
            left={<HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router, '/settings')} />}
          />
          {children}
        </View>
      </ScrollView>
    </>
  );
}
