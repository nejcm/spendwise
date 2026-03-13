import * as React from 'react';
import { View } from 'react-native';

import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { setAiProvider, setAnthropicApiKey, setOpenaiApiKey, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { translate } from '../../lib/i18n';

export function AiSettingsScreen() {
  const aiProvider = useAppStore.use.aiProvider();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();

  const [openaiKey, setOpenaiKey] = React.useState(openaiApiKey ?? '');
  const [anthropicKey, setAnthropicKey] = React.useState(anthropicApiKey ?? '');

  const handleSave = React.useCallback(() => {
    setOpenaiApiKey(openaiKey.trim() || null);
    setAnthropicApiKey(anthropicKey.trim() || null);

    if (openaiKey.trim() && !anthropicKey.trim()) {
      setAiProvider('openai');
    }
    else if (!openaiKey.trim() && anthropicKey.trim()) {
      setAiProvider('anthropic');
    }
  }, [openaiKey, anthropicKey]);

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>

        <Text className="mb-1 text-lg font-medium">{translate('settings.ai_provider')}</Text>
        <Text className="mb-6 text-sm text-muted-foreground">
          {translate('settings.ai_provider_desc')}
        </Text>

        <View className="mb-4 rounded-xl bg-card p-4">
          <Input
            label={translate('settings.openai_api_key')}
            value={openaiKey}
            onChangeText={setOpenaiKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            size="lg"
            placeholder="sk-..."
          />
        </View>

        <View className="mb-6 rounded-xl bg-card p-4">
          <Input
            label={translate('settings.anthropic_api_key')}
            value={anthropicKey}
            onChangeText={setAnthropicKey}
            autoCapitalize="none"
            autoCorrect={false}
            size="lg"
            secureTextEntry
            placeholder="sk-..."
          />
        </View>

        <View className="mb-10">
          <Button label="Save" onPress={handleSave} />
        </View>
      </ScrollView>
    </View>
  );
}
