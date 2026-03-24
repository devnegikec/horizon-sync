# QSeal Feature — Incremental Task List

## Phase 1 — Foundation (DONE ✅)

- [x] QSeal types (`qseal.types.ts`)
- [x] Mock data (`qseal.mock.ts`)
- [x] `useQSealProducts` hook (mock-backed, paginated, filterable)
- [x] `useQSealManagement` hook (orchestration, stats, dialogs)
- [x] `QSealStats` — 4 stat cards (total, active, QR codes, scans)
- [x] `QSealHeader` — title, refresh, new product button, credit info display
- [x] `QSealFilters` — search, status filter, QR type filter
- [x] `QSealTable` — full DataTable with columns, actions dropdown, empty/loading states
- [x] `QSealProductDialog` — create/edit form (code, name, category, QR type, description)
- [x] `QSealDetailDialog` — read-only detail view with metrics and activation progress bar
- [x] `QSealManagement` — orchestrator component
- [x] `app.tsx` — QSeal tab wired up with QrCode icon

## Phase 2 — Real API Integration

- [ ] Create `apps/inventory/src/app/utility/api/qseal.ts` — API utility (list, getById, create, update, toggleStatus)
- [ ] Update `useQSealProducts` to call real API (swap mock `setTimeout` for `fetch`)
- [ ] Update `useQSealManagement.handleSaveProduct` to call create/update API
- [ ] Implement `onToggleStatus` in `QSealManagement` (currently logs to console)
- [ ] Add `useToast` feedback on save/toggle success and errors

## Phase 3 — Block Management

- [ ] Add `QSealBlock` types (already in `qseal.types.ts`)
- [ ] Create `QSealBlocksTab.tsx` — list blocks for a product (inside detail dialog as a tab)
- [ ] Create `CreateBlockDialog.tsx` — form to create a new block (QR type, quantity)
- [ ] Add Tabs to `QSealDetailDialog` (Overview | Blocks)
- [ ] Hook: `useQSealBlocks(productId)` — fetch blocks for a product
- [ ] Hook: `useCreateQSealBlock` — create block, deduct from credit quota

## Phase 4 — QR Credit Quota UI

- [ ] Add credit usage progress bar to `QSealHeader` (mobile-visible)
- [ ] Warn when remaining credits < 20% (amber) or < 10% (red)
- [ ] Show credit reset date in tooltip
- [ ] Wire credit info to real API endpoint when available

## Phase 5 — Activation & Scan Analytics

- [ ] Add `ActivationTab` inside product detail — list activated QR codes
- [ ] Add `ScanHistoryTab` — scan count by date (simple table, no chart yet)
- [ ] Add scan count sparkline to table row (optional enhancement)

## Phase 6 — Campaign Integration (future)

- [ ] Link QSeal products to campaigns (Scan2Win, Feedback2Win)
- [ ] Show active campaign badge on product row
- [ ] Navigate to campaign detail from product detail

---

## Notes

- All mock data lives in `apps/inventory/src/app/data/qseal.mock.ts`
- Auth token comes from `useUserStore((s) => s.accessToken)` — same as all other hooks
- API base: `environment.apiCoreUrl` (`http://localhost:8001/api/v1`)
- QSeal API base will be: `${environment.apiCoreUrl}/products` (confirm with backend)
- No Brand entity — products belong directly to the organization
