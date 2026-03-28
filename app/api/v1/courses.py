import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User, UserRole
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate, EnrollResponse
from app.services.gamification_service import award_points

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseResponse])
async def list_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Course).where(Course.tenant_id == current_user.tenant_id)
    if current_user.role == UserRole.LEARNER:
        query = query.where(Course.is_published.is_(True))
    result = await db.execute(query.order_by(Course.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    body: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
):
    course = Course(
        tenant_id=current_user.tenant_id,
        title=body.title,
        description=body.description,
        difficulty_level=body.difficulty_level,
    )
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    body: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
):
    result = await db.execute(
        select(Course).where(
            Course.id == uuid.UUID(course_id),
            Course.tenant_id == current_user.tenant_id,
        )
    )
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(course, key, value)

    await db.flush()
    await db.refresh(course)
    return course


@router.post("/{course_id}/enroll", response_model=EnrollResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = uuid.UUID(course_id)
    course_result = await db.execute(
        select(Course).where(
            Course.id == cid,
            Course.tenant_id == current_user.tenant_id,
            Course.is_published.is_(True),
        )
    )
    if course_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == cid,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already enrolled")

    enrollment = Enrollment(user_id=current_user.id, course_id=cid)
    db.add(enrollment)
    await db.flush()

    await award_points(db, current_user.id, 10, f"Enrolled in course {course_id}")

    await db.refresh(enrollment)
    return enrollment
