# Pre-Existing Failing Tests

These test files were already failing **before** the refactoring work. They are not caused by any recent changes.

## Inventory App (`apps/inventory/`)

### Components — Quotations (6 files)

- `src/test/app/components/quotations/ConvertToSalesOrderDialog.spec.tsx`
- `src/test/app/components/quotations/QuotationsTable.spec.tsx`
- `src/test/app/components/quotations/QuotationDialog.spec.tsx`
- `src/test/app/components/quotations/LineItemTable.spec.tsx`
- `src/test/app/components/quotations/QuotationDetailDialog.spec.tsx`
- `src/test/app/components/quotations/QuotationManagement.spec.tsx`

### Components — Sales Orders (4 files)

- `src/test/app/components/sales-orders/SalesOrdersTable.spec.tsx`
- `src/test/app/components/sales-orders/SalesOrderDialog.spec.tsx`
- `src/test/app/components/sales-orders/CreateInvoiceDialog.spec.tsx`
- `src/test/app/components/sales-orders/SalesOrderDetailDialog.spec.tsx`

### Components — Invoices (2 files)

- `src/test/app/components/invoices/InvoiceDetailDialog.test.tsx`
- `src/test/app/components/invoices/InvoiceManagementFilters.test.tsx`

### Components — Payments (3 files)

- `src/test/app/components/payments/PaymentDetailDialog.test.tsx`
- `src/test/app/components/payments/PaymentDialog.test.tsx`
- `src/app/components/payments/PaymentForm.bugfix.test.tsx`

### Components — Items (3 files)

- `src/test/app/components/items/ItemManagement.spec.tsx`
- `src/test/app/components/items/ItemManagementHeader.spec.tsx`
- `src/test/app/components/items/ItemManagementFilters.spec.tsx`

### Components — Stock (3 files)

- `src/test/app/components/stock/StockEntryDialog.spec.tsx`
- `src/test/app/components/stock/StockLevelsTable.empty-state.property.test.tsx`
- `src/test/app/components/stock/StockManagement.spec.tsx`

### Components — Accounts (duplicate tests in `src/test/` that conflict with co-located tests) (6 files)

- `src/test/app/components/accounts/AccountSelector.test.tsx`
- `src/test/app/components/accounts/AccountTreeView.test.tsx`
- `src/test/app/components/accounts/AccountCodeInput.test.tsx`
- `src/test/app/components/accounts/AccountDialog.test.tsx`
- `src/test/app/components/accounts/AccountTypeFilter.test.tsx`
- `src/test/app/components/accounts/SystemConfiguration.test.tsx`
- `src/test/app/components/accounts/AccountColorConsistency.test.tsx`

### Co-located Account Tests (4 files — also failing)

- `src/app/components/accounts/SystemConfiguration.test.tsx`
- `src/app/components/accounts/AccountCodeInput.test.tsx`
- `src/app/components/accounts/AccountSelector.test.tsx`
- `src/app/components/accounts/AccountTypeFilter.test.tsx`

### Hooks (4 files)

- `src/test/app/hooks/useInvoiceManagement.test.tsx`
- `src/test/app/hooks/usePayments.test.ts`
- `src/test/app/hooks/usePaymentActions.test.ts`
- `src/test/app/hooks/usePaymentValidation.test.ts`
- `src/test/app/hooks/useInvoiceAllocations.test.ts`

### Pages (2 files)

- `src/app/pages/BooksPage.test.tsx`
- `src/test/app/pages/BooksPage.test.tsx`

### Integration (2 files)

- `src/test/app/integration/invoice-payment-workflow.test.tsx`
- `src/test/app/integration/responsive-accessibility.test.tsx`

### Property Tests (1 file)

- `src/test/app/components/sales-orders/CreateInvoiceDialog.property.spec.tsx`

---

**Total: ~42 pre-existing failing test files**

### Common Root Causes

1. **Vitest/Jest mismatch** — Some tests import from `vitest` but run under Jest
2. **Missing `window.matchMedia` polyfill** — ThemeProvider requires it in jsdom
3. **Duplicate test files** — `src/test/` copies conflict with co-located `src/app/` tests
4. **Missing mock setup** — Components depend on hooks/services not properly mocked
5. **Stale tests** — Tests reference old component APIs that have since changed
