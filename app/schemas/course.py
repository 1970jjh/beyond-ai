import uuid
from datetime import datetime

from pydantic import BaseModel


class CourseCreate(BaseModel):
    title: str
    description: str | None = None
    difficulty_level: int = 1


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    difficulty_level: int | None = None
    is_published: bool | None = None


class CourseResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    description: str | None
    difficulty_level: int
    is_published: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class EnrollResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    course_id: uuid.UUID
    status: str
    enrolled_at: datetime

    model_config = {"from_attributes": True}
