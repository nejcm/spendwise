import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { FocusAwareStatusBar, View } from '@/components/ui';
import { setIsFirstTime } from '@/lib/store';
import SettingsStep from './Settings';
import SetupStep from './Setup';
import WelcomeStep from './Welcome';

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const onFinish = () => {
    setIsFirstTime(false);
    router.push('/');
  };

  return (
    <View className="flex h-full bg-white dark:bg-neutral-950">
      <FocusAwareStatusBar />
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && <SetupStep onBack={() => setStep(0)} onNext={() => setStep(2)} />}
      {step === 2 && <SettingsStep onBack={() => setStep(1)} onNext={onFinish} />}
    </View>
  );
}
