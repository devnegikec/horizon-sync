# Implementation Plan: Shared Invoice Components Migration

## Overview

Migrate 15 presentational invoice components, 4 common components, shared types, and a utility function from the inventory app into `@horizon-sync/ui`. Decouple components from app-specific hooks/APIs via props. Update the inventory app orchestrator to import from the shared library. All code uses TypeScript/React.

## Tasks

- [ ] 1. Create shared types and utility modules
  - [ ] 1.1 Create `libs/shared/ui/src/types/invoice.types.ts`
    - Copy all types from `apps/inventory/src/app/types/invoice.types.ts`
    - Add `InvoiceFilters` type (currently in `apps/inventory/src/app/hooks/useInvoiceManagement.ts`)
    - Add `TaxInfo`, `TaxBreakupItem` as standalone exported interfaces
    - Export: `Invoice`, `InvoiceLineItem`, `InvoiceStatus`, `InvoiceType`, `PartyDetails`, `InvoiceListItem`, `InvoiceResponse`, `InvoiceCreateRequest`, `InvoiceUpdateRequest`, `MarkAsPaidRequest`, `InvoiceFilters`, `TaxInfo`, `TaxBreakupItem`
    - _Requirements: 2.1, 2.2_

  - [ ] 1.2 Create `libs/shared/ui/src/types/currency.types.ts`
    - Copy `Currency` interface, `SUPPORTED_CURRENCIES` constant, and `getCurrencySymbol` function from `apps/inventory/src/app/types/currency.types.ts`
    - Do NOT copy `ExchangeRate` or other app-specific currency types
    - _Requirements: 2.4_

  - [ ] 1.3 Create `libs/shared/ui/src/utils/formatDate.ts`
    - Copy the `formatDate` function from `apps/inventory/src/app/utility/formatDate.ts` along with its supporting types (`DateInput`, `DateFormat`, `FormatDateOptions`)
    - Ensure no app-specific imports remain
    - _Requirements: 3.4_

  - [ ] 1.4 Create barrel exports for types and utils
    - Create `libs/shared/ui/src/types/index.ts` exporting `* from './invoice.types'` and `* from './currency.types'`
    - Create `libs/shared/ui/src/utils/index.ts` exporting `* from './formatDate'`
    - Update `libs/shared/ui/src/index.ts` to add `export * from './types'` and `export * from './utils'`
    - _Requirements: 2.1, 2.4, 5.2_

- [ ] 2. Migrate common components to the shared library
  - [ ] 2.1 Create `libs/shared/ui/src/components/common/StatCard.tsx`
    - Copy from `apps/inventory/src/app/components/shared/StatCard.tsx`
    - Update `Card` import to use relative shared UI path (`../ui/card`)
    - Verify no app-specific imports remain
    - _Requirements: 3.1_

  - [ ] 2.2 Create `libs/shared/ui/src/components/common/PartyInfoCard.tsx`
    - Copy from `apps/inventory/src/app/components/common/PartyInfoCard.tsx`
    - Export both `PartyInfoCard` component and `PartyInfoData` type
    - Verify only lucide-react icons are imported (no app-specific deps)
    - _Requirements: 3.1_

  - [ ] 2.3 Create `libs/shared/ui/src/components/common/LineItemsDetailTable.tsx`
    - Copy from `apps/inventory/src/app/components/common/LineItemsDetailTable.tsx`
    - Verify no app-specific imports remain
    - _Requirements: 3.1_

  - [ ] 2.4 Create `libs/shared/ui/src/components/common/TaxSummaryCollapsible.tsx`
    - Copy from `apps/inventory/src/app/components/common/TaxSummaryCollapsible.tsx`
    - Update `Separator` import to use shared UI path
    - _Requirements: 3.1_

  - [ ] 2.5 Create `libs/shared/ui/src/components/common/index.ts` barrel export
    - Export `LineItemsDetailTable`, `TaxSummaryCollapsible`, `PartyInfoCard`, `PartyInfoData`, `StatCard`
    - _Requirements: 5.2_

