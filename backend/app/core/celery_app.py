"""
Celery application configuration
"""
from celery import Celery
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "sante",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks"]
)

# Configure Celery with advanced features
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task execution
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
    
    # Result backend
    result_expires=3600,  # 1 hour
    result_backend_transport_options={
        'master_name': 'mymaster',
        'visibility_timeout': 3600,
    },
    
    # Retry configuration
    task_acks_late=True,  # Acknowledge task after execution, not before
    task_reject_on_worker_lost=True,  # Reject task if worker dies
    
    # Task routing
    task_routes={
        'app.tasks.send_email': {'queue': 'email'},
        'app.tasks.send_sms': {'queue': 'sms'},
        'app.tasks.send_appointment_reminders': {'queue': 'notifications'},
    },
    
    # Worker configuration
    worker_prefetch_multiplier=4,  # Number of tasks to prefetch
    worker_max_tasks_per_child=1000,  # Restart worker after N tasks
    worker_disable_rate_limits=False,
    
    # Dead letter queue (via task_reject_on_worker_lost and acks_late)
    # Failed tasks will be requeued automatically
    
    # Monitoring (for Flower)
    worker_send_task_events=True,
    task_send_sent_event=True,
)

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    "send-appointment-reminders": {
        "task": "app.tasks.send_appointment_reminders",
        "schedule": 3600.0,  # Every hour
    },
}

if __name__ == "__main__":
    celery_app.start()
