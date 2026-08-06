import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, Trash2, Printer, RefreshCw, QrCode, UserCog } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';

import type { WMSWorker } from '../../types/wms.types';

interface WorkerColumnsProps {
  onEdit: (worker: WMSWorker) => void;
  onDelete: (worker: WMSWorker) => void;
  onPrintQR: (worker: WMSWorker) => void;
  onRegenerateQR: (worker: WMSWorker) => void;
  showEditAction?: boolean;
  showDeleteAction?: boolean;
  showRegenerateAction?: boolean;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return { variant: 'success' as const, label: 'Active' };
    case 'inactive':
      return { variant: 'secondary' as const, label: 'Inactive' };
    case 'suspended':
      return { variant: 'warning' as const, label: 'Suspended' };
    default:
      return { variant: 'secondary' as const, label: status };
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'warehouse_manager':
      return { variant: 'default' as const, label: 'Manager' };
    case 'warehouse_worker':
      return { variant: 'outline' as const, label: 'Worker' };
    case 'supervisor':
      return { variant: 'secondary' as const, label: 'Supervisor' };
    default:
      return { variant: 'outline' as const, label: role };
  }
}

export function createWorkerColumns({
  onEdit,
  onDelete,
  onPrintQR,
  onRegenerateQR,
  showEditAction = true,
  showDeleteAction = true,
  showRegenerateAction = true,
}: WorkerColumnsProps): ColumnDef<WMSWorker>[] {
  return [
    {
      accessorKey: 'display_name',
      header: 'Worker',
      cell: ({ row }) => {
        const worker = row.original;
        const name = worker.display_name || `${worker.first_name} ${worker.last_name}`;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{name}</p>
              <code className="text-xs text-muted-foreground">{worker.employee_id || worker.login_username}</code>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        const worker = row.original;
        return (
          <div className="text-sm">
            <p>{worker.email || '\u2014'}</p>
            <p className="text-muted-foreground">{worker.phone || '\u2014'}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'login_username',
      header: 'Username',
      cell: ({ row }) => {
        const username = row.original.login_username;
        return username ? (
          <code className="text-sm bg-muted px-2 py-1 rounded">{username}</code>
        ) : (
          <span className="text-muted-foreground text-sm">{'\u2014'}</span>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const roleBadge = getRoleBadge(row.original.role);
        return <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>;
      },
    },
    {
      accessorKey: 'barcode',
      header: 'QR Code',
      cell: ({ row }) => {
        const code = row.original.barcode || row.original.qr_code;
        return code ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onPrintQR(row.original);
            }}
            title="Print QR Code for mobile login"
          >
            <Printer className="h-3.5 w-3.5" />
            <code className="text-xs font-mono">{code}</code>
          </Button>
        ) : (
          <span className="text-muted-foreground text-sm">{'\u2014'}</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusBadge = getStatusBadge(row.original.status);
        return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const worker = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showEditAction && (
                <DropdownMenuItem onClick={() => onEdit(worker)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {(worker.barcode || worker.qr_code) && (
                <DropdownMenuItem onClick={() => onPrintQR(worker)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print QR Code
                </DropdownMenuItem>
              )}
              {showRegenerateAction && (
                <DropdownMenuItem onClick={() => onRegenerateQR(worker)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate QR Code
                </DropdownMenuItem>
              )}
              {showDeleteAction && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(worker)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disable
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
