import { useState, useEffect } from 'react';

import { FileText, Eye, Calendar, DollarSign } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components';

import { journalEntriesApi, type JournalEntry } from '../../utility/api/journal-entries';
import { formatCurrency, formatDate } from '../../utils/payment.utils';

export function JournalEntries() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      const data = await journalEntriesApi.fetchJournalEntries(1, 50);
      setJournalEntries(data.journal_entries || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'posted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading journal entries...</p>
        </div>
      </div>
    );
  }

  if (journalEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Journal Entries</h2>
          <p className="text-muted-foreground">
            Journal entries will appear here when you confirm payments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Journal Entries</h1>
          <p className="text-muted-foreground mt-1">
            View all accounting journal entries
          </p>
        </div>
        <Button onClick={fetchJournalEntries} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {journalEntries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{entry.entry_no || 'N/A'}</h3>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                    <Badge variant="outline">{entry.voucher_type || '-'}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(entry.posting_date)}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Debit: {formatCurrency(entry.total_debit, 'USD')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Credit: {formatCurrency(entry.total_credit, 'USD')}
                    </div>
                    <div className="text-muted-foreground">
                      {entry.lines?.length || 0} lines
                    </div>
                  </div>

                  {entry.remarks && (
                    <p className="text-sm text-muted-foreground">{entry.remarks}</p>
                  )}
                </div>

                <Button variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(entry)}
                  className="ml-4">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Journal Entry Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Journal Entry Details - {selectedEntry?.entry_no || 'N/A'}
            </DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-6">
              {/* Header Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entry Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Entry Number</p>
                      <p className="font-medium">{selectedEntry.entry_no || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Posting Date</p>
                      <p className="font-medium">{formatDate(selectedEntry.posting_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Voucher Type</p>
                      <p className="font-medium">{selectedEntry.voucher_type || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedEntry.status)}>
                        {selectedEntry.status}
                      </Badge>
                    </div>
                  </div>

                  {selectedEntry.remarks && (
                    <div>
                      <p className="text-sm text-muted-foreground">Remarks</p>
                      <p className="font-medium">{selectedEntry.remarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Journal Entry Lines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Journal Entry Lines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Account</th>
                          <th className="text-left py-3 px-4 font-semibold">Remarks</th>
                          <th className="text-right py-3 px-4 font-semibold">Debit</th>
                          <th className="text-right py-3 px-4 font-semibold">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntry.lines?.map((line) => (
                          <tr key={line.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{line.account_name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{line.account_code || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {line.remarks || '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              {line.debit > 0 ? formatCurrency(line.debit, 'USD') : '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              {line.credit > 0 ? formatCurrency(line.credit, 'USD') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td colSpan={2} className="py-3 px-4 text-right">Total:</td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(selectedEntry.total_debit, 'USD')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(selectedEntry.total_credit, 'USD')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Balanced Check */}
                  {selectedEntry.total_debit === selectedEntry.total_credit ? (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                        ✓ Entry is balanced (Debits = Credits)
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                        ⚠ Entry is not balanced (Debits ≠ Credits)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
