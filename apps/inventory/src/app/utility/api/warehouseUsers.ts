import { apiRequest } from './core';

export interface AssignedWarehouse {
  id: string;
  name: string;
  code: string;
  city: string | null;
  type: string | null;
  is_default: boolean;
  assignment_role?: string;
  assignment_id?: string;
}

export interface MyWarehousesResponse {
  warehouses: AssignedWarehouse[];
}

export const warehouseUserApi = {
  getMyWarehouses: (accessToken: string) =>
    apiRequest<MyWarehousesResponse>('/warehouse-users/my-warehouses', accessToken),
};
