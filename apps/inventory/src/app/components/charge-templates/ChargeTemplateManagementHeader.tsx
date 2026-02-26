import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';

interface ChargeTemplateManagementHeaderProps {
  onCreateNew: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function ChargeTemplateManagementHeader({
  onCreateNew,
  onRefresh,
  loading,
}: ChargeTemplateManagementHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Charge Templates</h1>
        <p className="text-muted-foreground">Manage charge templates for your organization</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Charge Template
        </Button>
      </div>
    </div>
  );
}
