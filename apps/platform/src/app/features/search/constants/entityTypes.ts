/**
 * Entity type configurations for search UI
 * Maps entity types to their display properties and routing
 */

import {
  Package,
  Users,
  Truck,
  FileText,
  Warehouse,
  ClipboardList,
} from 'lucide-react';
import { EntityTypeConfig } from '../types/search.types';

/**
 * Entity type configurations mapping
 * Each entity type has display properties and routing information
 */
export const ENTITY_TYPE_CONFIGS: Record<string, EntityTypeConfig> = {
  items: {
    type: 'items',
    label: 'Items',
    icon: Package,
    color: 'blue',
    route: '/inventory/items/:id',
  },
  customers: {
    type: 'customers',
    label: 'Customers',
    icon: Users,
    color: 'green',
    route: '/customers/:id',
  },
  suppliers: {
    type: 'suppliers',
    label: 'Suppliers',
    icon: Truck,
    color: 'purple',
    route: '/suppliers/:id',
  },
  invoices: {
    type: 'invoices',
    label: 'Invoices',
    icon: FileText,
    color: 'orange',
    route: '/invoices/:id',
  },
  warehouses: {
    type: 'warehouses',
    label: 'Warehouses',
    icon: Warehouse,
    color: 'indigo',
    route: '/warehouses/:id',
  },
  stock_entries: {
    type: 'stock_entries',
    label: 'Stock Entries',
    icon: ClipboardList,
    color: 'teal',
    route: '/inventory/stock-entries/:id',
  },
  tax_templates: {
    type: 'tax_templates',
    label: 'Tax Templates',
    icon: ClipboardList,
    color: 'teal',
    route: '/inventory/tax-templates/:id',
  },
};

/**
 * Get entity type configuration by type
 */
export function getEntityTypeConfig(
  entityType: string
): EntityTypeConfig | undefined {
  return ENTITY_TYPE_CONFIGS[entityType];
}

/**
 * Get all entity types
 */
export function getAllEntityTypes(): string[] {
  return Object.keys(ENTITY_TYPE_CONFIGS);
}

/**
 * Check if entity type is valid
 */
export function isValidEntityType(entityType: string): boolean {
  return entityType in ENTITY_TYPE_CONFIGS;
}
