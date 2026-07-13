# Async Tasks & Scheduled Jobs

## Celery Setup

- App: `TenantAwareCeleryApp` from `tenant_schemas_celery`
- Broker: RabbitMQ
- All scheduled tasks iterate over tenant schemas automatically
- Skips `public` and `cii` schemas

---

## Scheduled Jobs (Celery Beat)

| Schedule                   | Task                                  | Description                                 |
| -------------------------- | ------------------------------------- | ------------------------------------------- |
| Daily 00:00                | `reset_remaining_jobs_in_all_schemas` | Reset daily job counters across all tenants |
| Daily 01:00                | `point_sales_report_schemas`          | Generate POS sales reports                  |
| Daily 23:30                | `schedule_daily_report_schemas`       | Process daily scheduled message reports     |
| Monday 07:30               | `schedule_weekly_report_schemas`      | Process weekly scheduled message reports    |
| 1st of month 07:30         | `schedule_monthly_report_schemas`     | Process monthly scheduled message reports   |
| Every 2 hours              | `meta_campaign_performance_schemas`   | Sync Meta campaign performance data         |
| Every hour                 | `whatsapp_jobs_schemas`               | Process queued WhatsApp message jobs        |
| Every hour                 | `sms_jobs_schemas`                    | Process queued SMS message jobs             |
| Daily 19:30 UTC (1 AM IST) | `sync_shopify_orders_all_tenants`     | Sync Shopify orders for all tenants         |

---

## On-Demand Async Tasks

| Task                       | Trigger                       | Description                                     |
| -------------------------- | ----------------------------- | ----------------------------------------------- |
| `create_serial`            | Order creation signal         | Generate serial numbers for product items       |
| `create_serial_static`     | Manual trigger                | Generate static serial numbers                  |
| `genertate_certificate`    | Certificate upload            | Generate PDF certificates from Excel data       |
| `delete_expire_certificte` | Daily cron                    | Mark and clean up expired certificate downloads |
| `create_tenant_async`      | `POST /api/v1/create-tenant/` | Async tenant provisioning                       |

---

## Certificate Generation Flow

1. User uploads Excel file with recipient data
2. `genertate_certificate` task is queued
3. For each row: generate QR seal, render HTML template, convert to PDF
4. Bundle into ZIP file, store in GCS
5. `CertificateAsyncdownload` record updated to `completed`
6. Daily cleanup marks records as `Expired` after `expiration_duration` days and deletes ZIP files
