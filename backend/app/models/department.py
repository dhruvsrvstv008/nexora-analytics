from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Department(Base):
    __tablename__ = "departments"
    __table_args__ = {"comment": "Business units / cost centres"}

    department_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    cost_center_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    employees: Mapped[list["Employee"]] = relationship("Employee", back_populates="department")
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="department")
    targets: Mapped[list["Target"]] = relationship("Target", back_populates="department")
