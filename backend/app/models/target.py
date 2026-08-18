from datetime import date
from sqlalchemy import Date, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Target(Base):
    __tablename__ = "targets"
    __table_args__ = (
        CheckConstraint("target_amount > 0", name="ck_targets_amount_positive"),
        CheckConstraint(
            "(employee_id IS NOT NULL AND department_id IS NULL) OR (employee_id IS NULL AND department_id IS NOT NULL)",
            name="ck_targets_scope_xor",
        ),
        {"comment": "Sales targets — either individual (employee_id) or team (department_id)"},
    )

    target_id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.employee_id"), nullable=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.department_id"), nullable=True)
    period_month: Mapped[date] = mapped_column(Date, nullable=False)
    target_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    employee: Mapped["Employee | None"] = relationship("Employee", back_populates="targets")
    department: Mapped["Department | None"] = relationship("Department", back_populates="targets")
