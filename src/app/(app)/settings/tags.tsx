import ScreenHeader from '@/components/screen-header';
import { TagsScreen } from '@/features/tags/tags-screen';
import { translate } from '@/lib/i18n';

export default function TagsRoute() {
  return (
    <>
      <ScreenHeader title={translate('tags.title')} />
      <TagsScreen />
    </>
  );
}
