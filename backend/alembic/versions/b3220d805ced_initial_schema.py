"""initial_schema

Revision ID: b3220d805ced
Revises:
Create Date: 2026-08-18

"""
from alembic import op
import sqlalchemy as sa

revision = "b3220d805ced"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── departments ──────────────────────────────────────────────────────────
    op.create_table(
        "departments",
        sa.Column("department_id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("cost_center_code", sa.String(20), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        comment="Business units / cost centres",
    )

    # ── employees ─────────────────────────────────────────────────────────────
    op.create_table(
        "employees",
        sa.Column("employee_id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.department_id"), nullable=False),
        sa.Column("manager_id", sa.Integer(), sa.ForeignKey("employees.employee_id"), nullable=True),
        sa.Column("job_title", sa.String(100), nullable=False),
        sa.Column("job_level", sa.String(20), nullable=False),
        sa.Column("salary", sa.Numeric(12, 2), nullable=False),
        sa.Column("hire_date", sa.Date(), nullable=False),
        sa.Column("exit_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.CheckConstraint("salary > 0", name="ck_employees_salary_positive"),
        sa.CheckConstraint("status IN ('active', 'resigned', 'terminated')", name="ck_employees_status"),
        sa.CheckConstraint("job_level IN ('executive', 'manager', 'senior', 'associate')", name="ck_employees_job_level"),
        comment="All employees; manager_id forms a self-referencing hierarchy",
    )
    op.create_index("ix_employees_department_id", "employees", ["department_id"])
    op.create_index("ix_employees_manager_id", "employees", ["manager_id"])

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("user_id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.employee_id"), nullable=True, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="employee"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("role IN ('admin', 'manager', 'analyst', 'employee')", name="ck_users_role"),
        comment="Auth identities — decoupled from employees table",
    )

    # ── categories ────────────────────────────────────────────────────────────
    op.create_table(
        "categories",
        sa.Column("category_id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("parent_category_id", sa.Integer(), sa.ForeignKey("categories.category_id"), nullable=True),
        comment="Product categories with optional parent for hierarchy",
    )

    # ── products ──────────────────────────────────────────────────────────────
    op.create_table(
        "products",
        sa.Column("product_id", sa.Integer(), primary_key=True),
        sa.Column("sku", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.category_id"), nullable=False),
        sa.Column("unit_cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("reorder_level", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.CheckConstraint("unit_cost > 0", name="ck_products_unit_cost_positive"),
        sa.CheckConstraint("unit_price > unit_cost", name="ck_products_price_gt_cost"),
        sa.CheckConstraint("reorder_level >= 0", name="ck_products_reorder_level_nonneg"),
        comment="Product catalogue with pricing and reorder thresholds",
    )
    op.create_index("ix_products_category_id", "products", ["category_id"])

    # ── inventory ─────────────────────────────────────────────────────────────
    op.create_table(
        "inventory",
        sa.Column("inventory_id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.product_id"), nullable=False, unique=True),
        sa.Column("quantity_on_hand", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("warehouse_location", sa.String(50), nullable=True),
        sa.Column("last_restocked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("quantity_on_hand >= 0", name="ck_inventory_quantity_nonneg"),
        comment="Current stock levels — one record per product",
    )

    # ── stock_movements ───────────────────────────────────────────────────────
    op.create_table(
        "stock_movements",
        sa.Column("movement_id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.product_id"), nullable=False),
        sa.Column("movement_type", sa.String(20), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("movement_date", sa.Date(), nullable=False),
        sa.Column("reference_id", sa.String(100), nullable=True),
        sa.CheckConstraint("movement_type IN ('inbound', 'outbound', 'adjustment')", name="ck_stock_movement_type"),
        comment="All stock in/out events — powers turnover and velocity analytics",
    )
    op.create_index("ix_stock_movements_product_date", "stock_movements", ["product_id", "movement_date"])

    # ── regions ───────────────────────────────────────────────────────────────
    op.create_table(
        "regions",
        sa.Column("region_id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("zone", sa.String(10), nullable=False),
        sa.CheckConstraint("zone IN ('North', 'South', 'East', 'West')", name="ck_regions_zone"),
        comment="Geographic sales territories",
    )

    # ── sales ─────────────────────────────────────────────────────────────────
    op.create_table(
        "sales",
        sa.Column("sale_id", sa.Integer(), primary_key=True),
        sa.Column("order_number", sa.String(50), nullable=False, unique=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.employee_id"), nullable=False),
        sa.Column("region_id", sa.Integer(), sa.ForeignKey("regions.region_id"), nullable=False),
        sa.Column("customer_name", sa.String(150), nullable=False),
        sa.Column("order_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="completed"),
        sa.Column("payment_method", sa.String(50), nullable=False),
        sa.Column("subtotal", sa.Numeric(14, 2), nullable=False),
        sa.Column("discount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.CheckConstraint("status IN ('completed', 'pending', 'cancelled', 'returned')", name="ck_sales_status"),
        sa.CheckConstraint("total_amount >= 0", name="ck_sales_total_nonneg"),
        sa.CheckConstraint("discount >= 0 AND discount <= subtotal", name="ck_sales_discount_range"),
        comment="Order headers; line items in sale_items",
    )
    op.create_index("ix_sales_order_date", "sales", ["order_date"])
    op.create_index("ix_sales_employee_id", "sales", ["employee_id"])
    op.create_index("ix_sales_region_id", "sales", ["region_id"])

    # ── sale_items ────────────────────────────────────────────────────────────
    op.create_table(
        "sale_items",
        sa.Column("sale_item_id", sa.Integer(), primary_key=True),
        sa.Column("sale_id", sa.Integer(), sa.ForeignKey("sales.sale_id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.product_id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("unit_cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("line_total", sa.Numeric(14, 2), nullable=False),
        sa.CheckConstraint("quantity > 0", name="ck_sale_items_qty_positive"),
        sa.CheckConstraint("unit_price > 0", name="ck_sale_items_price_positive"),
        comment="Line items — profit = (unit_price - unit_cost) * quantity",
    )
    op.create_index("ix_sale_items_product_id", "sale_items", ["product_id"])
    op.create_index("ix_sale_items_sale_id", "sale_items", ["sale_id"])

    # ── targets ───────────────────────────────────────────────────────────────
    op.create_table(
        "targets",
        sa.Column("target_id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.employee_id"), nullable=True),
        sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.department_id"), nullable=True),
        sa.Column("period_month", sa.Date(), nullable=False),
        sa.Column("target_amount", sa.Numeric(14, 2), nullable=False),
        sa.CheckConstraint("target_amount > 0", name="ck_targets_amount_positive"),
        sa.CheckConstraint(
            "(employee_id IS NOT NULL AND department_id IS NULL) OR (employee_id IS NULL AND department_id IS NOT NULL)",
            name="ck_targets_scope_xor",
        ),
        comment="Sales targets — either individual (employee_id) or team (department_id)",
    )
    op.create_index("ix_targets_employee_id", "targets", ["employee_id"])
    op.create_index("ix_targets_department_id", "targets", ["department_id"])

    # ── expenses ──────────────────────────────────────────────────────────────
    op.create_table(
        "expenses",
        sa.Column("expense_id", sa.Integer(), primary_key=True),
        sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.department_id"), nullable=False),
        sa.Column("expense_category", sa.String(30), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.CheckConstraint(
            "expense_category IN ('payroll', 'operations', 'marketing', 'infrastructure', 'misc')",
            name="ck_expenses_category",
        ),
        sa.CheckConstraint("amount > 0", name="ck_expenses_amount_positive"),
        comment="Departmental cost entries for finance analytics",
    )
    op.create_index("ix_expenses_department_id", "expenses", ["department_id"])
    op.create_index("ix_expenses_expense_date", "expenses", ["expense_date"])

    # ── views ─────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE VIEW vw_monthly_revenue AS
        SELECT
            date_trunc('month', s.order_date)::date AS period,
            COUNT(DISTINCT s.sale_id)                AS total_orders,
            SUM(s.total_amount)                      AS revenue,
            SUM((si.unit_price - si.unit_cost) * si.quantity) AS profit
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.sale_id
        WHERE s.status = 'completed'
        GROUP BY 1
        ORDER BY 1
    """)

    op.execute("""
        CREATE VIEW vw_employee_performance AS
        SELECT
            e.employee_id,
            e.full_name,
            e.department_id,
            d.name                                     AS department_name,
            e.job_title,
            e.job_level,
            e.salary,
            COUNT(DISTINCT s.sale_id)                  AS total_orders,
            COALESCE(SUM(s.total_amount), 0)           AS total_revenue,
            COALESCE(SUM(t.target_amount), 0)          AS total_target
        FROM employees e
        JOIN departments d ON d.department_id = e.department_id
        LEFT JOIN sales s  ON s.employee_id = e.employee_id AND s.status = 'completed'
        LEFT JOIN targets t ON t.employee_id = e.employee_id
        GROUP BY e.employee_id, e.full_name, e.department_id, d.name, e.job_title, e.job_level, e.salary
    """)

    op.execute("""
        CREATE VIEW vw_inventory_health AS
        SELECT
            p.product_id,
            p.sku,
            p.name                                          AS product_name,
            c.name                                          AS category_name,
            i.quantity_on_hand,
            p.reorder_level,
            p.unit_cost,
            p.unit_price,
            (i.quantity_on_hand * p.unit_cost)              AS stock_value,
            CASE
                WHEN i.quantity_on_hand = 0              THEN 'out_of_stock'
                WHEN i.quantity_on_hand < p.reorder_level THEN 'low_stock'
                WHEN i.quantity_on_hand > p.reorder_level * 10 THEN 'overstock'
                ELSE 'healthy'
            END                                             AS stock_status
        FROM products p
        JOIN categories c  ON c.category_id = p.category_id
        JOIN inventory i   ON i.product_id  = p.product_id
        WHERE p.is_active = true
    """)

    # ── materialized view ─────────────────────────────────────────────────────
    op.execute("""
        CREATE MATERIALIZED VIEW mvw_daily_sales_summary AS
        SELECT
            s.order_date,
            s.region_id,
            r.name                                          AS region_name,
            r.zone,
            s.employee_id,
            e.department_id,
            COUNT(DISTINCT s.sale_id)                       AS order_count,
            SUM(s.total_amount)                             AS revenue,
            SUM((si.unit_price - si.unit_cost) * si.quantity) AS profit
        FROM sales s
        JOIN regions r    ON r.region_id   = s.region_id
        JOIN employees e  ON e.employee_id = s.employee_id
        JOIN sale_items si ON si.sale_id   = s.sale_id
        WHERE s.status = 'completed'
        GROUP BY s.order_date, s.region_id, r.name, r.zone, s.employee_id, e.department_id
        WITH DATA
    """)
    op.execute("CREATE UNIQUE INDEX uix_mvw_daily_sales ON mvw_daily_sales_summary (order_date, region_id, employee_id)")


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mvw_daily_sales_summary")
    op.execute("DROP VIEW IF EXISTS vw_inventory_health")
    op.execute("DROP VIEW IF EXISTS vw_employee_performance")
    op.execute("DROP VIEW IF EXISTS vw_monthly_revenue")

    op.drop_table("expenses")
    op.drop_table("targets")
    op.drop_table("sale_items")
    op.drop_table("sales")
    op.drop_table("regions")
    op.drop_table("stock_movements")
    op.drop_table("inventory")
    op.drop_table("products")
    op.drop_table("categories")
    op.drop_table("users")
    op.drop_table("employees")
    op.drop_table("departments")
