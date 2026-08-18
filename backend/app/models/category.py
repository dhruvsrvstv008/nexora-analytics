from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = {"comment": "Product categories with optional parent for hierarchy"}

    category_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    parent_category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.category_id"), nullable=True)

    parent: Mapped["Category | None"] = relationship("Category", remote_side="Category.category_id", back_populates="children")
    children: Mapped[list["Category"]] = relationship("Category", back_populates="parent")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")
