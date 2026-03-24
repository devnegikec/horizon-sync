# Data Models

## Tenant / Multi-Tenancy

### `Client` (dashboard — public schema)

Root tenant object. Each client maps to a PostgreSQL schema.

| Field         | Type   | Notes                               |
| ------------- | ------ | ----------------------------------- |
| `schema_name` | string | PostgreSQL schema identifier        |
| `domain_url`  | string | Subdomain for tenant routing        |
| `name`        | string | Company name                        |
| `industry`    | choice | apparel, luxury, pharma, FMCG, etc. |
| `paid_until`  | date   | Subscription expiry                 |
| `on_trial`    | bool   | Trial status                        |
| `status`      | choice | ACTIVE / SUSPENDED / TERMINATED     |
| `timezone`    | string | Tenant timezone                     |

---

## Product Ecosystem

### `Brand`

Top-level brand entity within a tenant.

| Field                        | Notes                                 |
| ---------------------------- | ------------------------------------- |
| `name`                       | Brand display name                    |
| `short_code`                 | Used in file paths and URL generation |
| `public_key` / `private_key` | For signature verification            |

### `Product`

A product line belonging to a brand.

- Has `QRActivationParameters` for QR settings (manufacturing date, expiry, activation rules)
- Has many `Order` records

### `Order`

A batch order for generating QR codes.

- Belongs to `Product`
- Has many `ProductItem` records (individual units)

### `ProductItem`

An individual serialized product unit.

| Field           | Notes                       |
| --------------- | --------------------------- |
| `serial_number` | Unique identifier           |
| `qr_code`       | Generated QR                |
| `is_activated`  | Activation status           |
| `scan_count`    | Number of times scanned     |
| `certificate`   | Linked `ProductCertificate` |

### `QRActivationTrack`

Tracks hierarchical (cascade) QR scan events. Supports parent-child QR relationships for supply chain traceability.

---

## Campaign & Engagement

### `Campaign`

A marketing campaign tied to a brand.

| Type Code | Name          |
| --------- | ------------- |
| `SW`      | Scan2Win      |
| `FW`      | Feedback2Win  |
| `PW`      | Play2Win      |
| `CW`      | Custom2Win    |
| `MLQ`     | Multi-link QR |

Key fields: `coupon_deliver` (SMS/WhatsApp/both), `denominations`, `sms_template`, `whatsapp_template_name`, campaign images.

### `webCampaign`

Web-based campaign variant (separate from QR-triggered campaigns).

### `Lead`

A customer who interacted with a campaign.

| Field                  | Notes                               |
| ---------------------- | ----------------------------------- |
| `mobilenumber`         | Primary identifier                  |
| `name`, `email`, `dob` | Profile data                        |
| `tags`                 | M2M to `Tags` for segmentation      |
| `redeem_mode`          | None / Online / Offline / Brandwise |

### `Tags`

Segmentation labels for leads. Used to target messaging campaigns.

Supported channels: SMS, WhatsApp, RCS, Email, Meta.

---

## Coupon System

### `Coupon`

A coupon issued to a lead from a campaign.

| Field                          | Notes                               |
| ------------------------------ | ----------------------------------- |
| `campaign`                     | FK to `Campaign`                    |
| `coupon`                       | Coupon code string                  |
| `value` / `units`              | Denomination (₹, %, Points, etc.)   |
| `used`                         | Redemption status                   |
| `expiry`                       | Expiry datetime                     |
| `is_unlocked` / `unlock_count` | Unlock tracking                     |
| `final_billed_amount`          | Actual billed amount at redemption  |
| `redeem_mode`                  | None / Online / Offline / Brandwise |
| `acception_id`                 | External acceptance reference       |

### `CouponUnlockLog`

Audit trail for coupon operations.

Actions: `REDEEM_ATTEMPT`, `REDEEM_SUCCESS`, `UNLOCK_REQUEST`, `UNLOCK_SUCCESS`

### `ExternalCoupon`

Coupons issued via web campaigns (not QR-triggered). Includes IP address, city, zipcode.

### `CouponDuration`

Configures cooling periods per campaign type (1–90 days).

### `ShopifyCoupon`

Shopify integration config per brand — API endpoint, auth token, price rules.

---

## Messaging & Communication

### `Message_template`

Reusable templates for SMS, WhatsApp, RCS, and Email.

| Field                    | Notes                                 |
| ------------------------ | ------------------------------------- |
| `messsage_type`          | WS / SMS / EMAIL                      |
| `template_type`          | Plain Text / Rich Media / Interactive |
| `dlt_template_id`        | DLT compliance (India)                |
| `mobtexting_template_id` | Mobtexting provider ID                |
| `sender_id`              | SMS sender ID                         |
| `CTA_button1/2`          | Call-to-action buttons                |
| `QR_button1/2/3`         | Quick reply buttons                   |

### `ScheduleMessage`

Scheduled bulk message jobs.

### `RcsMessage` / `RcsCredential`

RCS message records and provider credentials.

### `SMSReport` / `WhatsappReport` / `RCSReport`

Delivery tracking per message per lead.

### `MessageSummary` / `MsgSummaryUsed`

Aggregated message usage stats.

---

## Warranty

### `Warranty`

Warranty registration record.

| Field                              | Notes                            |
| ---------------------------------- | -------------------------------- |
| `product_item`                     | FK to `ProductItem`              |
| `customer_name`, `mobile`, `email` | Customer info                    |
| `purchase_date`                    | Date of purchase                 |
| `expiry_date`                      | Calculated from `WarrantyPeriod` |

### `WarrantyPeriod`

Configurable warranty durations (in months). One can be set as default.

---

## Certificates

### `CertificateTemplate`

Template for generating PDF certificates (e.g., training certificates).

### `CertificateRecipient`

Individual certificate issued to a person.

| Field         | Notes                       |
| ------------- | --------------------------- |
| `cert_id`     | Unique certificate ID       |
| `name`        | Recipient name              |
| `valid_till`  | Validity date               |
| `certificate` | FK to `CertificateTemplate` |

### `CertificateAsyncdownload`

Tracks async bulk certificate generation jobs. Status: pending → completed → Expired.

---

## POS / Retail

### `Store`

Physical retail store.

### `StorePOSBill`

POS transaction record.

### `StorePOSPurchaseItem`

Line items within a POS bill.

### `StorePOSPayment`

Payment record for a POS bill.

---

## Quality Reports

### `QReport` / `QSection`

Quality report templates with sections and approval workflow.

### `ReportTemplate`

Assignment of report templates to products/orders.

---

## Analytics

### `MetaCampaign`

Meta (Facebook) campaign performance data.

### `NFT`

NFT-linked product records.

---

## Tenant Data

### `TenantData`

Stores onboarding info for new tenants (company, industry, contact, trial expiry).