- [ ] 3. Checkpoint
  - Ensure the shared library compiles with the new types, utils, and common components. Ask the user if questions arise.

- [ ] 4. Migrate simple presentational invoice components
  - [ ] 4.1 Create `libs/shared/ui/src/components/invoice/InvoiceStatusBadge.tsx`
    - Copy from inventory app
    - Update `InvoiceStatus` import to `../../types/invoice.types`
    - Update `Badge` import to shared UI path
    - _Requirements: 1.1, 8.1_

  - [ ] 4.2 Create `libs/shared/ui/src/components/invoice/InvoiceHeader.tsx`
    - Copy from inventory app
    - Update `Invoice` type import to shared lib types
    - _Requirements: 1.1, 8.1_

  - [ ] 4.3 Create `libs/shared/ui/src/components/invoice/InvoiceDates.tsx`
    - Copy from inventory app
    - Update `formatDate` import to `../../utils/formatDate`
    - Update `Invoice` type import to shared lib types
    - _Requirements: 1.1, 4.5, 8.1_

  - [ ] 4.4 Create `libs/shared/ui/src/components/invoice/InvoicePartyInfo.tsx`
    - Copy from inventory app
    - Update `PartyInfoCard` import to `../common/PartyInfoCard`
    - Update `Invoice` type import to shared lib types
    - _Requirements: 1.1, 8.1_

  - [ ] 4.5 Create `libs/shared/ui/src/components/invoice/InvoiceAmountsSummary.tsx`
    - Copy from inventory app
    - Update `Invoice` type import to shared lib types
    - _Requirements: 1.1, 8.1_

  - [ ] 4.6 Create `libs/shared/ui/src/components/invoice/InvoiceStats.tsx`
    - Copy from inventory app
    - Update `StatCard` import to `../common/StatCard`
    - _Requirements: 1.1, 4.6, 8.1_

  - [ ] 4.7 Create `libs/shared/ui/src/components/invoice/InvoiceManagementHeader.tsx`
    - Copy from inventory app
    - Update `Button` and `cn` imports to shared UI paths
    - _Requirements: 1.1, 8.1_

  - [ ] 4.8 Create `libs/shared/ui/src/components/invoice/SendInvoiceEmailDialog.tsx`
    - Copy from inventory app
    - Update `Invoice` type import to shared lib types
    - _Requirements: 1.1, 8.1_

