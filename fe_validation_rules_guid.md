## 1. Items (Create / Edit)

| Field                   | Type   | Required                | Validation Rules                                 |
| ----------------------- | ------ | ----------------------- | ------------------------------------------------ |
| `item_name`             | string | ⚠️ Yes                  | min: 1 char, max: 255 chars                      |
| `description`           | string | No                      | max: 1000 chars                                  |
| `item_group_id`         | UUID   | No                      | Must be valid item group (dropdown)              |
| `item_type`             | string | Yes (default: "stock")  | Allowed: stock, service, fixed_asset, consumable |
| `uom` (Unit of Measure) | string | Yes (default: "Nos")    | max: 50 chars                                    |
| `status`                | string | Yes (default: "ACTIVE") | Allowed: ACTIVE, INACTIVE                        |

## 2. Warehouses (Create / Edit)

**Source**: `core-service/app/schemas/warehouse.py` → `WarehouseCreate`, `WarehouseUpdate`

### Basic Information

| Field                 | Type   | Required                   | Validation Rules                            |
| --------------------- | ------ | -------------------------- | ------------------------------------------- |
| `name`                | string | ⚠️ Yes                     | min: 1 char, max: 255 chars                 |
| `code`                | string | ⚠️ Yes                     | min: 1 char, max: 50 chars                  |
| `description`         | string | No                         | max: 1000 chars                             |
| `warehouse_type`      | string | Yes (default: "warehouse") | Allowed: warehouse, store, virtual, transit |
| `parent_warehouse_id` | UUID   | No                         | Dropdown from existing warehouses           |

### Address

| Field           | Type   | Required | Validation Rules |
| --------------- | ------ | -------- | ---------------- |
| `address_line1` | string | No       | max: 255 chars   |
| `address_line2` | string | No       | max: 255 chars   |
| `city`          | string | No       | max: 100 chars   |
| `state`         | string | No       | max: 100 chars   |
| `postal_code`   | string | No       | max: 20 chars    |
| `country`       | string | No       | max: 100 chars   |

### Contact

| Field           | Type   | Required | Validation Rules                           |
| --------------- | ------ | -------- | ------------------------------------------ |
| `contact_name`  | string | No       | max: 255 chars                             |
| `contact_phone` | string | No       | max: 50 chars                              |
| `contact_email` | string | No       | max: 255 chars, must be valid email format |

### Capacity

| Field            | Type    | Required | Validation Rules |
| ---------------- | ------- | -------- | ---------------- |
| `total_capacity` | integer | No       | Must be ≥ 0      |
| `capacity_uom`   | string  | No       | max: 50 chars    |

### Accounting & Status

| Field              | Type    | Required            | Validation Rules                |
| ------------------ | ------- | ------------------- | ------------------------------- |
| `stock_account_id` | UUID    | No                  | Dropdown from chart of accounts |
| `is_active`        | boolean | No (default: true)  | Checkbox                        |
| `is_default`       | boolean | No (default: false) | Checkbox                        |

---

## 3. Item Groups (Create / Edit)

**Source**: `core-service/app/schemas/item_group.py` → `ItemGroupCreate`, `ItemGroupUpdate`

| Field                      | Type    | Required           | Validation Rules                         |
| -------------------------- | ------- | ------------------ | ---------------------------------------- |
| `name`                     | string  | ⚠️ Yes             | min: 1 char, max: 255 chars              |
| `code`                     | string  | No                 | min: 1 char (if provided), max: 50 chars |
| `description`              | string  | No                 | max: 1000 chars                          |
| `parent_id`                | UUID    | No                 | Dropdown from existing item groups       |
| `default_valuation_method` | string  | No                 | Allowed: FIFO, LIFO, Moving_Average      |
| `default_uom`              | string  | No                 | max: 50 chars                            |
| `sales_tax_template_id`    | UUID    | No                 | Dropdown from tax templates              |
| `purchase_tax_template_id` | UUID    | No                 | Dropdown from tax templates              |
| `is_active`                | boolean | No (default: true) | Checkbox                                 |

---

## 4. Stock Entries (Create / Edit)

