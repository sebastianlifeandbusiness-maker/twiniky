from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AvatarMeasurementsIn(BaseModel):
    height: float = Field(ge=100, le=220)
    bust: float = Field(ge=50, le=150)
    waist: float = Field(ge=40, le=130)
    hips: float = Field(ge=50, le=150)
    shoulder_width: float = Field(ge=25, le=65)
    torso_length: float = Field(ge=35, le=90)
    leg_length: float = Field(ge=55, le=120)
    arm_length: float = Field(ge=30, le=95)
    arm_girth: float = Field(ge=15, le=55)
    thigh_girth: float = Field(ge=30, le=95)
    calf_girth: float = Field(ge=20, le=65)
    shoe_size: float = Field(ge=33, le=48)
    sex: Optional[str] = None
    age_group: Optional[str] = None
    body_type: Optional[str] = None
    weight: Optional[float] = Field(default=None, ge=20, le=300)


class AvatarMeasurementsOut(AvatarMeasurementsIn):
    updated_at: datetime

    model_config = {"from_attributes": True}
