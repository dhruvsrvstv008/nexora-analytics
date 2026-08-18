from datetime import date, datetime
from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey, CheckConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        CheckConstraint("salary > 0", name="ck_employees_salary_positive"),
        CheckConstraint("status IN ('active', 'resigned', 'terminated')", name="ck_employees_status"),
        CheckConstraint("job_level IN ('executive', 'manager', 'senior', 'associate')", name="ck_employees_job_level"),
        Index("ix_employees_department_id", "department_id"),
        Index("ix_employees_manager_id", "manager_id"),
        {"comment": "All employees; manager_id forms a self-referencing hierarchy"},
    )

    employee_id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.department_id"), nullable=False)
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("employees.employee_id"), nullable=True)
    job_title: Mapped[str] = mapped_column(String(100), nullable=False)
    job_level: Mapped[str] = mapped_column(String(20), nullable=False)
    salary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    hire_date: Mapped[date] = mapped_column(Date, nullable=False)
    exit_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    department: Mapped["Department"] = relationship("Department", back_populates="employees")
    manager: Mapped["Employee | None"] = relationship("Employee", remote_side="Employee.employee_id", back_populates="reports")
    reports: Mapped[list["Employee"]] = relationship("Employee", back_populates="manager")
    user: Mapped["User | None"] = relationship("User", back_populates="employee", uselist=False)
    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="employee")
    targets: Mapped[list["Target"]] = relationship("Target", back_populates="employee")
