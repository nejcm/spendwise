import { FlashList as NFlashList } from '@shopify/flash-list';
import { TextSearch } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { translate } from '@/lib/i18n';
import { Text } from './text';

type Props = {
  isLoading: boolean;
};

export const List = NFlashList;

export const EmptyList = React.memo(({ isLoading }: Props) => {
  return (
    <View className="min-h-[400] flex-1 items-center justify-center">
      {!isLoading
        ? (
            <View className="text-center">
              <TextSearch size={100} className="mx-auto text-gray-400" />
              <Text className="pt-4 text-center text-lg text-gray-500">{translate('common.no_data')}</Text>
            </View>
          )
        : (
            <ActivityIndicator />
          )}
    </View>
  );
});
