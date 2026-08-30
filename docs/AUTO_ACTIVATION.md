Completed: *Frontend: types + service + hook* (4/6)

I've implemented all three requests across backend and frontend.

## 1. Auto-link API + button

**Backend**
- `POST /api/v1/qseal/blocks/{block_id}/auto-link` (in qseal.py) → `QSealService.auto_link_block()` (in qseal_service.py).
- Validates the block is `completed`, accepts an optional `master_pack_size`, groups the block's `ProductItem`s into chunks, creates a `QSealTrack` (shipper) parent per chunk and a `QSealParameters` link per unit. Re-running is idempotent (previous links + orphaned parents are cleaned up).

**Frontend**
- `qrBlockService.autoLinkBlock()` + `QSealAutoLinkResponse` type.
- A **"Master Pack Aggregation"** panel with an **Auto-link (Cascade)** button in BlockDetailDialog.tsx, including a pack-size input (so blocks created *without* cascade can still be linked) and it refreshes the block afterwards via the new `refetch()` on `useBlockStatus`.

## 2. Aggregation log

- **Backend:** `GET /api/v1/qseal/aggregation` (optional `block_id` filter) → `QSealService.list_aggregation()` returns one row per generated unit with its parent link, activation state, scan count, and per-parent pack-fill (`linked_count/capacity`) so wrong/missing aggregations are visible.
- **Frontend:** new **Aggregation** tab in QSealPage.tsx → `AggregationManagement.tsx`.

## 3. Table implementation

`AggregationManagement.tsx` follows the `ItemsTable.tsx` / `BlockItemsTable` pattern — `@tanstack/react-table` `ColumnDef`s rendered through the shared `DataTable`/`DataTableColumnHeader` with server-side pagination.

## Files changed

**Backend** (core-service)
- `app/schemas/qseal.py` — new `QSealAutoLinkRequest/Response`, `QSealAggregationItem/Response`
- `app/services/qseal_service.py` — `auto_link_block()`, `list_aggregation()`
- `app/api/v1/endpoints/qseal.py` — 2 new endpoints

**Frontend** (inventory)
- `features/qr-management/types/qrBlock.types.ts` — new types
- `features/qr-management/services/qrBlockService.ts` — `autoLinkBlock`, `getAggregation`
- `features/qr-management/hooks/useBlockStatus.ts` — added `refetch`
- `components/qseal/BlockDetailDialog.tsx` — auto-link panel + pack-size input
- `components/qseal/AggregationManagement.tsx` — new table view
- `components/qseal/index.ts`, `pages/QSealPage.tsx` — export + nav wiring

All backend files pass syntax check and all new/changed frontend files report no errors (the only remaining warnings in BlockDetailDialog.tsx are pre-existing lint/style complaints in code I didn't touch).

Made changes.
