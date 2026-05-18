import * as React from 'react';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { defaultStyles } from '@/lib/theme/styles';

export function TermsScreen() {
  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-8 pb-12" style={defaultStyles.transparentBg}>
        <Text className="mb-4 text-2xl font-bold text-foreground">
          Terms &amp; Conditions
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          These terms and conditions apply to the Spendwise app (hereby referred to as
          &quot;Application&quot;) for mobile devices that was created by Nejc (hereby
          referred to as &quot;Service Provider&quot;) as a free Open Source service.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          Upon downloading or utilizing the Application, you are automatically agreeing
          to the following terms. It is strongly advised that you thoroughly read and
          understand these terms prior to using the Application.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          The Service Provider is dedicated to ensuring that the Application is as
          beneficial and efficient as possible. As such, they reserve the right to
          modify the Application at any time and for any reason. Spendwise is free to
          use. Optional third-party AI providers may charge your provider account when
          you configure and use your own API key.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          The Application stores and processes personal data locally on your device in
          order to provide the Service. Core finance data is not stored in a Spendwise
          cloud account. It is your
          responsibility to maintain the security of your phone and access to the
          Application. The Service Provider strongly advise against jailbreaking or
          rooting your phone, which involves removing software restrictions and
          limitations imposed by the official operating system of your device. Such
          actions could expose your phone to malware, viruses, malicious programs,
          compromise your phone&apos;s security features, and may result in the
          Application not functioning correctly or at all.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          Please note that the Application utilizes third-party services that have
          their own Terms and Conditions. Below are the links to the Terms and
          Conditions of the third-party service providers used by the Application:
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          • Google Play Services:
          {' '}
          https://policies.google.com/terms
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          Please be aware that the Service Provider does not assume responsibility for
          certain aspects. Some functions of the Application require an active
          internet connection, which can be Wi-Fi or provided by your mobile network
          provider. The Service Provider cannot be held responsible if the Application
          does not function at full capacity due to lack of access to Wi-Fi or if you
          have exhausted your data allowance.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          If you are using the application outside of a Wi-Fi area, please be aware
          that your mobile network provider&apos;s agreement terms still apply.
          Consequently, you may incur charges from your mobile provider for data usage
          during the connection to the application, or other third-party charges. By
          using the application, you accept responsibility for any such charges,
          including roaming data charges if you use the application outside of your
          home territory (i.e., region or country) without disabling data roaming. If
          you are not the bill payer for the device on which you are using the
          application, they assume that you have obtained permission from the bill
          payer.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          Similarly, the Service Provider cannot always assume responsibility for your
          usage of the application. For instance, it is your responsibility to ensure
          that your device remains charged. If your device runs out of battery and you
          are unable to access the Service, the Service Provider cannot be held
          responsible.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          In terms of the Service Provider&apos;s responsibility for your use of the
          application, it is important to note that while they strive to ensure that
          it is updated and accurate at all times, they do rely on third parties to
          provide information to them so that they can make it available to you. The
          Service Provider accepts no liability for any loss, direct or indirect, that
          you experience as a result of relying entirely on this functionality of the
          application.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          The Application includes optional Artificial Intelligence (AI) features. If
          you configure AI with your own provider API key, selected data may be sent
          directly from your device to that provider to answer questions or scan
          receipts. You are responsible for reviewing the provider&apos;s terms, privacy
          policy, and usage charges.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          The Service Provider may wish to update the application at some point. The
          application is currently available as per the requirements for the operating
          system (and for any additional systems they decide to extend the
          availability of the application to) may change, and you will need to
          download the updates if you want to continue using the application. The
          Service Provider does not guarantee that it will always update the
          application so that it is relevant to you and/or compatible with the
          particular operating system version installed on your device. However, you
          agree to always accept updates to the application when offered to you. The
          Service Provider may also wish to cease providing the application and may
          terminate its use at any time without providing termination notice to you.
          Unless they inform you otherwise, upon any termination, (a) the rights and
          licenses granted to you in these terms will end; (b) you must cease using
          the application, and (if necessary) delete it from your device.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Changes to These Terms and Conditions
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          The Service Provider may periodically update their Terms and Conditions.
          Therefore, you are advised to review this page regularly for any changes.
          The Service Provider will notify you of any changes by posting the new Terms
          and Conditions on this page.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Contact Us
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          If you have any questions or suggestions about the Terms and Conditions,
          please do not hesitate to contact the Service Provider at
          {' '}
          nmursi2@gmail.com.
        </Text>

        <Text className="mt-2 text-xs text-muted-foreground">
          These terms and conditions are effective as of 2026-03-13.
        </Text>
      </ScrollView>
    </>
  );
}
