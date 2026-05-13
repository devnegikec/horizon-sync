## 1. Items (Create / Edit)

| Field                   | Type   | Required                | Validation Rules                                 |
| ----------------------- | ------ | ----------------------- | ------------------------------------------------ |
| `item_name`             | string | ⚠️ Yes                  | min: 1 char, max: 255 chars                      |
| `description`           | string | No                      | max: 1000 chars                                  |
| `item_group_id`         | UUID   | No                      | Must be valid item group (dropdown)              |
| `item_type`             | string | Yes (default: "stock")  | Allowed: stock, service, fixed_asset, consumable |
| `uom` (Unit of Measure) | string | Yes (default: "Nos")    | max: 50 chars                                    |
| `status`                | string | Yes (default: "ACTIVE") | Allowed: ACTIVE, INACTIVE                        |
