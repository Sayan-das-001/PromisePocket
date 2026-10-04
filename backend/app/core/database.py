import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from app.core.config import settings

logger = logging.getLogger(__name__)

_mongo_client: Optional[MongoClient] = None
_database: Optional[Database] = None
_is_connected: bool = False


def connect_to_mongo() -> bool:
    global _mongo_client, _database, _is_connected
    if not settings.MONGODB_URI:
        logger.info("No MONGODB_URI configured. Running in memory / demo store mode.")
        _is_connected = False
        return False

    try:
        logger.info("Connecting to MongoDB Atlas...")
        _mongo_client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
            appname="PromisePocket",
        )
        # Verify connection
        _mongo_client.admin.command("ping")
        _database = _mongo_client[settings.MONGODB_DATABASE]
        _is_connected = True
        logger.info("Successfully connected to MongoDB Atlas database: %s", settings.MONGODB_DATABASE)

        # Initialize indexes
        _setup_indexes(_database)
        return True
    except Exception as e:
        logger.warning("MongoDB Atlas connection failed (%s). Falling back to memory store.", str(e))
        _is_connected = False
        _mongo_client = None
        _database = None
        return False


def _setup_indexes(db: Database) -> None:
    try:
        # Commitments collection indexes
        db.commitments.create_index([("user_id", 1), ("status", 1)])
        db.commitments.create_index([("user_id", 1), ("due_at", 1)])
        db.commitments.create_index([("user_id", 1), ("person_id", 1)])
        db.commitments.create_index([("title", "text"), ("description", "text")])

        # People collection indexes
        db.people.create_index([("user_id", 1), ("name", 1)])

        # Users collection indexes
        db.users.create_index([("email", 1)], unique=True)

        # Reminders collection indexes
        db.reminders.create_index([("user_id", 1), ("commitment_id", 1)])
        db.reminders.create_index([("scheduled_at", 1), ("status", 1)])

        # Notifications collection indexes
        db.notifications.create_index([("user_id", 1), ("read_at", 1)])
        logger.info("MongoDB Atlas indexes ensured successfully.")
    except Exception as e:
        logger.warning("Failed to create some MongoDB indexes: %s", str(e))


def close_mongo_connection() -> None:
    global _mongo_client, _database, _is_connected
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        _database = None
        _is_connected = False
        logger.info("MongoDB connection closed.")


def get_database() -> Optional[Database]:
    return _database


def is_mongo_connected() -> bool:
    return _is_connected
