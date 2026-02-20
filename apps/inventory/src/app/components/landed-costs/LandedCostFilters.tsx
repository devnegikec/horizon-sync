import type { LandedCostVoucherFilters } from '../../types/landed-cost.types';

interface LandedCostFiltersProps {
  filters: Partial<LandedCostVoucherFilters>;
  setFilters: (filters: Partial<LandedCostVoucherFilters>) => void;
}

export function LandedCostFilters({ filters, setFilters }: LandedCostFiltersProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, status: e.target.value, page: 1 });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={filters.status || 'all'}
            onChange={handleStatusChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
}
