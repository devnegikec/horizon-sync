# Requirements Document

## Introduction

This specification covers the migration of invoice UI components from the inventory app (`apps/inventory/src/app/components/invoices/`) into the shared UI library (`libs/shared/ui/`) so that both the inventory app and the admin app can consume them without code duplication. The migration must decouple components from inventory-app-specific hooks, types, utilities, and cross-feature components by introducing a props-driven, dependency-injected API surface.

## Glossary

- **Shared_Library**: The `@horizon-sync/ui` package located at `libs/shared/ui/`, containing reusable UI primitives and components consumed by all frontend apps in the Nx monorepo.
- **Inventory_App**: The frontend application at `apps/inventory/` that currently owns the invoice components.
- **Admin_App**: The frontend application at `apps/admin/` that needs to reuse the invoice components.
- **Invoice_Component**: Any React component currently in `apps/inventory/src/app/components/invoices/` that renders invoice-related UI.
- **Presentational_Component**: A component that receives all data and callbacks via props and has no direct imports of app-specific hooks, API services, or utility modules.
- **Orchestrator_Component**: A component (like `InvoiceManagement`) that wires data-fetching hooks, state, and callbacks together and passes them to Presentational_Components.
- **Common_Component**: A reusable component currently in `apps/inventory/src/app/components/common/` (e.g., `LineItemsDetailTable`, `TaxSummaryCollapsible`, `PartyInfoCard`, `EmailComposer`, `StatCard`) that invoice components depend on.
- **Barrel_Export**: The `index.ts` file that re-exports all public symbols from a module directory.
- **Invoice_Types**: TypeScript type definitions (`Invoice`, `InvoiceLineItem`, `InvoiceStatus`, `InvoiceType`, `PartyDetails`) currently in `apps/inventory/src/app/types/invoice.types.ts`.

## Requirements

### Requirement 1: Identify and classify components for migration

**User Story:** As a developer, I want a clear classification of which invoice components are presentational and which are orchestrators, so that I know which components move to the Shared_Library and which stay in the Inventory_App.

#### Acceptance Criteria

1. THE Migration SHALL classify the following as Presentational_Components eligible for the Shared_Library: `InvoiceStatusBadge`, `InvoiceStats`, `InvoiceHeader`, `InvoiceDates`, `InvoicePartyInfo`, `InvoiceAmountsSummary`, `InvoiceContent`, `InvoiceLineItemTable`, `BankAccountDetails`, `InvoicesTable`, `InvoiceManagementHeader`, `InvoiceManagementFilters`, `InvoiceDetailDialog`, `InvoiceDialog`, `SendInvoiceEmailDialog`.
2. THE Migration SHALL classify `InvoiceManagement` as an Orchestrator_Component that remains in the Inventory_App.
3. WHEN a Presentational_Component currently imports app-specific hooks, API services, or utility functions directly, THE Migration SHALL replace those direct imports with props or callback props before moving the component to the Shared_Library.

### Requirement 2: Extract and co-locate Invoice_Types in the Shared_Library

**User Story:** As a developer, I want invoice-related TypeScript types available in the Shared_Library, so that both apps can import them from a single source of truth.

#### Acceptance Criteria

1. THE Shared_Library SHALL export the following types from a dedicated `types/invoice.types.ts` module: `Invoice`, `InvoiceLineItem`, `InvoiceStatus`, `InvoiceType`, `PartyDetails`, `InvoiceListItem`, `InvoiceResponse`, `InvoiceCreateRequest`, `InvoiceUpdateRequest`, `MarkAsPaidRequest`.
2. THE Shared_Library SHALL export the `InvoiceFilters` type (currently defined in `useInvoiceManagement.ts`) alongside the other invoice types.
3. WHEN the types are moved to the Shared_Library, THE Inventory_App SHALL re-export or import them from `@horizon-sync/ui` instead of maintaining a local copy.
4. THE Shared_Library SHALL also export the `SUPPORTED_CURRENCIES` constant (currently in `apps/inventory/src/app/types/currency.types.ts`) so that currency-dependent components can reference it.

### Requirement 3: Migrate Common_Components that invoice components depend on

**User Story:** As a developer, I want the common helper components used by invoice components to also live in the Shared_Library, so that the migrated invoice components have no remaining imports from the Inventory_App.

#### Acceptance Criteria

1. THE Shared_Library SHALL include the following Common_Components: `LineItemsDetailTable`, `TaxSummaryCollapsible`, `PartyInfoCard` (with its `PartyInfoData` type), `StatCard`.
2. WHEN a Common_Component already exists in the Shared_Library (e.g., `EmailComposer` in `libs/shared/ui/src/components/email/`), THE Migration SHALL reuse the existing Shared_Library version rather than duplicating it.
3. IF a Common_Component imports app-specific utilities (e.g., `formatDate`, `apiRequest`), THEN THE Migration SHALL either move the utility to the Shared_Library or replace the import with a prop/callback.
4. THE `formatDate` utility SHALL be moved to the Shared_Library as a shared utility function, since it is used by multiple components across the invoice module.

### Requirement 4: Decouple Presentational_Components from app-specific dependencies

**User Story:** As a developer, I want each migrated component to accept all external data and behavior through props, so that any consuming app can provide its own data-fetching and business logic.

#### Acceptance Criteria

