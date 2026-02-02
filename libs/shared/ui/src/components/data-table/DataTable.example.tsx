import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from './DataTable';
import { DataTableColumnHeader } from './DataTableColumnHeader';
import { DataTableFacetedFilter } from './DataTableFacetedFilter';
import { Button } from '../ui/button';
import { Trash2, Download } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  role: string;
}

const sampleData: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'active', role: 'User' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', role: 'User' },
];

export function DataTableExample() {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              status === 'active'
                ? 'bg-green-100 text-green-700'
                : status === 'inactive'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {status}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    },
  ];

  const handleBulkDelete = (selectedRows: User[]) => {
    console.log('Deleting:', selectedRows);
  };

  const handleBulkExport = (selectedRows: User[]) => {
    console.log('Exporting:', selectedRows);
  };

  return (
    <DataTable
      columns={columns}
      data={sampleData}
      config={{
        showSerialNumber: true,
        showPagination: true,
        enableRowSelection: true,
        enableColumnVisibility: true,
        enableSorting: true,
        enableFiltering: true,
        initialPageSize: 10,
      }}
      filterPlaceholder="Search users..."
      renderBulkActions={(selectedRows) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkDelete(selectedRows)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkExport(selectedRows)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      )}
      renderFilters={() => (
        <DataTableFacetedFilter
          column={undefined}
          title="Status"
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Pending', value: 'pending' },
          ]}
        />
      )}
      fixedHeader
      maxHeight="600px"
    />
  );
}
