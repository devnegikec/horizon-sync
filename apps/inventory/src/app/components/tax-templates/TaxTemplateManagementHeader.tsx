import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';

interface TaxTemplateManagementHeaderProps {
  onCreateNew: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function TaxTemplateManagementHeader({
  onCreateNew,
  onRefresh,
  loading,
}: TaxTemplateManagementHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tax Templates</h1>
        <p className="text-muted-foreground">Manage tax templates for your organization</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Tax Template
        </Button>
      </div>
    </div>
  );
}
