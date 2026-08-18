import api from './client';

export interface InventorySummary {
  total_products: number; out_of_stock_count: number; low_stock_count: number;
  overstock_count: number; total_stock_value: number; avg_units_on_hand: number;
  total_units_on_hand: number;
}
export interface CategoryInventory {
  category_id: number; category_name: string; product_count: number;
  total_units: number; stock_value: number; value_share_pct: number;
  out_of_stock: number; low_stock: number; value_rank: number;
}
export interface AlertRow {
  product_id: number; product_name: string; category_name: string; sku: string;
  quantity_on_hand: number; reorder_level: number; stock_value: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  units_short: number; units_excess: number;
}
export interface VelocityRow {
  product_id: number; sku: string; product_name: string; category_name: string;
  quantity_on_hand: number; reorder_level: number; avg_monthly_outbound: number;
  months_of_cover: number | null; velocity_label: string; velocity_quartile: number;
  risk_flag: 'overstock_risk' | 'stockout_risk' | 'out_of_stock' | 'healthy';
  turnover_ratio: number;
}

const p = (params: object) => ({ params });

export const inventoryApi = {
  summary:    (params?: object) => api.get<InventorySummary>('/inventory/summary',          p(params ?? {})).then(r => r.data),
  byCategory: ()                => api.get<CategoryInventory[]>('/inventory/by-category').then(r => r.data),
  alerts:     (params?: object) => api.get<AlertRow[]>('/inventory/alerts',                 p(params ?? {})).then(r => r.data),
  velocity:   (params?: object) => api.get<VelocityRow[]>('/inventory/movement-analysis',   p(params ?? {})).then(r => r.data),
};
