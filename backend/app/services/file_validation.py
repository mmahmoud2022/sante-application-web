"""
File upload validation and processing service
"""
import os
import hashlib
import logging
import magic
from typing import Optional, Tuple
from PIL import Image
from io import BytesIO

from app.core.config import settings

logger = logging.getLogger(__name__)


class FileValidationError(Exception):
    """Custom exception for file validation errors"""
    pass


def validate_file_size(file_size: int, max_size: Optional[int] = None) -> bool:
    """
    Validate file size
    
    Args:
        file_size: File size in bytes
        max_size: Maximum allowed size in bytes (defaults to settings.MAX_UPLOAD_SIZE)
    
    Returns:
        True if valid
        
    Raises:
        FileValidationError if file is too large
    """
    max_allowed = max_size or settings.MAX_UPLOAD_SIZE
    if file_size > max_allowed:
        raise FileValidationError(
            f"File size {file_size} bytes exceeds maximum allowed size {max_allowed} bytes"
        )
    return True


def validate_file_type(file_content: bytes, allowed_types: Optional[list] = None) -> Tuple[str, str]:
    """
    Validate file type using magic numbers (more secure than extension checking)
    
    Args:
        file_content: File content as bytes
        allowed_types: List of allowed MIME types (defaults to common document/image types)
    
    Returns:
        Tuple of (mime_type, extension)
        
    Raises:
        FileValidationError if file type is not allowed
    """
    # Detect MIME type using magic numbers
    mime_type = magic.from_buffer(file_content, mime=True)
    
    # Default allowed types if not specified
    if allowed_types is None:
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]
    
    if mime_type not in allowed_types:
        raise FileValidationError(
            f"File type {mime_type} is not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Map MIME type to extension
    mime_to_ext = {
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    }
    
    extension = mime_to_ext.get(mime_type, '')
    
    return mime_type, extension


def scan_for_viruses(file_path: str) -> bool:
    """
    Scan file for viruses using ClamAV
    
    Note: This requires ClamAV to be installed and running
    In production, you would integrate with clamd
    
    Args:
        file_path: Path to file to scan
    
    Returns:
        True if clean
        
    Raises:
        FileValidationError if virus detected or scan fails
    """
    # Placeholder implementation
    # In production, integrate with ClamAV:
    # 
    # import clamd
    # cd = clamd.ClamdUnixSocket()
    # scan_result = cd.scan(file_path)
    # 
    # if scan_result and 'FOUND' in scan_result[file_path][0]:
    #     raise FileValidationError(f"Virus detected: {scan_result[file_path][1]}")
    
    # For now, just return True
    # TODO: Implement actual virus scanning with ClamAV
    return True


def generate_thumbnail(image_content: bytes, size: Tuple[int, int] = (200, 200)) -> bytes:
    """
    Generate thumbnail for an image
    
    Args:
        image_content: Original image content as bytes
        size: Thumbnail size as (width, height) tuple
    
    Returns:
        Thumbnail image content as bytes
        
    Raises:
        FileValidationError if image processing fails
    """
    try:
        image = Image.open(BytesIO(image_content))
        
        # Convert RGBA to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background
        
        # Create thumbnail
        image.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        return output.getvalue()
        
    except Exception as e:
        raise FileValidationError(f"Failed to generate thumbnail: {str(e)}")


def calculate_file_hash(file_content: bytes) -> str:
    """
    Calculate SHA-256 hash of file content
    
    Useful for:
    - Detecting duplicate uploads
    - Verifying file integrity
    - Content-based addressing
    
    Args:
        file_content: File content as bytes
    
    Returns:
        Hexadecimal hash string
    """
    return hashlib.sha256(file_content).hexdigest()


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal and other attacks
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename
    """
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove or replace dangerous characters
    dangerous_chars = ['..', '/', '\\', '\0', ':', '*', '?', '"', '<', '>', '|']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    
    return name + ext


class FileUploadService:
    """
    Complete file upload validation and processing service
    """
    
    @staticmethod
    async def validate_and_process_upload(
        file_content: bytes,
        filename: str,
        max_size: Optional[int] = None,
        allowed_types: Optional[list] = None,
        scan_viruses: bool = True,
        generate_thumb: bool = False
    ) -> dict:
        """
        Validate and process an uploaded file
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            max_size: Maximum file size in bytes
            allowed_types: List of allowed MIME types
            scan_viruses: Whether to scan for viruses
            generate_thumb: Whether to generate thumbnail for images
        
        Returns:
            Dictionary with processed file information
            
        Raises:
            FileValidationError if validation fails
        """
        # Validate size
        validate_file_size(len(file_content), max_size)
        
        # Validate type
        mime_type, extension = validate_file_type(file_content, allowed_types)
        
        # Sanitize filename
        safe_filename = sanitize_filename(filename)
        
        # Calculate hash
        file_hash = calculate_file_hash(file_content)
        
        result = {
            'original_filename': filename,
            'safe_filename': safe_filename,
            'mime_type': mime_type,
            'extension': extension,
            'size': len(file_content),
            'hash': file_hash,
            'thumbnail': None
        }
        
        # Generate thumbnail for images
        if generate_thumb and mime_type.startswith('image/'):
            try:
                thumbnail = generate_thumbnail(file_content)
                result['thumbnail'] = thumbnail
            except Exception as e:
                # Thumbnail generation is optional, so don't fail
                logger.warning(f"Failed to generate thumbnail: {e}")
        
        # Virus scanning would happen here
        # For now, we skip it in development
        # if scan_viruses:
        #     scan_for_viruses(temp_file_path)
        
        return result
