# External Integrations

## SMS — Mobtexting

Provider: [Mobtexting](https://mobtexting.com)
Location: `app/certgen/mobtexting/`

- `client.py` — HTTP client for the Mobtexting API
- `verify.py` — OTP verification via SMS
- DLT compliance: templates require `dlt_template_id` and `dlt_principal_entity_id` (India regulatory requirement)
- Sender ID management per campaign
- Delivery reports via SMS webhook (`POST /api/v1/sms_webhooks/`)

---

## WhatsApp — Meta Cloud API

Location: `app/integration/whatsapp_view.py`, `app/certgen/whatsappsms.py`

- WhatsApp Business API (Meta Cloud API)
- Template types: Plain Text, Rich Media, Interactive
- Media types: Image, Video, Document, Audio
- Interactive types: Call-to-Action (CTA), Quick Reply (QR)
- Dynamic variable substitution in templates
- Bulk campaign support
- Delivery/read receipt webhook (`POST /api/v1/whatsapp_webhooks/`)
- Scheduled bulk sends via Celery (every hour)

---

## RCS — Rich Communication Services

Location: `app/integration/rcs_views.py`

- RCS message templates with `RcsTemplate` model
- Provider credentials stored in `RcsCredential`
- Delivery tracking via `RCSReport`
- Webhook integration for delivery events
- Scheduled sends via Celery (every hour)

---

## Shopify

Location: `app/integration/shopify_manage.py`, `app/integration/shopify_task.py`

Functions:

- `get_token()` — OAuth token retrieval
- `push_coupon()` — Create discount codes in Shopify
- `push_price_rules()` — Create price rules
- `process_page_data()` / `process_sales_records()` — Process order data
- `pull_sales_data()` — Pull sales from Shopify API

Celery task: `sync_shopify_orders_all_tenants` — runs daily at 1 AM IST (19:30 UTC)

Config stored in `ShopifyCoupon` model per brand.

---

## Firebase / Google Cloud

Location: `app/certgen/google-services.json`, `app/integration/models.py`

- **Google Cloud Storage** — stores QR images, certificates, ZIP files, media uploads
  - Bucket: `ciphercode-d9982.appspot.com`
  - Signed URLs with 5-minute expiry for secure downloads
- **Firebase Firestore** — real-time data storage
- Service account: `google-services.json`

---

## Meta (Facebook) Campaigns

Location: `app/integration/meta_campaign_view.py`

- Campaign performance data pulled from Meta API
- Stored in `MetaCampaign` model
- Celery task syncs every 2 hours: `meta_campaign_performance_schemas`

---

## Email — Gmail SMTP

- Backend: `django.core.mail.backends.smtp.EmailBackend`
- Gmail SMTP
- HTML emails via `EmailMultiAlternatives`
- Used for: OTP delivery, brand trust report emails, notifications

---

## Matomo Analytics

Location: `app/integration/matmo_dashboard.py`

- Event tracking for QR scans, product activations, feedback submissions
- Brand-specific tracking IDs
- `track_matomo_event()` utility function
- Client-side JS: `app/certgen/static/js/matamo_qreach.js`

---

## Signature Verification

Location: `app/brandwise/utility.py`

- ECDSA-based signature verification for secure API calls
- `signature_verification()` validates request authenticity
- Uses brand `public_key` / `private_key` pair
