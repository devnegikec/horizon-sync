export interface DashboardOverview {
  organizations: { total: number; active: number; on_trial: number };
  users: { total: number; active: number };
  revenue: {
    total_invoiced: string; // decimal string
    total_outstanding: string;
    total_received: string;
  };
  recent_activity: ActivityLogItem[];
}

export interface ActivityLogItem {
  id: string;
  user_id: string;
  organization_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface DashboardFilters {
  date_from?: string;
  date_to?: string;
}
