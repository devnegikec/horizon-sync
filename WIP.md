


```

```

```

```


Ran terminal command:  npx eslint "apps/inventory/src/app/components/wms/PutAwayDetailDialog.tsx" "apps/inventory/src/app/components/wms/PutAwayExceptionDialog.tsx" "apps/inventory/src/app/components/wms/apiErrorFields.tsx" "apps/inventory/src/app/components/wms/flagReasonCodes.ts" "apps/inventory/src/app/hooks/useExceptionReasons.ts" "apps/inventory/src/app/components/wms/receiving-slips" "apps/inventory/src/app/components/wms/shortage" 2>&1 | tail -30 && echo "=== LINT DONE ===" && npx tsc -p apps/inventory/tsconfig.app.json --noEmit 2>&1 | tail -20 && echo "=== TSC DONE ==="

One complexity error from duplicated JSX — extracting a small wrapper:




```

```
Now the exception-view grouping. First the pure module:

Created




```

```
Now updating the exception queue to group by SKU + batch:




```

```


Ran terminal command:  npx eslint "apps/inventory/src/app/components/wms/InboundExceptionQueue.tsx" "apps/inventory/src/app/components/wms/exceptionGroups.ts" "apps/inventory/src/app/components/wms/PutAwayDetailDialog.tsx" "apps/inventory/src/app/components/wms/PutAwayExceptionDialog.tsx" 2>&1 | tail -30 && echo "=== LINT DONE ===" && npx tsc -p apps/inventory/tsconfig.app.json --noEmit 2>&1 | tail -20 && echo "=== TSC DONE ==="

Read , lines 58 to 80

Read , lines 78 to 89

Ran terminal command:  grep -n "isResolvedStatus\|^import\|^} from" apps/inventory/src/app/components/wms/InboundExceptionQueue.tsx | head -30 && echo "--- re-run tsc ---" && npx tsc -p apps/inventory/tsconfig.app.json --noEmit 2>&1 | tail -20 && echo "=== TSC DONE ==="

Ran terminal command:  find . -name "exceptionGroups*" -not -path "*/node_modules/*" && echo "--- head of file ---" && sed -n '1,40p' apps/inventory/src/app/components/wms/exceptionGroups.ts && echo "--- exports ---" && grep -n "^export" apps/inventory/src/app/components/wms/exceptionGroups.ts && echo "--- wc ---" && wc -l apps/inventory/src/app/components/wms/exceptionGroups.ts

The disk and editor views disagreed — let me re-check.

Ran terminal command:  grep -n "^export" apps/inventory/src/app/components/wms/exceptionGroups.ts && echo "--- tsc ---" && npx tsc -p apps/inventory/tsconfig.app.json --noEmit 2>&1 | tail -20 && echo "=== TSC DONE ==="

The earlier edit never reached disk. Re-applying it:




```

```


Ran terminal command:  grep -n "^export" apps/inventory/src/app/components/wms/exceptionGroups.ts && echo "--- tsc ---" && npx tsc -p apps/inventory/tsconfig.app.json --noEmit 2>&1 | tail -20 && echo "=== TSC DONE ===" && npx eslint "apps/inventory/src/app/components/wms/InboundExceptionQueue.tsx" "apps/inventory/src/app/components/wms/exceptionGroups.ts" 2>&1 | tail -20 && echo "=== LINT DONE ==="

tsc and lint green. Now tests for the new pure logic:

Created




```

```


Created

Ran terminal command:  npx jest --config apps/inventory/jest.config.cjs --silent "exceptionGroups|putAwayExceptionRequest" 2>&1 | tail -30

19 new tests pass. Final full verification:

