"""
Review and Rating API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse

router = APIRouter()


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new review (patients only)
    """
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create reviews",
        )

    # Check if patient already reviewed this doctor
    existing_review = (
        db.query(Review)
        .filter(
            Review.patient_id == current_user.id,
            Review.doctor_id == review.doctor_id,
        )
        .first()
    )

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this doctor",
        )

    db_review = Review(
        **review.dict(),
        patient_id=current_user.id,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    # Update doctor's rating average
    update_doctor_rating(db, review.doctor_id)

    return db_review


@router.get("", response_model=List[ReviewResponse])
@router.get("/", response_model=List[ReviewResponse], include_in_schema=False)
def list_reviews(
    skip: int = 0,
    limit: int = 100,
    doctor_id: Optional[int] = Query(None, description="Filter by doctor"),
    db: Session = Depends(get_db),
):
    """
    List reviews
    """
    query = db.query(Review).filter(Review.is_hidden == False)

    if doctor_id:
        query = query.filter(Review.doctor_id == doctor_id)

    reviews = query.offset(skip).limit(limit).all()
    return reviews


@router.get("/doctor/{doctor_id}", response_model=List[ReviewResponse])
def get_doctor_reviews(
    doctor_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get all reviews for a specific doctor
    """
    reviews = (
        db.query(Review)
        .filter(Review.doctor_id == doctor_id, Review.is_hidden == False)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return reviews


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific review
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    return review


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review_update: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a review (patients can update their own reviews)
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    if current_user.role == "patient" and review.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this review",
        )

    for field, value in review_update.dict(exclude_unset=True).items():
        setattr(review, field, value)

    db.commit()
    db.refresh(review)

    # Update doctor's rating average if rating changed
    if "rating" in review_update.dict(exclude_unset=True):
        update_doctor_rating(db, review.doctor_id)

    return review


@router.post("/{review_id}/respond", response_model=ReviewResponse)
def respond_to_review(
    review_id: int,
    response: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Doctor responds to a review
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can respond to reviews",
        )

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    if review.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to respond to this review",
        )

    review.doctor_response = response
    db.commit()
    db.refresh(review)

    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a review (patients can delete their own, admins can delete any)
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    if current_user.role == "patient" and review.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review",
        )
    elif current_user.role == "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctors cannot delete reviews",
        )

    db.delete(review)
    db.commit()

    # Update doctor's rating average
    update_doctor_rating(db, review.doctor_id)

    return None


def update_doctor_rating(db: Session, doctor_id: int):
    """
    Update doctor's average rating and count
    """
    reviews = db.query(Review).filter(
        Review.doctor_id == doctor_id,
        Review.is_hidden == False,
    ).all()

    if reviews:
        total_rating = sum(r.rating for r in reviews)
        avg_rating = total_rating / len(reviews)

        doctor = db.query(User).filter(User.id == doctor_id).first()
        if doctor:
            doctor.rating_average = round(avg_rating, 1)
            doctor.rating_count = len(reviews)
            db.commit()
