import type { PaginationInfo } from './quotation.types';

export type AsnOrderStatus =
    | 'draft'
    | 'confirmed'
    | 'partially_delivered'
    | 'delivered'
    | 'closed'
    | 'cancelled';

type Box = {
    qty: number;
    uom: string;
};

export interface AsnOrderLineItem {
    id: string;
    organization_id: string;
    asn_order_id: string;
    item_id: string;
    item_name?: string;
    item_sku?: string;
    qty: number | Box;
    uom: string;
    sort_order: number;
    delivered_qty: number | string;
    created_at: string;
    updated_at: string;
    extra_data?: Record<string, unknown>;
}

export interface WarehouseDetails {
    id?: string;
    name?: string;
    code?: string;
    warehouse_name?: string;
    warehouse_code?: string;
    email?: string;
    phone?: string;
    address?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    // tax_number?: string;
}

export interface AsnOrderWarehouseInfo {
    id: string;
    name: string;
    code?: string | null;
}

export interface AsnOrderVehicleArrivalInfo {
    id: string;
    vehicle_no?: string | null;
    driver_name?: string | null;
    driver_contact?: string | null;
    transporter?: string | null;
    dock?: string | null;
    status: string;
    arrived_at: string;
}

export interface AsnOrder {
    id: string;
    organization_id: string;
    asn_order_no: string;
    warehouse_id_from: string;
    warehouse_id_to: string;
    warehouse_name?: string;
    order_date: string;
    delivery_date?: string | null;
    grand_total: string | number;
    status: AsnOrderStatus;
    reference_type?: string | null;
    reference_id?: string | null;
    reference_no?: string | null;
    remarks?: string | null;
    items: AsnOrderLineItem[];
    submitted_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    created_at: string;
    updated_at: string;
    extra_data?: Record<string, unknown>;
    warehouse?: WarehouseDetails;
    from_warehouse?: AsnOrderWarehouseInfo | null;
    to_warehouse?: AsnOrderWarehouseInfo | null;
    vehicle_arrivals: AsnOrderVehicleArrivalInfo[];
}

export interface AsnOrderListItem {
    id: string;
    organization_id: string;
    asn_order_no: string;
    status: string;
    order_date: string;
    delivery_date?: string | null;
    grand_total: string | number;
    from_warehouse?: AsnOrderWarehouseInfo | null;
    to_warehouse?: AsnOrderWarehouseInfo | null;
    vehicle_arrivals: AsnOrderVehicleArrivalInfo[];
    created_at: string;
}

export interface AsnOrderListResponse {
    asn_orders: AsnOrderListItem[];
    pagination: PaginationInfo;
}

export interface AsnOrderItemCreate {
    item_id: string;
    item_name?: string;
    qty: number;
    uom: string;
    sort_order: number;
}

export interface AsnOrderCreate {
    asn_order_no?: string;
    warehouse_id_from: string;
    warehouse_id_to: string;
    order_date: string;
    delivery_date?: string | null;
    status?: AsnOrderStatus;
    grand_total?: number;
    remarks?: string | null;
    items: AsnOrderItemCreate[];
}

export interface AsnOrderUpdate {
    warehouse_id_from?: string | null;
    warehouse_id_to?: string | null;
    order_date?: string | null;
    delivery_date?: string | null;
    status?: AsnOrderStatus | null;
    remarks?: string | null;
    items?: AsnOrderItemCreate[] | null;
}

export interface AsnOrderFormData {
    asn_order_no: string;
    warehouse_id_from: string;
    warehouse_id_to: string;
    order_date: string;
    delivery_date: string;
    status: AsnOrderStatus;
    remarks: string;
}

export interface AsnOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    viewMode?: boolean;
    asnOrder: AsnOrder | null;
    saving: boolean;
    onSave: (data: AsnOrderCreate | AsnOrderUpdate, id?: string) => Promise<void>;
    onCreated?: () => void;
    onUpdated?: () => void;
}

export interface AsnOrderStatusUpdate {
    status: AsnOrderStatus;
}

export type AsnOrderResponse = AsnOrder












