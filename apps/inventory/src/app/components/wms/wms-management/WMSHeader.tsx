import { WarehouseSelect } from '../../common';

interface WMSHeaderProps {
  warehouses: Array<{ id: string; name: string; code: string }>;
  warehousesLoading: boolean;
  selectedWarehouseId: string;
  onWarehouseChange: (warehouseId: string) => void;
}

/** Title block plus the app-wide warehouse picker. */
export function WMSHeader({ warehouses, warehousesLoading, selectedWarehouseId, onWarehouseChange }: WMSHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
        <p className="text-muted-foreground mt-1">Manage inbound receiving, put-away, outbound picking, and gate verification</p>
      </div>
      <WarehouseSelect warehouses={warehouses}
        value={selectedWarehouseId}
        onChange={onWarehouseChange}
        loading={warehousesLoading}
        label="Warehouse"
        htmlId="wms-warehouse"
        triggerClassName="w-[220px]"
        className="flex flex-row items-center gap-3 space-y-0"/>
    </div>
  );
}
