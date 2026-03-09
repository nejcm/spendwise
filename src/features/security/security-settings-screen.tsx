import * as LocalAuthentication from 'expo-local-authentication';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

import { PinPad } from './components/pin-pad';
import {
  clearStoredPin,
  getLockTimeoutMinutes,
  isBiometricEnabled,
  isPinEnabled,
  setBiometricEnabled,
  setLockTimeoutMinutes,
  setStoredPin,
  verifyPin,
} from './use-security';

type Mode = 'confirm' | 'set' | 'verify' | 'view';

const TIMEOUT_OPTIONS = [
  { label: translate('security.timeout_immediately'), value: 0 },
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
];

type PinEntryViewProps = {
  mode: 'confirm' | 'set' | 'verify';
  onCancel: () => void;
  onComplete: (pin: string) => void;
  pinError: boolean;
};

function PinEntryView({ mode, pinError, onComplete, onCancel }: PinEntryViewProps) {
  const title
    = mode === 'verify' ? translate('security.verify_to_disable') : translate('security.set_pin');
  const label
    = mode === 'set'
      ? translate('security.set_new_pin')
      : mode === 'confirm'
        ? translate('security.confirm_pin')
        : translate('security.enter_current_pin');
  const errorMsg
    = mode === 'verify' ? translate('security.wrong_pin') : translate('security.pin_mismatch');

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
      <FocusAwareStatusBar />
      <Text className="mb-2 text-xl font-bold">{title}</Text>
      <View className="mb-4 h-5">
        {pinError && <Text className="text-sm text-red-500">{errorMsg}</Text>}
      </View>
      <PinPad hasError={pinError} label={label} onComplete={onComplete} />
      <Pressable className="mt-6" onPress={onCancel}>
        <Text className="text-neutral-500">{translate('common.cancel')}</Text>
      </Pressable>
    </View>
  );
}

export function SecuritySettingsScreen() {
  const [mode, setMode] = useState<Mode>('view');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinEnabledState, setPinEnabledState] = useState(() => isPinEnabled());
  const [bioEnabled, setBioEnabled] = useState(() => isBiometricEnabled());
  const [timeoutVal, setTimeoutVal] = useState(() => getLockTimeoutMinutes());
  const [hasBioHardware, setHasBioHardware] = useState(false);

  useEffect(() => {
    void (async () => {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBioHardware(has && enrolled);
    })();
  }, []);

  const showError = () => {
    setPinError(true);
    setTimeout(setPinError, 600, false);
  };

  const handlePinComplete = (pin: string) => {
    if (mode === 'set') {
      setNewPin(pin);
      setMode('confirm');
    }
    else if (mode === 'confirm') {
      if (pin === newPin) {
        setStoredPin(pin);
        setPinEnabledState(true);
        setNewPin('');
        setMode('view');
      }
      else {
        showError();
      }
    }
    else if (mode === 'verify') {
      if (verifyPin(pin)) {
        clearStoredPin();
        setPinEnabledState(false);
        setBioEnabled(false);
        setMode('view');
      }
      else {
        showError();
      }
    }
  };

  const handleCancel = () => {
    setMode('view');
    setNewPin('');
    setPinError(false);
  };

  if (mode !== 'view') {
    return (
      <PinEntryView
        mode={mode}
        pinError={pinError}
        onCancel={handleCancel}
        onComplete={handlePinComplete}
      />
    );
  }

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="mb-6 rounded-xl bg-neutral-50 dark:bg-neutral-800">
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-1">
              <Text className="font-medium">{translate('security.pin_lock')}</Text>
              <Text className="text-sm text-neutral-500">{translate('security.pin_desc')}</Text>
            </View>
            <Switch
              value={pinEnabledState}
              onValueChange={() => setMode(pinEnabledState ? 'verify' : 'set')}
            />
          </View>

          {pinEnabledState && hasBioHardware && (
            <>
              <View className="mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-1">
                  <Text className="font-medium">{translate('security.biometric')}</Text>
                  <Text className="text-sm text-neutral-500">
                    {translate('security.biometric_desc')}
                  </Text>
                </View>
                <Switch
                  value={bioEnabled}
                  onValueChange={(val) => {
                    setBiometricEnabled(val);
                    setBioEnabled(val);
                  }}
                />
              </View>
            </>
          )}
        </View>

        {pinEnabledState && (
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {translate('security.lock_after')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TIMEOUT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  className={`rounded-full px-4 py-2 ${
                    timeoutVal === opt.value ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'
                  }`}
                  onPress={() => {
                    setLockTimeoutMinutes(opt.value);
                    setTimeoutVal(opt.value);
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${timeoutVal === opt.value ? 'text-white' : ''}`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
