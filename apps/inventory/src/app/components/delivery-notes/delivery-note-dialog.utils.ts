import type { DeliveryNote, DeliveryNoteCreate, DeliveryNoteCreateItem, DeliveryNoteUpdate } from '../../types/delivery-note.types';

export type DeliveryNoteCreateItemField = keyof DeliveryNoteCreateItem;

export interface DeliveryNoteDialogFormData {
  delivery_note_no: string;
  customer_id: string;
  delivery_date: string;
  status: DeliveryNote['status'];
  warehouse_id: string;
  pick_list_id: string;
  reference_type: string;
  reference_id: string;
  remarks: string;
}

export interface WarehouseOption {
  id: string;
  warehouse_name: string;
}

export const DELIVERY_NOTE_DEFAULT_EMPTY_ITEM: DeliveryNoteCreateItem = {
  item_id: '',
  qty: 0,
  uom: 'pcs',
  rate: 0,
  amount: 0,
  warehouse_id: '',
  batch_no: '',
  serial_nos: [],
  sort_order: 0,
};

export const getInitialDialogFormData = (): DeliveryNoteDialogFormData => ({
  delivery_note_no: '',
  customer_id: '',
  delivery_date: new Date().toISOString().slice(0, 16),
  status: 'draft',
  warehouse_id: '',
  pick_list_id: '',
  reference_type: '',
  reference_id: '',
  remarks: '',
});

export const getDialogFormDataFromDeliveryNote = (deliveryNote: DeliveryNote): DeliveryNoteDialogFormData => ({
  delivery_note_no: deliveryNote.delivery_note_no,
  customer_id: deliveryNote.customer_id,
  delivery_date: deliveryNote.delivery_date
    ? deliveryNote.delivery_date.slice(0, 16)
    : deliveryNote.shipping_date?.slice(0, 16) || '',
  status: deliveryNote.status,
  warehouse_id: '',
  pick_list_id: '',
  reference_type: '',
  reference_id: '',
  remarks: '',
});

export const getEmptyDeliveryNoteItem = (): DeliveryNoteCreateItem => ({
  ...DELIVERY_NOTE_DEFAULT_EMPTY_ITEM,
  sort_order: 1,
});

export const parseSerialNumbers = (value: string): string[] =>
  value
    .split(',')
    .map((serial) => serial.trim())
    .filter((serial) => serial.length > 0);

export const formatSerialNumbers = (serialNumbers: string[]): string =>
  serialNumbers.join(', ');

export const createDeliveryNoteUpdatePayload = (
  formData: DeliveryNoteDialogFormData,
): DeliveryNoteUpdate => ({
  delivery_date: new Date(formData.delivery_date).toISOString(),
  status: formData.status,
  warehouse_id: formData.warehouse_id || undefined,
  remarks: formData.remarks || undefined,
});

export const createDeliveryNoteCreatePayload = (
  formData: DeliveryNoteDialogFormData,
  items: DeliveryNoteCreateItem[],
): DeliveryNoteCreate => ({
  delivery_note_no: formData.delivery_note_no,
  customer_id: formData.customer_id,
  delivery_date: new Date(formData.delivery_date).toISOString(),
  status: formData.status,
  warehouse_id: formData.warehouse_id,
  pick_list_id: formData.pick_list_id || undefined,
  reference_type: formData.reference_type || undefined,
  reference_id: formData.reference_id || undefined,
  remarks: formData.remarks || undefined,
  items: items.map((item) => ({
    ...item,
    warehouse_id: item.warehouse_id || formData.warehouse_id,
  })),
});
