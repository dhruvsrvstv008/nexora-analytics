from sqlalchemy import String, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Region(Base):
    __tablename__ = "regions"
    __table_args__ = (
        CheckConstraint("zone IN ('North', 'South', 'East', 'West')", name="ck_regions_zone"),
        {"comment": "Geographic sales territories"},
    )

    region_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    zone: Mapped[str] = mapped_column(String(10), nullable=False)

    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="region")
