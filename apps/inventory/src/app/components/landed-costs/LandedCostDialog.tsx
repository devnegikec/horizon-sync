import { useState, useEffect } from 'react';
import type {
  LandedCostVoucherListItem,
  CreateLandedCostVoucherPayload,
  UpdateLandedCostVoucherPayload,
  LandedCostVoucher,
} from '../../types/landed-cost.types';

interface LandedCostDialogProps {
  open: boolean;
  onClose: (shouldRefetch?: boolean) => void;
  voucher: LandedCostVoucherListItem | null;
  editMode: boolean;
  createLandedCost: (payload: CreateLandedCostVoucherPayload) => Promise<LandedCostVoucher | null>;
  updateLandedCost: (id: string, payload: UpdateLandedCostVoucherPayload) => Promise<LandedCostVoucher | null>;
  loading: boolean;
}

export function LandedCostDialog({
  open,
  onClose,
  voucher,
  editMode,
  createLandedCost,
  updateLandedCost,
  loading,
}: LandedCostDialogProps) {
  const [formData, setFormData] = useState({
    voucher_no: '',
    posting_date: new Date().toISOString().split('T')[0],
    status: 'draft' as 'draft' | 'submitted' | 'cancelled',
    remarks: '',
  });

  useEffect(() => {
    if (editMode && voucher) {
      setFormData({
        voucher_no: voucher.voucher_no,
        posting_date: voucher.posting_date.split('T')[0],
        status: voucher.status as 'draft' | 'submitted' | 'cancelled',
        remarks: '',
      });
    } else {
      setFormData({
        voucher_no: '',
        posting_date: new Date().toISOString().split('T')[0],
        status: 'draft',
        remarks: '',
      });
    }
  }, [editMode, voucher, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editMode && voucher) {
      const payload: UpdateLandedCostVoucherPayload = {
        posting_date: formData.posting_date,
        status: formData.status,
        remarks: formData.remarks || undefined,
      };
      const result = await updateLandedCost(voucher.id, payload);
      if (result) {
        onClose(true);
      }
    } else {
      const payload: CreateLandedCostVoucherPayload = {
        voucher_no: formData.voucher_no,
        posting_date: formData.posting_date,
        status: formData.status,
        remarks: formData.remarks || undefined,
      };
      const result = await createLandedCost(payload);
      if (result) {
        onClose(true);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => onClose()} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {editMode ? 'Edit Landed Cost Voucher' : 'Create Landed Cost Voucher'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="voucher_no" className="block text-sm font-medium text-gray-700">
                    Voucher No *
                  </label>
                  <input
                    type="text"
                    id="voucher_no"
                    required
                    disabled={editMode}
                    value={formData.voucher_no}
                    onChange={(e) => setFormData({ ...formData, voucher_no: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="posting_date" className="block text-sm font-medium text-gray-700">
                    Posting Date *
                  </label>
                  <input
                    type="date"
                    id="posting_date"
                    required
                    value={formData.posting_date}
                    onChange={(e) => setFormData({ ...formData, posting_date: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status *
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'submitted' | 'cancelled' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    rows={3}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editMode ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => onClose()}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
