from typing import Tuple
from app.core.database import get_database, is_mongo_connected
from app.repositories.base import (
    IUserRepository,
    ICommitmentRepository,
    IPersonRepository,
    IReminderRepository,
    INotificationRepository,
)
from app.repositories.memory_repository import (
    MemoryUserRepository,
    MemoryCommitmentRepository,
    MemoryPersonRepository,
    MemoryReminderRepository,
    MemoryNotificationRepository,
)
from app.repositories.mongo_repository import (
    MongoUserRepository,
    MongoCommitmentRepository,
    MongoPersonRepository,
    MongoReminderRepository,
    MongoNotificationRepository,
)

# Singleton in-memory instances
_memory_users = MemoryUserRepository()
_memory_commitments = MemoryCommitmentRepository()
_memory_people = MemoryPersonRepository()
_memory_reminders = MemoryReminderRepository()
_memory_notifications = MemoryNotificationRepository()


def get_user_repository() -> IUserRepository:
    db = get_database()
    if db and is_mongo_connected():
        return MongoUserRepository(db)
    return _memory_users


def get_commitment_repository() -> ICommitmentRepository:
    db = get_database()
    if db and is_mongo_connected():
        return MongoCommitmentRepository(db)
    return _memory_commitments


def get_person_repository() -> IPersonRepository:
    db = get_database()
    if db and is_mongo_connected():
        return MongoPersonRepository(db)
    return _memory_people


def get_reminder_repository() -> IReminderRepository:
    db = get_database()
    if db and is_mongo_connected():
        return MongoReminderRepository(db)
    return _memory_reminders


def get_notification_repository() -> INotificationRepository:
    db = get_database()
    if db and is_mongo_connected():
        return MongoNotificationRepository(db)
    return _memory_notifications


def reset_memory_demo(user_id: str):
    db = get_database()
    if db and is_mongo_connected():
        from app.services.demo_data import generate_demo_dataset
        db.commitments.delete_many({"user_id": user_id})
        db.people.delete_many({"user_id": user_id})
        db.notifications.delete_many({"user_id": user_id})
        demo = generate_demo_dataset(user_id)
        if demo["people"]:
            db.people.insert_many([{**p, "_id": p["id"]} for p in demo["people"]])
        if demo["commitments"]:
            db.commitments.insert_many([{**c, "_id": c["id"]} for c in demo["commitments"]])
        if demo["notifications"]:
            db.notifications.insert_many([{**n, "_id": n["id"]} for n in demo["notifications"]])
    else:
        _memory_commitments.reset_demo(user_id)
        _memory_people.reset_demo(user_id)
