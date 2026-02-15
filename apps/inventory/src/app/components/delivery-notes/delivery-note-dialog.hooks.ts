import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@horizon-sync/store';

import type { CustomerResponse } from '../../types/customer.types';
import type { DeliveryNote, DeliveryNoteCreate, DeliveryNoteCreateItem, DeliveryNoteUpdate } from '../../types/delivery-note.types';
import {
  DeliveryNoteCreateItemField,
  type DeliveryNoteDialogFormData,
  type WarehouseOption,
  createDeliveryNoteCreatePayload,
  createDeliveryNoteUpdatePayload,
  getDialogFormDataFromDeliveryNote,
  getEmptyDeliveryNoteItem,
  getInitialDialogFormData,
} from './delivery-note-dialog.utils';
import { customerApi, warehouseApi } from '../../utility/api';

interface UseDeliveryNoteDialogProps {
  open: boolean;
  deliveryNote: DeliveryNote | null;
  onSave: (data: DeliveryNoteCreate | DeliveryNoteUpdate, id?: string) => void;
}

interface WarehousesResponse {
  warehouses: WarehouseOption[];
}

export interface UseDeliveryNoteDialogResult {
  isEdit: boolean;
  formData: DeliveryNoteDialogFormData;
  items: DeliveryNoteCreateItem[];
  customers: CustomerResponse['customers'];
  warehouses: WarehouseOption[];
  handleFieldChange: (field: keyof DeliveryNoteDialogFormData, value: string) => void;
  handleItemChange: (
    index: number,
    field: Exclude<DeliveryNoteCreateItemField, 'serial_nos'>,
    value: string | number,
  ) => void;
  handleItemSerialNoChange: (index: number, serialNumbers: string[]) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  handleSubmit: React.FormEventHandler<HTMLFormElement>;
}

export function useDeliveryNoteDialog({
  open,
  deliveryNote,
  onSave,
}: UseDeliveryNoteDialogProps): UseDeliveryNoteDialogResult {
  const accessToken = useUserStore((state) => state.accessToken);
  const isEdit = Boolean(deliveryNote);

  const [formData, setFormData] = React.useState<DeliveryNoteDialogFormData>(getInitialDialogFormData());
  const [items, setItems] = React.useState<DeliveryNoteCreateItem[]>([getEmptyDeliveryNoteItem()]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const { data: warehousesData } = useQuery<WarehousesResponse>({
    queryKey: ['warehouses-list'],
    queryFn: () => warehouseApi.list(accessToken || '', 1, 100) as Promise<WarehousesResponse>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];
  const warehouses = warehousesData?.warehouses ?? [];

  React.useEffect(() => {
    if (deliveryNote) {
      setFormData(getDialogFormDataFromDeliveryNote(deliveryNote));
      return;
    }

    setFormData(getInitialDialogFormData());
    setItems([getEmptyDeliveryNoteItem()]);
  }, [deliveryNote, open]);

  const handleFieldChange = React.useCallback((field: keyof DeliveryNoteDialogFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleItemChange = React.useCallback((
    index: number,
    field: Exclude<DeliveryNoteCreateItemField, 'serial_nos'>,
    value: string | number,
  ) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      if (field === 'qty' || field === 'rate') {
        updatedItems[index].amount = Number(updatedItems[index].qty) * Number(updatedItems[index].rate);
      }

      return updatedItems;
    });
  }, []);

  const handleItemSerialNoChange = React.useCallback((index: number, serialNumbers: string[]) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = { ...updatedItems[index], serial_nos: serialNumbers };
      return updatedItems;
    });
  }, []);

  const addItem = React.useCallback(() => {
    setItems((prevItems) => [...prevItems, { ...getEmptyDeliveryNoteItem(), sort_order: prevItems.length + 1 }]);
  }, []);

  const removeItem = React.useCallback((index: number) => {
    setItems((prevItems) => {
      if (prevItems.length <= 1) {
        return prevItems;
      }

      return prevItems
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sort_order: itemIndex + 1 }));
    });
  }, []);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isEdit && deliveryNote) {
        const updatePayload: DeliveryNoteUpdate = createDeliveryNoteUpdatePayload(formData);
        onSave(updatePayload, deliveryNote.id);
        return;
      }

      const createPayload: DeliveryNoteCreate = createDeliveryNoteCreatePayload(formData, items);
      onSave(createPayload);
    },
    [deliveryNote, isEdit, formData, items, onSave],
  );

  return {
    isEdit,
    formData,
    items,
    customers,
    warehouses,
    handleFieldChange,
    handleItemChange,
    handleItemSerialNoChange,
    addItem,
    removeItem,
    handleSubmit,
  };
}
