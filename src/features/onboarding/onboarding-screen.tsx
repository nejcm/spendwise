import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { FocusAwareStatusBar, View } from '@/components/ui';
import { useImportBackup } from '@/features/imports-export/hooks';
import { storage } from '@/lib/storage';
import { setIsFirstTime } from '@/lib/store/store';
import AccountStep from './Account';
import PrefsStep from './Prefs';
import ProfileStep from './Profile';
import ReadyStep from './Ready';
import WelcomeStep from './Welcome';

// Changing the language reloads the app; this one-shot key brings the user back to Prefs.
const RESUME_STEP_KEY = 'onboarding.resumeStep';

export function OnboardingScreen() {
  const [step, setStep] = useState(() => storage.getNumber(RESUME_STEP_KEY) ?? 0);
  const router = useRouter();
  const importBackup = useImportBackup();

  React.useEffect(() => {
    storage.remove(RESUME_STEP_KEY);
  }, []);

  const finish = (href: '/' | '/settings/import-export' = '/') => {
    setIsFirstTime(false);
    router.replace(href);
  };

  const restore = () => importBackup.mutate(undefined, {
    onSuccess: (restored) => {
      if (restored) finish();
    },
  });

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} onRestore={restore} restoring={importBackup.isPending} />}
      {step === 1 && <ProfileStep onBack={() => setStep(0)} onNext={() => setStep(2)} />}
      {step === 2 && (
        <PrefsStep
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          onBeforeLanguageReload={() => storage.set(RESUME_STEP_KEY, 2)}
        />
      )}
      {step === 3 && <AccountStep onBack={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && <ReadyStep onBack={() => setStep(3)} onFinish={() => finish()} onImportCsv={() => finish('/settings/import-export')} />}
    </View>
  );
}
