"""
File Upload Service
Handles file uploads with validation and storage
"""
import os
import uuid
from typing import Optional
from datetime import datetime
from fastapi import UploadFile, HTTPException, status
import magic
from pathlib import Path

from app.core.config import settings


class FileUploadService:
    """Service for handling file uploads"""

    # Allowed file types and their MIME types
    ALLOWED_TYPES = {
        "image": ["image/jpeg", "image/png", "image/gif", "image/webp"],
        "document": [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        "medical": [
            "application/pdf",
            "application/dicom",
            "image/jpeg",
            "image/png",
        ],
    }

    # Maximum file sizes (in bytes)
    MAX_SIZES = {
        "image": 10 * 1024 * 1024,  # 10 MB
        "document": 20 * 1024 * 1024,  # 20 MB
        "medical": 50 * 1024 * 1024,  # 50 MB
    }

    def __init__(self):
        self.upload_dir = getattr(settings, "UPLOAD_DIR", "./uploads")
        self._ensure_upload_dirs()

    def _ensure_upload_dirs(self):
        """Ensure upload directories exist"""
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)
        for category in ["images", "documents", "medical"]:
            Path(f"{self.upload_dir}/{category}").mkdir(parents=True, exist_ok=True)

    async def upload_file(
        self,
        file: UploadFile,
        category: str = "document",
        user_id: Optional[int] = None,
    ) -> dict:
        """
        Upload a file with validation

        Args:
            file: The uploaded file
            category: File category (image, document, medical)
            user_id: Optional user ID for organization

        Returns:
            dict with file information (path, url, size, etc.)

        Raises:
            HTTPException if validation fails
        """
        # Validate file type
        if category not in self.ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category. Must be one of: {list(self.ALLOWED_TYPES.keys())}",
            )

        # Read file content for validation
        content = await file.read()
        file_size = len(content)

        # Validate file size
        max_size = self.MAX_SIZES.get(category, 10 * 1024 * 1024)
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {max_size / (1024 * 1024):.1f} MB",
            )

        # Validate MIME type using python-magic
        mime_type = magic.from_buffer(content, mime=True)
        allowed_types = self.ALLOWED_TYPES[category]

        if mime_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}",
            )

        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"

        # Organize by category and optionally by user
        if user_id:
            file_path = f"{self.upload_dir}/{category}/{user_id}/{unique_filename}"
            Path(f"{self.upload_dir}/{category}/{user_id}").mkdir(
                parents=True, exist_ok=True
            )
        else:
            file_path = f"{self.upload_dir}/{category}/{unique_filename}"

        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        # Return file information
        return {
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_url": f"/uploads/{category}/{user_id}/{unique_filename}" if user_id else f"/uploads/{category}/{unique_filename}",
            "file_size": file_size,
            "mime_type": mime_type,
            "category": category,
            "uploaded_at": datetime.utcnow().isoformat(),
        }

    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage

        Args:
            file_path: Path to the file to delete

        Returns:
            bool indicating success
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False

    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get information about a file

        Args:
            file_path: Path to the file

        Returns:
            dict with file information or None if file doesn't exist
        """
        if not os.path.exists(file_path):
            return None

        stat = os.stat(file_path)
        return {
            "file_path": file_path,
            "file_size": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        }


# Global instance
file_service = FileUploadService()
