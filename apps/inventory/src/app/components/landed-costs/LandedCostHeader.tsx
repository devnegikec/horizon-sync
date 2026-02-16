interface LandedCostHeaderProps {
  onCreateVoucher: () => void;
}

export function LandedCostHeader({ onCreateVoucher }: LandedCostHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Landed Cost Vouchers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Allocate additional costs (freight, customs, insurance) to purchase receipts
        </p>
      </div>
      <button
        onClick={onCreateVoucher}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Voucher
      </button>
    </div>
  );
}
