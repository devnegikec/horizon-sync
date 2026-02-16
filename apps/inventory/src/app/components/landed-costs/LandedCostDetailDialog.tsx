import { useState, useEffect } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { landedCostApi } from '../../utility/api/landed-costs';
import type { LandedCostVoucher } from '../../types/landed-cost.types';

interface LandedCostDetailDialogProps {
  open: boolean;
  onClose: () => void;
  voucherId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function LandedCostDetailDialog({ open, onClose, voucherId }: LandedCostDetailDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [voucher, setVoucher] = useState<LandedCostVoucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && voucherId && accessToken) {
      fetchVoucher();
    }
  }, [open, voucherId, accessToken]);

  const fetchVoucher = async () => {
    if (!accessToken || !voucherId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await landedCostApi.getById(accessToken, voucherId);
      setVoucher(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch voucher details';
      setError(errorMessage);
      console.error('Error fetching voucher:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Landed Cost Voucher Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {voucher && !loading && (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Voucher No</label>
                    <p className="mt-1 text-sm text-gray-900">{voucher.voucher_no}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span
                      className={`mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                        STATUS_COLORS[voucher.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {voucher.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Posting Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(voucher.posting_date)}</p>
                  </div>
                  {voucher.submitted_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Submitted At</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(voucher.submitted_at)}</p>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                {voucher.remarks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Remarks</label>
                    <p className="mt-1 text-sm text-gray-900">{voucher.remarks}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created At</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(voucher.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Updated At</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(voucher.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
