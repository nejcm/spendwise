import { useRouter } from 'expo-router';
import { ArrowLeftIcon, IconButton, Text, View } from './ui';

export type ScreenHeaderProps = {
  title: string;
  back?: boolean;
};

export default function ScreenHeader({ title, back = true }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View className="w-full flex-row items-center justify-start gap-2 border-b border-border bg-muted px-4">
      {back && <IconButton color="none" onPress={() => router.back()}><ArrowLeftIcon className="text-muted-foreground" /></IconButton>}
      <Text className="py-3 text-center text-xl font-medium text-foreground">{title}</Text>
    </View>
  );
}
