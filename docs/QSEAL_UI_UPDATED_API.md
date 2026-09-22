## 🔧 What Was Built

When you create a QR block with `master_pack_enabled: true`:

```json
{
    "batch": "Batch-Tim-786",
    "quantity": 10,
    "qr_type": "D",
    "sr_number_type": "R6DAN",
    "qr_image": true,
    "master_pack_enabled": true,
    "master_pack_size": 5
}
```

The system now automatically:

1. Creates 10 individual `ProductItem` QR codes (as before)
2. Groups them into `quantity / master_pack_size` = **2 parent QSeal nodes**
3. Each parent is a `QSealTrack` (shipper type) with capacity = 5
4. Each `ProductItem` gets a `QSealParameters` entry linked to its parent
5. The block's `extra_data` stores `qseal_parent_count`

---

## 📡 New APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/qseal/blocks/{block_id}/parents` | List all parent QSeal nodes for a block |
| `GET` | `/qseal/blocks/{block_id}/parents/download` | Download Excel with parent QR codes |

---

## 📁 Files Changed

| File | Change |
|------|--------|
| `app/models/qr_block.py` | Added `master_pack_enabled`, `master_pack_size` columns |
| `app/schemas/qr_product.py` | Added fields to `QRBlockCreate` + `QRBlockResponse` |
| `app/services/qr_product_service.py` | Added `_create_qseal_parents()` — called during block generation |
| `app/services/qseal_service.py` | Added `get_parents_by_block()`, `get_parents_excel()` |
| `app/api/v1/endpoints/qseal.py` | Added 2 block-based parent endpoints |

---

## 🚀 Railway Status

**Deploying:** `● Online · Initializing` — the build is in progress at Railway. Once live, the migration will auto-run and the APIs will be available at:

```
https://core-service-production-66e9.up.railway.app/api/v1/qseal/blocks/{blockId}/parents
https://core-service-production-66e9.up.railway.app/api/v1/qseal/blocks/{blockId}/parents/download
```

Made changes.
