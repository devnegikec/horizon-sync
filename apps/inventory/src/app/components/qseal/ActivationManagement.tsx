import * as React from 'react';

import { Zap, Plus, RefreshCw, CheckCircle, Clock } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';

interface ActivationBatch {
  id: string;
  product_name: string;
  batch_size: number;
  manufacturing_date: string;
  destination_market: string;
  pricing: number;
  activated_count: number;
  status: 'pending' | 'in_progress' | 'completed';
}

const MOCK_BATCHES: ActivationBatch[] = [
  { id: 'act-001', product_name: 'Amoxicillin 250mg', batch_size: 500, manufacturing_date: '2025-01-10', destination_market: 'India', pricing: 12.5, activated_count: 500, status: 'completed' },
  { id: 'act-002', product_name: 'Amoxicillin 250mg', batch_size: 200, manufacturing_date: '2025-02-01', destination_market: 'UAE', pricing: 18.0, activated_count: 143, status: 'in_progress' },
  { id: 'act-003', product_name: 'Paracetamol 500mg', batch_size: 1000, manufacturing_date: '2025-03-01', destination_market: 'India', pricing: 8.0, activated_count: 0, status: 'pending' },
];

const STATUS_CONFIG: Record<ActivationBatch['status'], { label: string; variant: 'default' | 'secondary' | 'outline'; Icon: React.ComponentType<{ className?: string }> }> = {
  completed: { label: 'Completed', variant: 'default', Icon: CheckCircle },
  in_progress: { label: 'In Progress', variant: 'secondary', Icon: Clock },
  pending: { label: 'Pending', variant: 'outline', Icon: Clock },
};

export function ActivationManagement() {
  const batches = MOCK_BATCHES;

  const stats = React.useMemo(() => ({
    total: batches.length,
    completed: batches.filter((b) => b.status === 'completed').length,
    inProgress: batches.filter((b) => b.status === 'in_progress').length,
    totalActivated: batches.reduce((sum, b) => sum + b.activated_count, 0),
  }), [batches]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activation</h2>
          <p className="text-muted-foreground">Manage post-activation batches for products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {([
          { label: 'Total Batches', value: stats.total },
          { label: 'Completed', value: stats.completed },
          { label: 'In Progress', value: stats.inProgress },
          { label: 'Total Activated', value: stats.totalActivated.toLocaleString() },
        ] as const).map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No activation batches</p>
            <p className="text-muted-foreground mb-4">Create a batch to start activating post-activated products</p>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Batch</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch Size</TableHead>
                  <TableHead>Activated</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Mfg. Date</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => {
                  const cfg = STATUS_CONFIG[batch.status];
                  const pct = batch.batch_size > 0 ? Math.round((batch.activated_count / batch.batch_size) * 100) : 0;
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.product_name}</TableCell>
                      <TableCell>{batch.batch_size.toLocaleString()}</TableCell>
                      <TableCell>{batch.activated_count.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{batch.manufacturing_date}</TableCell>
                      <TableCell>{batch.destination_market}</TableCell>
                      <TableCell>${batch.pricing.toFixed(2)}</TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
