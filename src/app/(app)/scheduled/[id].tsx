import * as React from 'react';
import { ScheduledTransactionDetailScreen } from '@/features/scheduled-transactions/scheduled-transaction-detail-screen';
import { translate } from '@/lib/i18n';
import ScreenHeader from '../../../components/screen-header';

export default function ScheduledTransactionDetailRoute() {
  return (
    <>
      <ScreenHeader title={translate('scheduled.title')} />
      <ScheduledTransactionDetailScreen />
    </>
  );
}
