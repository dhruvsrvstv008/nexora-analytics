from datetime import date, datetime
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, CheckConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (
        CheckConstraint("quantity_on_hand >= 0", name="ck_inventory_quantity_nonneg"),
        {"comment": "Current stock levels — one record per product"},
    )

    inventory_id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id"), nullable=False, unique=True)
    quantity_on_hand: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warehouse_location: Mapped[str] = mapped_column(String(50), nullable=True)
    last_restocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product: Mapped["Product"] = relationship("Product", back_populates="inventory")


class StockMovement(Base):
    __tablename__ = "stock_movements"
    __table_args__ = (
        CheckConstraint("movement_type IN ('inbound', 'outbound', 'adjustment')", name="ck_stock_movement_type"),
        Index("ix_stock_movements_product_date", "product_id", "movement_date"),
        {"comment": "All stock in/out events — powers turnover and velocity analytics"},
    )

    movement_id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id"), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    movement_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    product: Mapped["Product"] = relationship("Product", back_populates="stock_movements")
