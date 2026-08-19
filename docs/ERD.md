# Entity-Relationship Diagram

> Generated from SQLAlchemy models in `backend/app/models/`.  
> Rendered with [Mermaid](https://mermaid.js.org/) — paste into any Mermaid-compatible viewer.

```mermaid
erDiagram
    departments {
        int     department_id   PK
        varchar name
        varchar cost_center_code
        timestamp created_at
    }

    regions {
        int     region_id   PK
        varchar name
        varchar zone
    }

    categories {
        int     category_id         PK
        varchar name
        int     parent_category_id  FK
    }

    products {
        int         product_id   PK
        varchar     sku
        varchar     name
        int         category_id  FK
        numeric     unit_cost
        numeric     unit_price
        int         reorder_level
        boolean     is_active
    }

    employees {
        int     employee_id   PK
        varchar full_name
        varchar email
        int     department_id FK
        int     manager_id    FK
        varchar job_title
        varchar job_level
        numeric salary
        date    hire_date
        date    exit_date
        varchar status
    }

    users {
        int     user_id      PK
        int     employee_id  FK
        varchar email
        varchar password_hash
        varchar role
        boolean is_active
        timestamp last_login_at
    }

    inventory {
        int     inventory_id      PK
        int     product_id        FK
        int     quantity_on_hand
        varchar warehouse_location
        timestamp last_restocked_at
        timestamp updated_at
    }

    stock_movements {
        int     movement_id    PK
        int     product_id     FK
        varchar movement_type
        int     quantity
        date    movement_date
        varchar reference_id
    }

    sales {
        int     sale_id        PK
        varchar order_number
        int     employee_id    FK
        int     region_id      FK
        varchar customer_name
        date    order_date
        varchar status
        varchar payment_method
        numeric subtotal
        numeric discount
        numeric total_amount
    }

    sale_items {
        int     sale_item_id  PK
        int     sale_id       FK
        int     product_id    FK
        int     quantity
        numeric unit_price
        numeric unit_cost
        numeric line_total
    }

    targets {
        int     target_id      PK
        int     employee_id    FK
        int     department_id  FK
        date    period_month
        numeric target_amount
    }

    expenses {
        int     expense_id       PK
        int     department_id    FK
        varchar expense_category
        numeric amount
        date    expense_date
        varchar description
    }

    departments     ||--o{   employees      : "employs"
    departments     ||--o{   expenses       : "incurs"
    departments     ||--o{   targets        : "has dept target"
    employees       ||--o{   employees      : "manages (self-ref)"
    employees       ||--o|   users          : "has login"
    employees       ||--o{   sales          : "makes"
    employees       ||--o{   targets        : "has individual target"
    regions         ||--o{   sales          : "in"
    categories      ||--o{   categories     : "parent (self-ref)"
    categories      ||--o{   products       : "contains"
    products        ||--|{   inventory      : "tracked in"
    products        ||--o{   stock_movements: "moved via"
    products        ||--o{   sale_items     : "sold in"
    sales           ||--o{   sale_items     : "has"
```

## Design notes

- **`employees.manager_id`** self-references the same table — the recursive CTE in `workforce/hierarchy.sql` walks this column to produce the full org tree at any depth.
- **`targets`** supports both individual targets (`employee_id` set) and department-level targets (`department_id` set). Either FK may be NULL; a CHECK constraint enforces that exactly one is populated.
- **`sale_items`** is the fact table. Profit is always derived (`(unit_price - unit_cost) × quantity`) — never stored — so it can never drift from source.
- **`users`** is decoupled from `employees`: a user can exist without an employee record (service accounts), and an employee can exist without a login.
- **Views**: `vw_monthly_revenue`, `vw_employee_performance`, `vw_inventory_health` encapsulate common aggregations; `mvw_daily_sales_summary` (materialized) powers the executive overview with a single fast scan.
