# QSeal System — Technical Overview

Prepared for: Leadership Review
Based on: QC Module Walkthrough Session

---

## What is QSeal?

QSeal is the product authentication and QR code management platform. It enables organizations to generate, distribute, and track QR codes on physical products — allowing end consumers to scan and verify product authenticity, register warranties, and participate in campaigns.

---

## Active Modules (In Use Today)

### 1. Product Management

The core of the system. Manages the full lifecycle of a product from creation to QR generation.

Before creating a product, the following must be configured:

- Serial prefixes — unique identifier prefixes per product line
- Distribution channels — how products reach the market
- Destination channels — target markets/regions
- Shelf life — product expiry configuration

Product configuration includes:

- Brand logo and banner (displayed on the consumer landing page when a QR is scanned)
- Activation method: pre-activated (QR works immediately) or post-activated (QR activated at point of distribution)
- Serial type and contact information
- Optional redirect URL — if set, scanning the QR takes the consumer directly to the brand's own product page instead of the default QSeal landing page

### 2. Block Creation (QR Generation)

A product can have multiple "blocks" — each block is a batch of QR codes.

Each block requires:

- QR type: Dynamic, Secure QR Runtime, or Static QR
- Distribution channel
- Destination market

The system generates short URLs and QR images per block. QR generation is credit-based (see Billing below).

### 3. SKU QR Customization

Organizations can customize QR code appearance — add logos, change colors. Currently product-specific, but can be moved to a global setting.

### 4. Analytics

Tracks every QR scan with:

- Device type
- Location (GPS coordinates → readable address via Google API)
- Scan timestamps

Currently powered by a third-party tool (Metamo). This is a known pain point — see Migration Considerations.

### 5. Activation Module

For post-activated products. Allows setting:

- Batch sizes
- Manufacturing dates
- Destination markets
- Pricing

Supported via both the web interface and a companion Android app for field activation (individual and bulk scan).

---

## Inactive Modules (Excluded from Migration)

### Certificate Module

A standalone service for generating PDF certificates (e.g., training certificates). Previously used by one client (CAI). No active users today. Will not be migrated.

### Track & Trace

Creates hierarchical relationships between products using shipper → pallet → container structures. No clients currently use this. Will not be migrated.

---

## Key Concepts

### Brand vs Organization

Currently the system has a "Brand" entity that sits between the Organization and Products. Each brand holds a public/private key pair used for QR authentication (digital signature verification).

In the new system, this will be simplified — the key pair moves to the Organization level, removing the need for a separate Brand entity.

### Credit / Billing System

Organizations receive a monthly QR generation allocation (e.g., 10,000 QRs). Usage beyond the allocation is billed. This is the primary billing mechanism.

### Authentication Flow

When a consumer scans a QR code:

1. The system reads the QR's embedded signature
2. Verifies it against the organization's public key
3. Returns: authentic / not authentic
4. Optionally redirects to a custom product URL

---

## Current Technical Pain Points

| Issue                                              | Impact                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Analytics on external Metamo instance (free EC2)   | Risk of data loss if instance is destroyed; slow performance due to external API calls |
| Google API dependency for GPS → address conversion | Additional latency and cost                                                            |
| Brand entity adds unnecessary complexity           | Extra configuration step for organizations with a single brand                         |
| Industry field on product form                     | Redundant for single-industry organizations                                            |
| No granular permissions                            | All configuration is admin-only; no tab-level access control                           |
