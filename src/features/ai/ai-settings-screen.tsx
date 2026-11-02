import type { AiProviderType } from './types';
import type { AiFeature } from '@/lib/store/store';
import * as React from 'react';
import { Linking } from 'react-native';
import { Alert, Card, GhostButton, Input, Pressable, SectionHeader, SegmentedControl, SolidButton, Text, View } from '@/components/ui';
import { Bot } from '@/components/ui/icon';
import { showSnackbar } from '@/components/ui/snackbar';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { ToggleRow } from '@/features/settings/components/toggle-row';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { setAiFeature, setAiProvider, setAnthropicApiKey, setOpenaiApiKey, useAppStore } from '@/lib/store/store';
import { maskApiKey } from './helpers';

const PROVIDERS: AiProviderType[] = ['openai', 'anthropic'];
const API_KEYS_URL: Record<AiProviderType, string> = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
};
const SET_KEY: Record<AiProviderType, (key: string | undefined) => void> = {
  openai: setOpenaiApiKey,
  anthropic: setAnthropicApiKey,
};
const FEATURES: AiFeature[] = ['chat', 'scan', 'insights'];

export function AiSettingsScreen() {
  const provider = useAppStore.use.aiProvider();
  const savedKey = useAppStore((s) => (provider === 'anthropic' ? s.anthropicApiKey : s.openaiApiKey))?.trim();
  const aiFeatures = useAppStore((s) => s.aiFeatures);
  const providerName = translate(`settings.provider_${provider}`);

  const removeKey = () => {
    Alert.alert(translate('settings.ai_remove_key_title', { provider: providerName }), translate('settings.ai_remove_key_message'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('settings.ai_remove_key'),
        style: 'destructive',
        onPress: () => {
          SET_KEY[provider](undefined);
          showSnackbar({ title: translate('settings.ai_key_removed') });
        },
      },
    ]);
  };

  return (
    <SettingsPage title={translate('settings.spendwise_ai')}>
      <KeyCard key={provider} provider={provider} providerName={providerName} savedKey={savedKey} />

      <SegmentedControl
        accessibilityLabel={translate('settings.ai_provider')}
        className="mt-4"
        options={PROVIDERS.map((value) => ({ value, label: translate(`settings.provider_${value}`) }))}
        value={provider}
        onChange={setAiProvider}
      />

      <SectionHeader title={translate('settings.ai_use_for')} />
      <Card className="px-4">
        {FEATURES.map((feature, index) => (
          <ToggleRow
            key={feature}
            className={cn(index > 0 && 'border-t border-border')}
            title={translate(`settings.ai_features.${feature}.title`)}
            description={translate(`settings.ai_features.${feature}.body`)}
            checked={aiFeatures?.[feature] !== false}
            onChange={(on) => setAiFeature(feature, on)}
          />
        ))}
      </Card>
      <Text className="px-1 pt-2.5 text-meta text-muted-foreground">{translate('settings.ai_requests_note', { provider: providerName })}</Text>

      {savedKey && (
        <GhostButton color="danger" className="mt-8 self-center" label={translate('settings.ai_remove_key')} onPress={removeKey} />
      )}
    </SettingsPage>
  );
}

function KeyCard({ provider, providerName, savedKey }: { provider: AiProviderType; providerName: string; savedKey: string | undefined }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const showForm = !savedKey || editing;

  const save = () => {
    SET_KEY[provider](draft.trim());
    setEditing(false);
    setDraft('');
    showSnackbar({ title: translate('settings.saved') });
  };

  return (
    <View className="mt-5 gap-3.5 rounded-card border border-accent-line bg-accent-soft p-4.5">
      <View className="flex-row items-center gap-3">
        <View className="size-11 items-center justify-center rounded-tile bg-primary">
          <Bot size={20} strokeWidth={2} colorClassName="accent-primary-foreground" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold">
            {translate(savedKey ? 'settings.ai_connected' : 'settings.ai_add_key', { provider: providerName })}
          </Text>
          {savedKey
            ? (
                <View className="flex-row items-center gap-1.5">
                  <View className="size-1.75 rounded-full bg-positive" />
                  <Text className="text-meta text-muted-foreground">{translate('settings.ai_key_on_phone')}</Text>
                </View>
              )
            : <Text className="text-meta text-muted-foreground">{translate('settings.ai_add_key_meta')}</Text>}
        </View>
      </View>

      {showForm
        ? (
            <>
              <Input
                accessibilityLabel={translate('settings.ai_api_key', { provider: providerName })}
                value={draft}
                onChangeText={setDraft}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder="sk-..."
                onSubmitEditing={draft.trim() ? save : undefined}
              />
              <View className="flex-row items-center justify-between gap-3">
                <Pressable accessibilityRole="link" hitSlop={8} onPress={() => Linking.openURL(API_KEYS_URL[provider])}>
                  <Text className="text-sm font-medium underline">{translate('settings.get_api_key')}</Text>
                </Pressable>
                <View className="flex-row gap-2">
                  {editing && <GhostButton size="sm" label={translate('common.cancel')} onPress={() => setEditing(false)} />}
                  <SolidButton size="sm" color="primary" label={translate('common.save')} disabled={!draft.trim()} onPress={save} />
                </View>
              </View>
            </>
          )
        : (
            <View className="h-12 flex-row items-center justify-between rounded-tile bg-card px-3.5">
              <Text className="tracking-widest" accessibilityLabel={translate('settings.ai_key_masked')}>{maskApiKey(savedKey)}</Text>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setEditing(true)}>
                <Text className="text-sm font-medium underline">{translate('settings.ai_replace_key')}</Text>
              </Pressable>
            </View>
          )}
    </View>
  );
}