- [ ] 5. Migrate components requiring props decoupling
  - [ ] 5.1 Create `libs/shared/ui/src/components/invoice/InvoiceContent.tsx`
    - Copy from inventory app
    - Update all imports: `formatDate` from shared utils, `LineItemsDetailTable`/`TaxSummaryCollapsible` from `../common/`, `Invoice`/`InvoiceLineItem` types from shared types
    - Import sibling invoice components (`InvoiceHeader`, `InvoiceDates`, `InvoicePartyInfo`, `InvoiceAmountsSummary`, `BankAccountDetails`) from relative paths within the invoice directory
    - _Requirements: 1.1, 4.5, 8.1_

  - [ ] 5.2 Create `libs/shared/ui/src/components/invoice/BankAccountDetails.tsx`
    - Copy from inventory app
    - Remove `useQuery`, `apiRequest`, `useUserStore` imports
    - Define and export `BankAccount` and `BankAccountDetailsProps` interfaces as specified in design
    - Accept `account`, `loading`, and `className` as props instead of fetching data internally
    - _Requirements: 1.3, 4.7, 7.3_

  - [ ] 5.3 Create `libs/shared/ui/src/components/invoice/InvoiceLineItemTable.tsx`
    - Copy from inventory app
    - Remove `useQuery`, `itemApi`, `useUserStore` imports
    - Define and export `InvoiceLineItemTableProps` interface as specified in design
    - Accept `availableItems`, `isLoadingItems`, `items`, `onItemsChange` as props
    - Keep `SearchableSelect` import from `@horizon-sync/search` if it's a shared workspace dep, otherwise replace with a prop
    - _Requirements: 1.3, 4.7, 7.3_

  - [ ] 5.4 Create `libs/shared/ui/src/components/invoice/InvoicesTable.tsx`
    - Copy from inventory app
    - Update `formatDate` import to shared utils, `InvoiceStatusBadge` from sibling, types from shared types
    - Accept all action callbacks (`onView`, `onDelete`, `onMarkAsPaid`, `onCreatePayment`, `onCreateInvoice`) as props
    - _Requirements: 1.1, 4.4, 8.1_

  - [ ] 5.5 Create `libs/shared/ui/src/components/invoice/InvoiceManagementFilters.tsx`
    - Copy from inventory app
    - Remove `useInvoiceManagement` import
    - Import `InvoiceFilters` type from shared lib types instead
    - Accept `filters`, `setFilters`, `tableInstance` as props (already does, just fix import paths)
    - _Requirements: 1.1, 4.3, 8.1_

  - [ ] 5.6 Create `libs/shared/ui/src/components/invoice/InvoiceDetailDialog.tsx`
    - Copy from inventory app
    - Remove `useInvoicePDFActions` import
    - Accept `onDownloadPDF`, `onPreviewPDF`, `onSendEmail`, `pdfLoading`, and `emailDialog` (ReactNode slot) as props per design
    - Import `SUPPORTED_CURRENCIES` from shared lib types
    - Import `InvoiceContent` and `InvoiceStatusBadge` from sibling paths
    - Use existing `EmailComposerDialog` from `../email/` if needed, or accept `emailDialog` as a render prop
    - _Requirements: 1.3, 4.1, 7.2, 8.1_

  - [ ] 5.7 Create `libs/shared/ui/src/components/invoice/InvoiceDialog.tsx`
    - Copy from inventory app
    - Remove `useUserStore`, `useQuery`, `customerApi` imports
    - Accept `customers`, `onSave`, `saving`, `validationSchema` (optional with default), `invoiceTypes` (optional), `availableStatuses` (optional) as props per design
    - Keep `react-hook-form` and `@hookform/resolvers/zod` imports (shared workspace deps)
    - Bundle a default `invoiceFormSchema` within the file or as a co-located module
    - _Requirements: 1.3, 4.2, 9.1, 9.2, 9.3, 9.4_

- [ ] 6. Create invoice barrel export and wire into shared library
  - [ ] 6.1 Create `libs/shared/ui/src/components/invoice/index.ts`
    - Export all 15 presentational components
    - Export key prop interfaces: `BankAccount`, `BankAccountDetailsProps`, `InvoiceLineItemTableProps`, `InvoiceDetailDialogProps`, `InvoiceDialogProps`
    - _Requirements: 5.2_

  - [ ] 6.2 Update `libs/shared/ui/src/components/index.ts`
    - Add `export * from './common'`
    - Add `export * from './invoice'`
    - _Requirements: 5.3_

- [ ] 7. Checkpoint
  - Ensure the shared library compiles cleanly with all 15 invoice components, 4 common components, types, and utils. Verify no imports reference `apps/inventory/` or `@horizon-sync/store`. Ask the user if questions arise.

