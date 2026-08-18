export interface KpiValue {
  value: number;
  previous_value?: number | null;
  change_pct?: number | null;
  direction?: 'up' | 'down' | 'neutral';
}

export interface TrendPoint {
  period: string;
  revenue: number;
  profit: number;
  order_count: number;
  prev_revenue?: number;
  revenue_growth_pct?: number;
  profit_growth_pct?: number;
  cumulative_revenue?: number;
}

export interface DeptData {
  department_id: number;
  department_name: string;
  revenue: number;
  profit: number;
  revenue_share_pct: number;
  total_orders: number;
  avg_order_value: number;
}

export interface ManagerData {
  manager_id: number;
  manager_name: string;
  department_name: string;
  team_size: number;
  revenue: number;
  profit: number;
  total_orders: number;
  revenue_rank: number;
}

export interface OrderRow {
  sale_id: number;
  order_number: string;
  order_date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'returned';
  payment_method: string;
  customer_name: string;
  total_amount: number;
  employee_name: string;
  department_name: string;
  region_name: string;
  item_count: number;
}

export interface InventoryAlert {
  product_id: number;
  product_name: string;
  category_name: string;
  sku: string;
  quantity_on_hand: number;
  reorder_level: number;
  stock_value: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  units_short: number;
}

export interface Insight {
  severity: 'critical' | 'warning' | 'positive' | 'neutral';
  category: string;
  message: string;
  metric_value?: number | Record<string, number>;
}

export interface ExecutiveOverview {
  kpis: {
    revenue: KpiValue;
    profit: KpiValue;
    headcount: KpiValue;
    inventory_value: KpiValue;
  };
  revenue_trend: TrendPoint[];
  sales_by_department: DeptData[];
  top_managers: ManagerData[];
  recent_orders: OrderRow[];
  inventory_alerts: InventoryAlert[];
}

export interface User {
  user_id: number;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'employee';
  employee_id: number | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