1. WHEN `InvoiceDetailDialog` is moved to the Shared_Library, THE component SHALL accept PDF action callbacks (`onDownloadPDF`, `onPreviewPDF`, `onSendEmail`) and loading state (`pdfLoading`) as props instead of importing `useInvoicePDFActions` directly.
2. WHEN `InvoiceDialog` is moved to the Shared_Library, THE component SHALL accept a `customers` array prop and an `onSave` callback instead of importing `customerApi` or `useUserStore` directly.
3. WHEN `InvoiceManagementFilters` is moved to the Shared_Library, THE component SHALL accept `filters`, `setFilters`, and `tableInstance` as props without importing `useInvoiceManagement`.
4. WHEN `InvoicesTable` is moved to the Shared_Library, THE component SHALL accept all action callbacks (`onView`, `onDelete`, `onMarkAsPaid`, `onCreatePayment`, `onCreateInvoice`) as props.
5. WHEN `InvoiceContent` is moved to the Shared_Library, THE component SHALL accept a `formatDate` function as a prop or import it from the Shared_Library utility module.
6. WHEN `InvoiceStats` is moved to the Shared_Library, THE component SHALL accept stat values as props and import `StatCard` from the Shared_Library rather than from `../shared`.
7. THE Shared_Library invoice components SHALL have zero imports from `apps/inventory/` paths after migration.

### Requirement 5: Establish the Shared_Library directory structure for invoice components

**User Story:** As a developer, I want a well-organized directory structure in the Shared_Library for invoice components, so that the module is discoverable and follows existing conventions.

#### Acceptance Criteria

1. THE Shared_Library SHALL place migrated invoice components under `libs/shared/ui/src/components/invoice/`.
2. THE Shared_Library SHALL provide a Barrel_Export at `libs/shared/ui/src/components/invoice/index.ts` that exports all public invoice components and types.
3. THE Shared_Library root Barrel_Export (`libs/shared/ui/src/components/index.ts`) SHALL re-export the invoice module via `export * from './invoice'`.
4. WHEN a consuming app imports an invoice component, THE import path SHALL follow the pattern `@horizon-sync/ui/components` or `@horizon-sync/ui` consistent with existing Shared_Library conventions.

### Requirement 6: Update the Inventory_App to consume from the Shared_Library

**User Story:** As a developer, I want the Inventory_App to import invoice components from the Shared_Library after migration, so that there is a single source of truth and no duplicated code.

#### Acceptance Criteria

1. WHEN the migration is complete, THE Inventory_App `InvoiceManagement` Orchestrator_Component SHALL import all Presentational_Components from `@horizon-sync/ui` instead of relative paths.
2. THE Inventory_App SHALL retain its app-specific hooks (`useInvoiceManagement`, `useInvoicePDFActions`) and pass their outputs as props to the Shared_Library components.
3. THE Inventory_App SHALL retain the `PaymentDialog` import from `../payments/PaymentDialog` since it is a cross-feature component not part of this migration scope.
4. WHEN the migration is complete, THE Inventory_App SHALL delete the original `apps/inventory/src/app/components/invoices/` directory (except for any thin wrapper or re-export file if needed for backward compatibility).
5. IF other Inventory_App modules import from the old `components/invoices/` path, THEN THE Migration SHALL update those import paths to use `@horizon-sync/ui`.

### Requirement 7: Enable the Admin_App to consume invoice components

**User Story:** As a developer, I want the Admin_App to be able to import and use invoice components from the Shared_Library, so that the admin dashboard can display invoice data without duplicating UI code.

#### Acceptance Criteria

1. WHEN the Admin_App adds `@horizon-sync/ui` as a dependency (already present in the Nx workspace), THE Admin_App SHALL be able to import any Presentational_Component from the Shared_Library invoice module.
2. THE Shared_Library invoice components SHALL not depend on any Inventory_App-specific state management (e.g., `useUserStore` from `@horizon-sync/store`) for rendering; authentication tokens and user context SHALL be provided by the consuming app through props or React context.
3. THE Shared_Library invoice components SHALL not make direct API calls; all data SHALL be passed in via props.

### Requirement 8: Preserve existing functionality and visual appearance

**User Story:** As a developer, I want the migrated components to behave and look identical to the originals, so that the migration does not introduce regressions.

#### Acceptance Criteria

1. THE migrated Presentational_Components SHALL render identical HTML structure and CSS classes as the original components in the Inventory_App.
2. THE migrated components SHALL continue to use `@horizon-sync/ui/components` UI primitives (`Button`, `Dialog`, `Card`, `Badge`, `DataTable`, etc.) for consistent styling.
3. WHEN the Inventory_App renders the invoice management page after migration, THE page SHALL display the same layout, data, interactions, and visual appearance as before the migration.
4. IF a component uses icons from `lucide-react`, THEN THE migrated component SHALL continue to import icons from `lucide-react` (already a shared dependency).

### Requirement 9: Handle the `InvoiceDialog` form dependencies

**User Story:** As a developer, I want the `InvoiceDialog` component to work in the Shared_Library without depending on inventory-app-specific form validation schemas or API query hooks, so that any app can provide its own validation and data.

#### Acceptance Criteria

1. WHEN `InvoiceDialog` is moved to the Shared_Library, THE component SHALL accept a `validationSchema` prop (Zod schema) or use a default schema bundled with the Shared_Library.
2. WHEN `InvoiceDialog` is moved to the Shared_Library, THE component SHALL accept a `customers` prop (array of `{ id: string; customer_name: string }`) instead of fetching customers via `useQuery` and `customerApi`.
3. THE `InvoiceDialog` component SHALL continue to use `react-hook-form` with `@hookform/resolvers/zod` since these are shared workspace dependencies.
4. IF the consuming app needs to customize available invoice types or statuses, THEN THE `InvoiceDialog` SHALL accept optional `invoiceTypes` and `availableStatuses` props with sensible defaults.
