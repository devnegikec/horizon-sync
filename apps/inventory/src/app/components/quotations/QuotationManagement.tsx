import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useUserStore } from '@horizon-sync/store';
import { useQuotationManagement } from '../../hooks/useQuotationManagement';
import { useQuotationPDFActions } from '../../hooks/useQuotationPDFActions';
import type { Quotation } from '../../types/quotation.types';
import { quotationApi } from '../../utility/api';
import { EmailComposer } from '../common';

import { ConvertToSalesOrderDialog } from './ConvertToSalesOrderDialog';
import { QuotationDetailDialog } from './QuotationDetailDialog';
import { QuotationDialog } from './QuotationDialog';
import { QuotationManagementFilters } from './QuotationManagementFilters';
import { QuotationManagementHeader } from './QuotationManagementHeader';
import { QuotationsTable } from './QuotationsTable';
import { QuotationStats } from './QuotationStats';

export function QuotationManagement() {
  const { toast } = useToast();
  const accessToken = useUserStore((s) => s.accessToken);
  const { handleDownload, handlePreview, handleGenerateBase64 } = useQuotationPDFActions();
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [emailAttachment, setEmailAttachment] = React.useState<{ filename: string; content: string; content_type: string } | null>(null);
  const [quotationForEmail, setQuotationForEmail] = React.useState<Quotation | null>(null);

  const fetchFullQuotation = React.useCallback(
    async (quotation: Quotation): Promise<Quotation | null> => {
      if (!accessToken) return null;
      try {
        return (await quotationApi.get(accessToken, quotation.id)) as Quotation;
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load quotation details',
          variant: 'destructive',
        });
        return null;
      }
    },
    [accessToken, toast]
  );

  const handlePreviewFromTable = React.useCallback(
    async (quotation: Quotation) => {
      const full = await fetchFullQuotation(quotation);
      if (full) await handlePreview(full);
    },
    [fetchFullQuotation, handlePreview]
  );

  const handleDownloadFromTable = React.useCallback(
    async (quotation: Quotation) => {
      const full = await fetchFullQuotation(quotation);
      if (full) await handleDownload(full);
    },
    [fetchFullQuotation, handleDownload]
  );

  const handleSendEmailFromTable = React.useCallback(
    async (quotation: Quotation) => {
      const full = await fetchFullQuotation(quotation);
      if (!full) return;
      const base64 = await handleGenerateBase64(full);
      if (base64) {
        setEmailAttachment({
          filename: `${full.quotation_no}.pdf`,
          content: base64,
          content_type: 'application/pdf',
        });
        setQuotationForEmail(full);
        setEmailDialogOpen(true);
      } else {
        toast({
          title: 'PDF Generation Failed',
          description: 'Could not generate PDF attachment',
          variant: 'destructive',
        });
      }
    },
    [fetchFullQuotation, handleGenerateBase64, toast]
  );

  const {
    filters,
    setFilters,
    quotations,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedQuotation,
    editQuotation,
    tableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleConvert,
    handleConvertConfirm,
    convertDialogOpen,
    setConvertDialogOpen,
    converting,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
  } = useQuotationManagement();

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading quotations: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }, [error]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <QuotationManagementHeader onRefresh={refetch}
        onCreateQuotation={handleCreate}
        isLoading={loading}/>

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <QuotationStats total={stats.total}
        draft={stats.draft}
        sent={stats.sent}
        accepted={stats.accepted}/>

      {/* Filters */}
      <QuotationManagementFilters filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}/>

      {/* Quotations Table */}
      <QuotationsTable quotations={quotations}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onConvert={handleConvert}
        onPreviewPDF={handlePreviewFromTable}
        onDownloadPDF={handleDownloadFromTable}
        onSendEmail={handleSendEmailFromTable}
        onCreateQuotation={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      {/* Detail Dialog */}
      <QuotationDetailDialog open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        quotation={selectedQuotation}
        onEdit={handleEdit}
        onConvert={handleConvert}/>

      {/* Create/Edit Dialog */}
      <QuotationDialog open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        quotation={editQuotation}
        onSave={handleSave}
        saving={false}/>

      {/* Convert to Sales Order Dialog */}
      <ConvertToSalesOrderDialog open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        quotation={selectedQuotation}
        onConvert={handleConvertConfirm}
        converting={converting}/>

      {/* Send Email (from table row) */}
      <EmailComposer
        open={emailDialogOpen}
        onOpenChange={(open) => {
          setEmailDialogOpen(open);
          if (!open) {
            setEmailAttachment(null);
            setQuotationForEmail(null);
          }
        }}
        docType="quotation"
        docId={quotationForEmail?.id ?? ''}
        docNo={quotationForEmail?.quotation_no ?? ''}
        defaultRecipient={quotationForEmail?.customer?.email ?? ''}
        defaultSubject={quotationForEmail ? `Quotation ${quotationForEmail.quotation_no}` : ''}
        defaultMessage={
          quotationForEmail
            ? `Dear ${quotationForEmail.customer_name || quotationForEmail.customer?.name || 'Customer'},\n\nPlease find attached quotation ${quotationForEmail.quotation_no} for your review.\n\nBest regards`
            : ''
        }
        defaultAttachments={emailAttachment ? [emailAttachment] : undefined}
        onSuccess={() => {
          setEmailDialogOpen(false);
          setEmailAttachment(null);
          setQuotationForEmail(null);
        }}
      />
    </div>
  );
}

