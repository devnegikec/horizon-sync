---
title: Frontend Material Request Module - Implementation Guide
description: Complete guide for building the Material Request module for sourcing workflow
tags: [frontend, material-request, sourcing, procurement, api-integration]
---

# Frontend Material Request Module - Implementation Guide

## Overview

Build a comprehensive Material Request module that enables users to:

1. Create material requests with type (purchase/transfer/issue) and priority
2. Add line items with UOM, estimated costs, and internal customer details
3. Submit requests for procurement processing
4. Track request status through the sourcing workflow
5. View and manage material request history
6. Auto-generate human-readable request numbers

## API Endpoints Reference

### Base URL

```
http://localhost:8001/api/v1/material-requests
```

### Authentication

All requests require Bearer token in Authorization header:

```
Authorization: Bearer {token}
```

### Available Endpoints

1. **Create Material Request** - `POST /material-requests`
2. **List Material Requests** - `GET /material-requests`
3. **Get Material Request** - `GET /material-requests/{id}`
4. **Update Material Request** - `PATCH /material-requests/{id}` (DRAFT only)
5. **Delete Material Request** - `DELETE /material-requests/{id}` (DRAFT only)
6. **Submit Material Request** - `POST /material-requests/{id}/submit`
7. **Cancel Material Request** - `POST /material-requests/{id}/cancel`

## Module Structure

```
src/
├── features/
│   └── material-requests/
│       ├── components/
│       │   ├── MaterialRequestForm.tsx        # Main form for create/edit
│       │   ├── MaterialRequestList.tsx        # List view with filters
│       │   ├── MaterialRequestDetail.tsx      # Single request view
│       │   ├── LineItemsTable.tsx             # Line items management
│       │   ├── LineItemForm.tsx               # Add/edit line item
│       │   ├── RequestTypeSelector.tsx        # Purchase/Transfer/Issue
│       │   ├── PriorityBadge.tsx              # Priority indicator
│       │   ├── StatusBadge.tsx                # Status indicator
│       │   └── RequestFilters.tsx             # Filter by type, priority, status
│       ├── hooks/
│       │   ├── useMaterialRequests.ts         # Fetch requests list
│       │   ├── useMaterialRequest.ts          # Fetch single request
│       │   ├── useCreateMaterialRequest.ts    # Create request
│       │   ├── useUpdateMaterialRequest.ts    # Update request
│       │   ├── useSubmitMaterialRequest.ts    # Submit request
│       │   └── useCancelMaterialRequest.ts    # Cancel request
│       ├── services/
│       │   └── materialRequestService.ts      # API service layer
│       ├── types/
│       │   └── materialRequest.types.ts       # TypeScript types
│       └── utils/
│           ├── requestNumberGenerator.ts      # Generate MR-YYYY-NNNN
│           └── costCalculations.ts            # Calculate total costs
```

## TypeScript Types

```typescript
// materialRequest.types.ts

export type MaterialRequestType = "purchase" | "transfer" | "issue";

export type MaterialRequestPriority = "low" | "medium" | "high" | "urgent";

export type MaterialRequestStatus =
  | "draft"
  | "submitted"
  | "partially_quoted"
  | "fully_quoted"
  | "cancelled";

export interface MaterialRequestLine {
  id?: string;
  item_id: string;
  quantity: number;
  uom: string | null;
  required_date: string; // ISO date format
  description: string | null;
  estimated_unit_cost: number | null;
  requested_for: string | null;
  requested_for_department: string | null;
}

export interface MaterialRequestLineResponse extends MaterialRequestLine {
  id: string;
  organization_id: string;
  material_request_id: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialRequestCreate {
  request_no?: string; // Optional, auto-generated if not provided
  type: MaterialRequestType;
  priority: MaterialRequestPriority;
  target_warehouse_id?: string | null;
  requested_by?: string | null;
  department?: string | null;
  notes?: string | null;
  line_items: MaterialRequestLine[];
}

export interface MaterialRequestUpdate {
  request_no?: string;
  type?: MaterialRequestType;
  priority?: MaterialRequestPriority;
  target_warehouse_id?: string | null;
  requested_by?: string | null;
  department?: string | null;
  notes?: string | null;
  line_items?: MaterialRequestLine[];
}

export interface MaterialRequest {
  id: string;
  organization_id: string;
  request_no: string;
  type: MaterialRequestType;
  priority: MaterialRequestPriority;
  status: MaterialRequestStatus;
  target_warehouse_id: string | null;
  requested_by: string | null;
  department: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  line_items: MaterialRequestLineResponse[];
}

export interface MaterialRequestListItem {
  id: string;
  organization_id: string;
  request_no: string;
  type: MaterialRequestType;
  priority: MaterialRequestPriority;
  status: MaterialRequestStatus;
  department: string | null;
  created_at: string;
  created_by: string | null;
  line_items_count: number;
}

export interface MaterialRequestListResponse {
  material_requests: MaterialRequestListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
```
