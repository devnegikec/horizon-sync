import { useState } from 'react';

import type { ApiItemGroup } from '../types/item-groups.types';
import type { Item } from '../types/item.types';
import type { ItemFormData, buildCreateItemPayload, buildUpdateItemPayload } from '../utility/item-payload-builders';

import { useCreateItem } from './useCreateItem';
import { useUpdateItem } from './useUpdateItem';

interface UseItemSubmissionProps {
  item?: Item | null;
  itemGroups: ApiItemGroup[];
  onCreated?: () => void;
  onUpdated?: () => void;
  onClose: () => void;
}

interface UseItemSubmissionResult {
  handleSubmit: (formData: ItemFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useItemSubmission({ item, itemGroups, onCreated, onUpdated, onClose }: UseItemSubmissionProps): UseItemSubmissionResult {
  const { createItem, loading: createLoading } = useCreateItem();
  const { updateItem, loading: updateLoading } = useUpdateItem();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!item;
  const isLoading = createLoading || updateLoading;

  const handleCreateSubmit = async (formData: ItemFormData) => {
    try {
      const { buildCreateItemPayload } = await import('../utility/item-payload-builders');
      const payload = buildCreateItemPayload(formData);
      await createItem(payload);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    }
  };

  const handleEditSubmit = async (formData: ItemFormData) => {
    if (!item?.id) {
      setError('Item ID is required for editing');
      return;
    }

    try {
      const { buildUpdateItemPayload } = await import('../utility/item-payload-builders');
      const selectedGroup = itemGroups.find((g) => g.id === formData.itemGroupId);
      const payload = buildUpdateItemPayload(formData, selectedGroup);
      await updateItem(item.id, payload);
      onUpdated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  };

  const handleSubmit = async (formData: ItemFormData) => {
    setError(null);

    if (isEditing) {
      await handleEditSubmit(formData);
    } else {
      await handleCreateSubmit(formData);
    }
  };

  return {
    handleSubmit,
    isLoading,
    error,
  };
}
