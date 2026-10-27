/** Page title block for the Inventory module (the views below render their own h2). */
export function InventoryHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">Manage items, item groups, warehouses, and stock levels</p>
      </div>
    </div>
  );
}