**Source**: `core-service/app/schemas/stock_entry.py` → `StockEntryCreate`, `StockEntryUpdate`

### Stock Entry Header

| Field                | Type     | Required               | Validation Rules                                                                  |
| -------------------- | -------- | ---------------------- | --------------------------------------------------------------------------------- |
| `stock_entry_no`     | string   | No (auto-generated)    | min: 1 char (if provided), max: 100 chars                                         |
| `stock_entry_type`   | string   | ⚠️ Yes                 | Allowed: material_receipt, material_issue, material_transfer, manufacture, repack |
| `from_warehouse_id`  | UUID     | Conditional            | Required for material_issue, material_transfer                                    |
| `to_warehouse_id`    | UUID     | Conditional            | Required for material_receipt, material_transfer                                  |
| `posting_date`       | datetime | ⚠️ Yes                 | Must be valid date                                                                |
| `posting_time`       | string   | No                     | max: 10 chars (format: HH:MM)                                                     |
| `status`             | string   | Yes (default: "draft") | Allowed: draft, submitted, cancelled                                              |
| `reference_type`     | string   | No                     | max: 50 chars                                                                     |
| `reference_id`       | UUID     | No                     | Valid reference UUID                                                              |
| `remarks`            | string   | No                     | max: 1000 chars                                                                   |
| `total_value`        | decimal  | No                     | Computed field                                                                    |
| `expense_account_id` | UUID     | No                     | Dropdown from accounts                                                            |
| `cost_center_id`     | UUID     | No                     | Dropdown                                                                          |

### Stock Entry Items (Line Items)

| Field                 | Type             | Required    | Validation Rules                |
| --------------------- | ---------------- | ----------- | ------------------------------- |
| `item_id`             | UUID             | ⚠️ Yes      | Must select valid item          |
| `source_warehouse_id` | UUID             | Conditional | Required for issue/transfer     |
| `target_warehouse_id` | UUID             | Conditional | Required for receipt/transfer   |
| `qty`                 | decimal          | ⚠️ Yes      | Must be > 0 (strictly positive) |
| `uom`                 | string           | ⚠️ Yes      | min: 1 char, max: 50 chars      |
| `basic_rate`          | decimal          | No          | If provided, must be ≥ 0        |
| `valuation_rate`      | decimal          | No          | If provided, must be ≥ 0        |
| `batch_no`            | string           | No          | max: 100 chars                  |
| `serial_nos`          | array of strings | No          | Each serial number as string    |
| `description`         | string           | No          | max: 1000 chars                 |
| `extra_data`          | dict             | No          | Free text                       |

### Business Rules

- At least 1 line item is required
- `from_warehouse_id` is required when `stock_entry_type` is "material_issue" or "material_transfer"
- `to_warehouse_id` is required when `stock_entry_type` is "material_receipt" or "material_transfer"

---

## 5. Customers (Create / Edit)

**Source**: `core-service/app/schemas/customer.py` → `CustomerCreate`, `CustomerUpdate`

| Field                 | Type    | Required                | Validation Rules                           |
| --------------------- | ------- | ----------------------- | ------------------------------------------ |
| `customer_name`       | string  | ⚠️ Yes                  | min: 1 char, max: 255 chars                |
| `customer_code`       | string  | No                      | max: 50 chars                              |
| `email`               | string  | No                      | max: 255 chars, must be valid email format |
| `phone`               | string  | No                      | max: 50 chars                              |
| `address`             | string  | No                      | max: 1000 chars                            |
| `address_line1`       | string  | No                      | max: 255 chars                             |
| `address_line2`       | string  | No                      | max: 255 chars                             |
| `city`                | string  | No                      | max: 100 chars                             |
| `state`               | string  | No                      | max: 100 chars                             |
| `postal_code`         | string  | No                      | max: 20 chars                              |
| `country`             | string  | No                      | max: 100 chars                             |
| `tax_number`          | string  | No                      | max: 50 chars                              |
| `status`              | string  | Yes (default: "active") | Allowed: active, inactive, blocked         |
| `credit_limit`        | decimal | No (default: 0)         | Must be ≥ 0                                |
| `outstanding_balance` | decimal | No (default: 0)         | Must be ≥ 0                                |
