import type { AiProviderType } from './types';
import type { AppState } from '@/lib/store';
import * as React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { FocusAwareStatusBar, Input, ScrollView, Select, SolidButton, Text } from '@/components/ui';
import { setAiProvider, setAnthropicApiKey, setOpenaiApiKey, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { translate } from '../../lib/i18n';

const OPENAI_API_KEYS_URL = 'https://platform.openai.com/api-keys';
const ANTHROPIC_API_KEYS_URL = 'https://console.anthropic.com/settings/keys';

type AiProviderId = AppState['aiProvider'];

const providerOptions = [
  { label: translate('settings.provider_openai'), value: 'openai' as AiProviderType },
  { label: translate('settings.provider_anthropic'), value: 'anthropic' as AiProviderType },
];

export function AiSettingsScreen() {
  const aiProvider = useAppStore.use.aiProvider();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();
  const [dirty, setDirty] = React.useState(false);

  const openaiInputRef = React.useRef<string | undefined>(openaiApiKey);
  const anthropicInputRef = React.useRef<string | undefined>(anthropicApiKey);

  const onSave = React.useCallback(() => {
    setOpenaiApiKey(openaiInputRef.current);
    setAnthropicApiKey(anthropicInputRef.current);
    setDirty(false);
    showMessage({
      message: translate('settings.saved'),
      type: 'success',
      duration: 2500,
      icon: 'success',
    });
  }, []);

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        <Text className="mb-1 text-lg font-medium">{translate('settings.ai_provider')}</Text>
        <Text className="mb-6 text-sm text-muted-foreground">
          {translate('settings.ai_provider_desc')}
        </Text>

        <View className="mb-6">
          <Select<AiProviderId>
            options={providerOptions}
            value={aiProvider}
            onSelect={setAiProvider}
            testID="ai-provider-select"
          />
        </View>

        <View
          className="mb-6 rounded-xl bg-card p-4"
          style={aiProvider === 'openai' ? undefined : { display: 'none' }}
        >
          <Input
            label={translate('settings.openai_api_key')}
            defaultValue={openaiApiKey ?? ''}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="sk-..."
            className="text-lg"
            onChangeText={(text) => {
              openaiInputRef.current = text;
              setDirty(true);
            }}
          />
          <Text className="mt-3 text-xs text-muted-foreground">
            {translate('settings.openai_api_key_help')}
          </Text>
          <Pressable
            accessibilityRole="link"
            className="mt-2 self-start py-1"
            onPress={() => Linking.openURL(OPENAI_API_KEYS_URL)}
          >
            <Text className="text-sm font-medium text-foreground underline">
              {translate('settings.get_api_key')}
            </Text>
          </Pressable>
        </View>

        <View
          className="mb-6 rounded-xl bg-card p-4"
          style={aiProvider === 'anthropic' ? undefined : { display: 'none' }}
        >
          <Input
            label={translate('settings.anthropic_api_key')}
            defaultValue={anthropicApiKey ?? ''}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="sk-..."
            className="text-lg"
            onChangeText={(text) => {
              anthropicInputRef.current = text;
              setDirty(true);
            }}
          />
          <Text className="mt-3 text-xs text-muted-foreground">
            {translate('settings.anthropic_api_key_help')}
          </Text>
          <Pressable
            accessibilityRole="link"
            className="mt-2 self-start py-1"
            onPress={() => Linking.openURL(ANTHROPIC_API_KEYS_URL)}
          >
            <Text className="text-sm font-medium text-foreground underline">
              {translate('settings.get_api_key')}
            </Text>
          </Pressable>
        </View>

        <View className="mb-10">
          <SolidButton
            fullWidth
            label={translate('common.save')}
            onPress={onSave}
            disabled={!dirty}
          />
        </View>
      </ScrollView>
    </>
  );
}
