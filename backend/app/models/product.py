from sqlalchemy import String, Numeric, Integer, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("unit_cost > 0", name="ck_products_unit_cost_positive"),
        CheckConstraint("unit_price > unit_cost", name="ck_products_price_gt_cost"),
        CheckConstraint("reorder_level >= 0", name="ck_products_reorder_level_nonneg"),
        {"comment": "Product catalogue with pricing and reorder thresholds"},
    )

    product_id: Mapped[int] = mapped_column(primary_key=True)
    sku: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.category_id"), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    category: Mapped["Category"] = relationship("Category", back_populates="products")
    inventory: Mapped["Inventory | None"] = relationship("Inventory", back_populates="product", uselist=False)
    stock_movements: Mapped[list["StockMovement"]] = relationship("StockMovement", back_populates="product")
    sale_items: Mapped[list["SaleItem"]] = relationship("SaleItem", back_populates="product")
