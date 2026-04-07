import * as React from 'react';

import { FocusAwareStatusBar, ScrollView, Text, View } from '@/components/ui';
import { defaultStyles } from '@/lib/theme/styles';

export function PrivacyScreen() {
  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-8 pb-12" style={defaultStyles.transparentBg}>
        <Text className="mb-4 text-2xl font-bold text-foreground">
          Privacy Policy
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          This privacy policy applies to the Spendwise app (hereby referred to as &quot;Application&quot;) for
          mobile devices that was created by Nejc (hereby referred to as &quot;Service Provider&quot;) as an
          Open Source service. This service is intended for use &quot;AS IS&quot;.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Information Collection and Use
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          The Application collects information when you download and use it. This information may include
          information such as:
        </Text>

        <View className="mb-4 pl-4">
          <Text className="mb-1 text-sm text-muted-foreground">
            • Your device&apos;s Internet Protocol address (e.g. IP address)
          </Text>
          <Text className="mb-1 text-sm text-muted-foreground">
            • The pages of the Application that you visit, the time and date of your visit, the time spent on those pages
          </Text>
          <Text className="mb-1 text-sm text-muted-foreground">
            • The time spent on the Application
          </Text>
          <Text className="text-sm text-muted-foreground">
            • The operating system you use on your mobile device
          </Text>
        </View>

        <Text className="mb-4 text-sm text-muted-foreground">
          The Application does not gather precise information about the location of your mobile device.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          The Application uses Artificial Intelligence (AI) technologies to enhance user experience and provide certain
          features. The AI components may process user data to deliver personalized content, recommendations, or
          automated functionalities. All AI processing is performed in accordance with this privacy policy and applicable
          laws. If you have questions about the AI features or data processing, please contact the Service Provider.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          The Service Provider may use the information you provide to contact you from time to time to provide you with
          important information, required notices and marketing promotions.
        </Text>

        <Text className="mb-4 text-sm text-muted-foreground">
          For a better experience, while using the Application, the Service Provider may require you to provide certain
          personally identifiable information. The information that the Service Provider requests will be retained by
          them and used as described in this privacy policy.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Third Party Access
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider
          in improving the Application and their service. The Service Provider may share your information with third
          parties in the ways that are described in this privacy statement.
        </Text>

        <Text className="mb-2 text-sm font-semibold text-foreground">
          Third-party services:
        </Text>
        <View className="mb-4 pl-4">
          <Text className="text-sm text-muted-foreground">
            • Google Play Services (see their privacy policy at https://www.google.com/policies/privacy/)
          </Text>
        </View>

        <Text className="mb-4 text-sm text-muted-foreground">
          The Service Provider may disclose User Provided and Automatically Collected Information:
        </Text>

        <View className="mb-4 pl-4">
          <Text className="mb-1 text-sm text-muted-foreground">
            • as required by law, such as to comply with a subpoena, or similar legal process;
          </Text>
          <Text className="mb-1 text-sm text-muted-foreground">
            • when they believe in good faith that disclosure is necessary to protect their rights, protect your safety
            or the safety of others, investigate fraud, or respond to a government request;
          </Text>
          <Text className="text-sm text-muted-foreground">
            • with their trusted service providers who work on their behalf, do not have an independent use of the
            information we disclose to them, and have agreed to adhere to the rules set forth in this privacy statement.
          </Text>
        </View>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Opt-Out Rights
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          You can stop all collection of information by the Application easily by uninstalling it. You may use the
          standard uninstall processes as may be available as part of your mobile device or via the mobile application
          marketplace or network.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Data Retention Policy
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          The Service Provider will retain User Provided data for as long as you use the Application and for a
          reasonable time thereafter. If you would like them to delete User Provided Data that you have provided via the
          Application, please contact them at nmursi2@gmail.com and they will respond in a reasonable time.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Children
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          The Service Provider does not use the Application to knowingly solicit data from or market to children under
          the age of 13. The Application does not address anyone under the age of 13. The Service Provider does not
          knowingly collect personally identifiable information from children under 13 years of age. In the case the
          Service Provider discovers that a child under 13 has provided personal information, the Service Provider will
          immediately delete this from their servers. If you are a parent or guardian and you are aware that your child
          has provided us with personal information, please contact the Service Provider (nmursi2@gmail.com) so that
          they will be able to take the necessary actions.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Security
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          The Service Provider is concerned about safeguarding the confidentiality of your information. The Service
          Provider provides physical, electronic, and procedural safeguards to protect information the Service Provider
          processes and maintains.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Changes
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of
          any changes to the Privacy Policy by updating this page with the new Privacy Policy. You are advised to
          consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Your Consent
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          By using the Application, you are consenting to the processing of your information as set forth in this
          Privacy Policy now and as amended by us.
        </Text>

        <Text className="mb-2 text-base font-semibold text-foreground">
          Contact Us
        </Text>
        <Text className="mb-4 text-sm text-muted-foreground">
          If you have any questions regarding privacy while using the Application, or have questions about these
          practices, please contact the Service Provider via email at nmursi2@gmail.com.
        </Text>

        <Text className="mt-2 text-xs text-muted-foreground">
          This privacy policy is effective as of 2026-03-13
        </Text>
      </ScrollView>
    </>
  );
}
