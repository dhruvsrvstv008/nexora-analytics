from datetime import date
from sqlalchemy import String, Numeric, Date, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint(
            "expense_category IN ('payroll', 'operations', 'marketing', 'infrastructure', 'misc')",
            name="ck_expenses_category",
        ),
        CheckConstraint("amount > 0", name="ck_expenses_amount_positive"),
        Index("ix_expenses_department_id", "department_id"),
        Index("ix_expenses_expense_date", "expense_date"),
        {"comment": "Departmental cost entries for finance analytics"},
    )

    expense_id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.department_id"), nullable=False)
    expense_category: Mapped[str] = mapped_column(String(30), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    department: Mapped["Department"] = relationship("Department", back_populates="expenses")
