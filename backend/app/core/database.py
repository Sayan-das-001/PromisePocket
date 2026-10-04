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
        logger.info("Connecting to MongoDB Atlas at %s...", settings.MONGODB_URI.split("@")[-1] if "@" in settings.MONGODB_URI else "URI")
        
        client_kwargs = {
            "serverSelectionTimeoutMS": settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
            "appname": "PromisePocket",
        }
        
        try:
            import certifi
            client_kwargs["tlsCAFile"] = certifi.where()
        except Exception:
            pass

        _mongo_client = MongoClient(settings.MONGODB_URI, **client_kwargs)
        # Verify connection
        _mongo_client.admin.command("ping")
        _database = _mongo_client[settings.MONGODB_DATABASE]
        _is_connected = True
        logger.info("Successfully connected to MongoDB Atlas database: %s", settings.MONGODB_DATABASE)

        # Initialize indexes
        _setup_indexes(_database)
        _seed_initial_demo_if_empty(_database)
        return True
    except Exception as e:
        logger.warning("MongoDB Atlas connection attempt encountered issue (%s). Using fallback memory store.", str(e))
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


def _seed_initial_demo_if_empty(db: Database) -> None:
    try:
        if db.users.count_documents({}) == 0:
            logger.info("Atlas database is empty. Auto-seeding initial demo data...")
            from datetime import datetime, timezone
            from app.services.demo_data import generate_demo_dataset

            user_id = "demo-user-1"
            db.users.insert_one({
                "_id": user_id,
                "id": user_id,
                "email": "demo@promisepocket.ai",
                "display_name": "Sarah",
                "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
                "timezone": "Asia/Kolkata",
                "preferred_reminder_lead_minutes": 30,
                "default_reminder_time": "09:00",
                "ai_provider": "ollama",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

            dataset = generate_demo_dataset(user_id)
            if dataset["people"]:
                db.people.insert_many([{**p, "_id": p["id"]} for p in dataset["people"]])
            if dataset["commitments"]:
                db.commitments.insert_many([{**c, "_id": c["id"]} for c in dataset["commitments"]])
            if dataset["notifications"]:
                db.notifications.insert_many([{**n, "_id": n["id"]} for n in dataset["notifications"]])
            logger.info("Auto-seeded initial demo dataset into Atlas successfully.")
    except Exception as e:
        logger.warning("Auto-seed notice: %s", str(e))


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
