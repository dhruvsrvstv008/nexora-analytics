from datetime import date
from sqlalchemy import String, Numeric, Date, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Sale(Base):
    __tablename__ = "sales"
    __table_args__ = (
        CheckConstraint("status IN ('completed', 'pending', 'cancelled', 'returned')", name="ck_sales_status"),
        CheckConstraint("total_amount >= 0", name="ck_sales_total_nonneg"),
        CheckConstraint("discount >= 0 AND discount <= subtotal", name="ck_sales_discount_range"),
        Index("ix_sales_order_date", "order_date"),
        Index("ix_sales_employee_id", "employee_id"),
        Index("ix_sales_region_id", "region_id"),
        {"comment": "Order headers; line items in sale_items"},
    )

    sale_id: Mapped[int] = mapped_column(primary_key=True)
    order_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.employee_id"), nullable=False)
    region_id: Mapped[int] = mapped_column(ForeignKey("regions.region_id"), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="completed")
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    discount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="sales")
    region: Mapped["Region"] = relationship("Region", back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_sale_items_qty_positive"),
        CheckConstraint("unit_price > 0", name="ck_sale_items_price_positive"),
        Index("ix_sale_items_product_id", "product_id"),
        Index("ix_sale_items_sale_id", "sale_id"),
        {"comment": "Line items — profit = (unit_price - unit_cost) * quantity"},
    )

    sale_item_id: Mapped[int] = mapped_column(primary_key=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.sale_id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    sale: Mapped["Sale"] = relationship("Sale", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="sale_items")
