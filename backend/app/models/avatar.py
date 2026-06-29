import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class AvatarMeasurements(Base):
    __tablename__ = "avatar_measurements"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    height: Mapped[float] = mapped_column(Float, nullable=False)
    bust: Mapped[float] = mapped_column(Float, nullable=False)
    waist: Mapped[float] = mapped_column(Float, nullable=False)
    hips: Mapped[float] = mapped_column(Float, nullable=False)
    shoulder_width: Mapped[float] = mapped_column(Float, nullable=False)
    torso_length: Mapped[float] = mapped_column(Float, nullable=False)
    leg_length: Mapped[float] = mapped_column(Float, nullable=False)
    arm_length: Mapped[float] = mapped_column(Float, nullable=False)
    arm_girth: Mapped[float] = mapped_column(Float, nullable=False)
    thigh_girth: Mapped[float] = mapped_column(Float, nullable=False)
    calf_girth: Mapped[float] = mapped_column(Float, nullable=False)
    shoe_size: Mapped[float] = mapped_column(Float, nullable=False)
    sex: Mapped[str | None] = mapped_column(String(10), nullable=True)
    age_group: Mapped[str | None] = mapped_column(String(20), nullable=True)
    body_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    skin_tone: Mapped[str | None] = mapped_column(String(10), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
