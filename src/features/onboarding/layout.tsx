import { Text, View } from '../../components/ui';
import IntroNav from './Nav';

export interface OnboardingLayoutProps {
  title: string;
  currentStep: number;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function OnboardingLayout({ title, currentStep, children, footer }: OnboardingLayoutProps) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-center gap-3 p-6">
        <Text className="text-2xl font-bold tracking-tight text-black dark:text-black">
          {title}
        </Text>
      </View>
      <IntroNav current={currentStep} />
      <View className="mt-12 mb-4 px-6">
        {children}
      </View>
      <View className="mt-auto w-full flex-row items-center gap-2 px-6 pb-8">
        {footer}
      </View>
    </View>
  );
}
