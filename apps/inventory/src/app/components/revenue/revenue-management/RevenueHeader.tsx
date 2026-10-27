/** Page title block for the Revenue module (the views below render their own h2). */
export function RevenueHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue Management</h1>
        <p className="text-muted-foreground mt-1">Manage customers, quotations, sales orders, pick lists, delivery notes, and invoices</p>
      </div>
    </div>
  );
}
