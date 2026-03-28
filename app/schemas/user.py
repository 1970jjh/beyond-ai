import uuid

from pydantic import BaseModel

from app.models.user import UserRole


class UserListResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role: UserRole