- [ ] 8. Update the inventory app to consume from the shared library
  - [ ] 8.1 Update `InvoiceManagement.tsx` orchestrator imports
    - Change imports of `InvoiceDetailDialog`, `InvoiceManagementFilters`, `InvoiceManagementHeader`, `InvoicesTable`, `InvoiceStats` from relative paths to `@horizon-sync/ui` (or `@horizon-sync/ui/components`)
    - Pass new props to `InvoiceDetailDialog`: wire `useInvoicePDFActions` outputs (`onDownloadPDF`, `onPreviewPDF`, `onSendEmail`, `pdfLoading`) and `emailDialog` slot
    - Keep `PaymentDialog` import from `../payments/PaymentDialog` unchanged
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 8.2 Update inventory app type imports
    - In `apps/inventory/src/app/types/invoice.types.ts`, replace local type definitions with re-exports from `@horizon-sync/ui`: `export * from '@horizon-sync/ui'` (only invoice types) or update individual files that import from this path
    - Update `useInvoiceManagement.ts` to import `InvoiceFilters` from `@horizon-sync/ui` instead of defining it locally
    - _Requirements: 2.3, 6.5_

  - [ ] 8.3 Update `RevenuePage.tsx` lazy import
    - The lazy import `import('../components/invoices')` still works since `InvoiceManagement` stays in the inventory app. Verify this path still resolves after cleanup.
    - _Requirements: 6.1_

  - [ ] 8.4 Update any other inventory app files importing from old paths
    - Check and update test files under `apps/inventory/src/test/app/components/invoices/` to import from `@horizon-sync/ui` where they reference migrated components
    - Update `apps/inventory/src/test/app/integration/` test files if they import migrated components directly
    - _Requirements: 6.5_

  - [ ] 8.5 Clean up old inventory app invoice component files
    - Delete the migrated component files from `apps/inventory/src/app/components/invoices/` (all except `InvoiceManagement.tsx`)
    - Update `apps/inventory/src/app/components/invoices/index.ts` to only export `InvoiceManagement` (re-export shared components from `@horizon-sync/ui` if needed for backward compatibility)
    - _Requirements: 6.4_

- [ ] 9. Checkpoint
  - Ensure the inventory app compiles and all existing tests pass. Verify `InvoiceManagement` renders correctly with shared library components. Ask the user if questions arise.

- [ ]\* 10. Write property-based tests for migration correctness
  - [ ]\* 10.1 Write property test: shared components have no app-specific imports
    - **Property 1: Shared components have no app-specific imports**
    - Scan all `.tsx`/`.ts` files in `libs/shared/ui/src/components/invoice/` and `libs/shared/ui/src/components/common/`
    - Assert no file contains import paths matching `apps/inventory/`, `apps/admin/`, or `@horizon-sync/store`
    - Use `fast-check` with `vitest`
    - **Validates: Requirements 1.3, 3.3, 4.7, 7.2**

  - [ ]\* 10.2 Write property test: no stale import paths in consuming app
    - **Property 2: No stale import paths in consuming app**
    - Scan all `.tsx`/`.ts` files in `apps/inventory/src/`
    - Assert no file imports migrated components from old relative `components/invoices/` paths (except `InvoiceManagement` itself)
    - Use `fast-check` with `vitest`
    - **Validates: Requirements 6.5**

  - [ ]\* 10.3 Write property test: shared components make no direct API calls
    - **Property 3: Shared components make no direct API calls**
    - Scan all `.tsx`/`.ts` files in `libs/shared/ui/src/components/invoice/` and `libs/shared/ui/src/components/common/`
    - Assert no file contains `axios.`, `fetch(`, `apiRequest`, or `useQuery` with inline `queryFn`
    - Use `fast-check` with `vitest`
    - **Validates: Requirements 7.3**

  - [ ]\* 10.4 Write property test: render equivalence
    - **Property 4: Render equivalence before and after migration**
    - Generate random valid `Invoice` objects using `fast-check` arbitraries
    - For key components (`InvoiceStatusBadge`, `InvoiceHeader`, `InvoiceDates`, `InvoiceAmountsSummary`), render both the shared version and original version with the same props
    - Assert identical HTML output using `@testing-library/react`
    - **Validates: Requirements 8.1**

- [ ] 11. Final checkpoint
  - Ensure all tests pass, the shared library exports are complete, and the inventory app works end-to-end with the migrated components. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The `InvoiceManagement` orchestrator stays in the inventory app and is NOT migrated
- `PaymentDialog` is out of scope for this migration
- `EmailComposer` already exists in the shared library at `libs/shared/ui/src/components/email/` — reuse it
