import type { Category, CategoryFormData } from './types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';

import { Modal, useModal } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { CategoryForm } from './category-form';

type CategoryInitialValues = (Partial<CategoryFormData> & { id: undefined }) | (CategoryFormData & { id: Category['id'] });

export type CategoryManageModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  initialValues?: CategoryInitialValues;
};

export function CategoryManageModal({ isOpen, onClose, initialValues }: CategoryManageModalProps) {
  const { ref: modalRef } = useModal();
  const id = initialValues?.id;

  React.useEffect(() => {
    if (isOpen) modalRef.current?.present();
    else modalRef.current?.dismiss();
  }, [isOpen, modalRef]);

  return (
    <Modal ref={modalRef} snapPoints={['55%']} onDismiss={onClose} title={id ? translate('categories.edit_category') : translate('categories.add')}>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <CategoryForm initialValues={initialValues} />
      </BottomSheetScrollView>
    </Modal>
  );
}