Ran terminal command:  npx eslint "apps/inventory/src/app/components/wms/PutAwayExceptionDialog.tsx" "apps/inventory/src/app/components/wms/PutAwayDetailDialog.tsx" "apps/inventory/src/app/components/wms/exceptionGroups.ts" "apps/inventory/src/app/components/wms/InboundExceptionQueue.tsx" "apps/inventory/src/app/components/wms/flagReasonCodes.ts" "apps/inventory/src/app/components/wms/apiErrorFields.tsx" "apps/inventory/src/app/components/wms/__tests__" "apps/inventory/src/app/components/wms/receiving-slips" "apps/inventory/src/app/components/wms/shortage" "apps/inventory/src/app/hooks/useExceptionReasons.ts" "apps/inventory/src/app/hooks/useWMS.ts" 2>&1 | tail -30 && echo "=== LINT DONE ===" && npx tsc -p apps/inventory/tsconfig.app.json --noEmit 2>&1 | tail -10 && echo "=== TSC DONE ===" && npx jest --config apps/inventory/jest.config.cjs --silent 2>&1 | tail -8

Ran terminal command:  git show HEAD:apps/inventory/src/app/hooks/useWMS.ts | npx eslint --stdin --stdin-filename apps/inventory/src/app/hooks/useWMS.ts 2>&1 | tail -8

Completed: *Add put-away exception API + types* (1/7)

All green: **lint 0 errors** (3 pre-existing `useWMS.ts` warnings, identical at HEAD), **tsc clean**, **37 suites / 366 tests passing** (+19 new).

## What was built

**`PutAwayExceptionDialog`** (`components/wms/`) — reuses the receipt exception contract: classification (damaged / excess / hold / quarantine — no `short`, since a shortage is stock that never arrived), a reason code filtered to the classification's category, a segregation destination prefilled from the reason's `default_destination`, and a note. Errors are routed per §4.4: field errors under the inputs, `REASON_CODE_INVALID` refetches the reference list and forces a new pick, 404 refreshes and closes, 0/5xx get a retry.

**`PutAwayDetailDialog`** — an amber **Exception** action on both master-pack rows and individual unit rows. Pack rows previously rendered nothing in Actions; they now offer the pack-scoped exception. Finished/read-only units stay untouched, and a unit the API returned without an id gets no action (its id would have been synthetic). Gated on `inbound_exception.create`.

**Exception queue grouping** (`exceptionGroups.ts`) — the Hold & Quarantine table now collapses rows sharing **SKU + batch** into one expandable group showing summed quantity, distinct reasons and destinations, and the shared status (*Mixed* when members disagree). Groups of one render exactly as before, so the common case is unchanged. The group checkbox is tri-state and bulk-disposes by walking the member ids, since `bulk-disposition` is keyed per exception.

I also removed real duplication this exposed: `useExceptionReasons` (a shared hook), `flagReasonCodes` (category filtering + next-valid-code), and `apiErrorFields` — `FlagLineDialog` now uses all three; `shortageShared` re-exports so its consumers were untouched.

## The one thing I need you to confirm

You picked the endpoint name but no spec exists, so **I designed the payload** — mirroring the documented classify contract plus an explicit scope:

```
POST /api/v1/put-away/{list_id}/items/{item_id}/exception
{ "classification": "damaged", "reason_code": "DAMAGED",
  "destination": "QUARANTINE", "note": "…",
  "scope": "pack", "item_ids": ["<put-away item id>", …] }
→ 201 InboundException
```

- `item_id` is the put-away item id for `scope: "item"`, the **master pack's q-seal id** for `scope: "pack"` (one exception for the whole pack, as you chose).
- `item_ids` always lists every covered unit, so a pack request doesn't depend on the backend re-deriving pack membership.
- The response reuses `InboundException`, so the queue renders it with no mapping.

Everything is centralised in `putAwayApi.raiseException` + `PutAwayExceptionRequest`, so if your backend differs it's a one-function change. Please confirm or paste the real spec.

Two smaller decisions to sanity-check:

1. **Permission gate is `inbound_exception.create`** (documented for "Classify (create exception)"), not `inbound_exception.dispose`. You said "warehouse manager" — if you want it manager-only, say so and I'll switch the gate.
2. **The legacy flat payload has no pack identity**, so pack-level exceptions are only offered on the grouped shape; legacy lists get unit-level exceptions only.

Still outstanding from before: `core.ts` pre-existing complexity errors will block a normal commit, `CloseShortageDialog` still has its own reasons fetch (now the last copy), and `openapi.json` at the repo root is stale — it doesn't contain the put-away or exception endpoints at all.

Made changes.
