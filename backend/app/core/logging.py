"""
Structured logging with correlation IDs for request tracking
"""
import logging
import uuid
from contextvars import ContextVar
from typing import Optional
from pythonjsonlogger import jsonlogger

# Context variable for request ID tracking
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


class RequestIdFilter(logging.Filter):
    """Filter to add request ID to log records"""
    
    def filter(self, record):
        """Add request_id to the log record"""
        record.request_id = request_id_var.get() or 'N/A'
        return True


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging"""
    
    def add_fields(self, log_record, record, message_dict):
        """Add custom fields to log record"""
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        
        # Add timestamp
        if not log_record.get('timestamp'):
            log_record['timestamp'] = record.created
        
        # Add log level
        if log_record.get('level'):
            log_record['level'] = record.levelname
        else:
            log_record['level'] = record.levelname
        
        # Add request ID from context
        log_record['request_id'] = request_id_var.get() or 'N/A'


def setup_logging(log_level: str = "INFO", json_logs: bool = True) -> logging.Logger:
    """
    Setup structured logging for the application
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Whether to use JSON formatting
        
    Returns:
        Configured logger instance
    """
    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    
    # Add request ID filter
    request_id_filter = RequestIdFilter()
    console_handler.addFilter(request_id_filter)
    
    # Set formatter
    if json_logs:
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a module
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def set_request_id(request_id: Optional[str] = None) -> str:
    """
    Set request ID in context variable
    
    Args:
        request_id: Request ID to set, or None to generate a new one
        
    Returns:
        The request ID that was set
    """
    if request_id is None:
        request_id = str(uuid.uuid4())
    
    request_id_var.set(request_id)
    return request_id


def get_request_id() -> Optional[str]:
    """
    Get current request ID from context
    
    Returns:
        Current request ID or None
    """
    return request_id_var.get()


def clear_request_id():
    """Clear request ID from context"""
    request_id_var.set(None)
