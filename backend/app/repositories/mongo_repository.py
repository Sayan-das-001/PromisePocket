import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pymongo.database import Database
from app.repositories.base import (
    IUserRepository,
    ICommitmentRepository,
    IPersonRepository,
    IReminderRepository,
    INotificationRepository,
)


class MongoUserRepository(IUserRepository):
    def __init__(self, db: Database):
        self._col = db.users

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        doc = self._col.find_one({"id": user_id}, {"_id": 0})
        return doc

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        doc = self._col.find_one({"email": email.lower()}, {"_id": 0})
        return doc

    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = user_data.get("id") or str(uuid.uuid4())
        record = {
            **user_data,
            "id": user_id,
            "email": user_data["email"].lower(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._col.insert_one({**record, "_id": user_id})
        return record

    async def update(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._col.update_one({"id": user_id}, {"$set": updates})
        return await self.get_by_id(user_id)


class MongoCommitmentRepository(ICommitmentRepository):
    def __init__(self, db: Database):
        self._col = db.commitments

    async def get_by_id(self, user_id: str, commitment_id: str) -> Optional[Dict[str, Any]]:
        return self._col.find_one({"id": commitment_id, "user_id": user_id}, {"_id": 0})

    async def list(
        self,
        user_id: str,
        status: Optional[str] = None,
        person_id: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status
        if person_id:
            query["$or"] = [{"person_id": person_id}, {"person_name_snapshot": person_id}]
        if category:
            query["category"] = category
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"person_name_snapshot": {"$regex": search, "$options": "i"}},
            ]
        if from_date or to_date:
            date_filter: Dict[str, Any] = {}
            if from_date:
                date_filter["$gte"] = from_date
            if to_date:
                date_filter["$lte"] = to_date
            query["due_at"] = date_filter

        cursor = self._col.find(query, {"_id": 0}).sort("due_at", 1)
        return list(cursor)

    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        comm_id = data.get("id") or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            **data,
            "id": comm_id,
            "user_id": user_id,
            "created_at": now,
            "updated_at": now,
        }
        self._col.insert_one({**record, "_id": comm_id})
        return record

    async def update(self, user_id: str, commitment_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = now
        res = self._col.update_one(
            {"id": commitment_id, "user_id": user_id},
            {"$set": updates}
        )
        if res.matched_count == 0:
            return None
        return await self.get_by_id(user_id, commitment_id)

    async def delete(self, user_id: str, commitment_id: str) -> bool:
        res = self._col.delete_one({"id": commitment_id, "user_id": user_id})
        return res.deleted_count > 0


class MongoPersonRepository(IPersonRepository):
    def __init__(self, db: Database):
        self._col = db.people

    async def get_by_id(self, user_id: str, person_id: str) -> Optional[Dict[str, Any]]:
        return self._col.find_one({"id": person_id, "user_id": user_id}, {"_id": 0})

    async def get_by_name(self, user_id: str, name: str) -> Optional[Dict[str, Any]]:
        return self._col.find_one(
            {"user_id": user_id, "name": {"$regex": f"^{name}$", "$options": "i"}},
            {"_id": 0}
        )

    async def list(self, user_id: str) -> List[Dict[str, Any]]:
        cursor = self._col.find({"user_id": user_id}, {"_id": 0}).sort("name", 1)
        return list(cursor)

    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        p_id = data.get("id") or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            **data,
            "id": p_id,
            "user_id": user_id,
            "created_at": now,
            "updated_at": now,
        }
        self._col.insert_one({**record, "_id": p_id})
        return record

    async def update(self, user_id: str, person_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = now
        res = self._col.update_one(
            {"id": person_id, "user_id": user_id},
            {"$set": updates}
        )
        if res.matched_count == 0:
            return None
        return await self.get_by_id(user_id, person_id)

    async def delete(self, user_id: str, person_id: str) -> bool:
        res = self._col.delete_one({"id": person_id, "user_id": user_id})
        return res.deleted_count > 0


class MongoReminderRepository(IReminderRepository):
    def __init__(self, db: Database):
        self._col = db.reminders

    async def get_by_id(self, user_id: str, reminder_id: str) -> Optional[Dict[str, Any]]:
        return self._col.find_one({"id": reminder_id, "user_id": user_id}, {"_id": 0})

    async def get_by_commitment_id(self, user_id: str, commitment_id: str) -> Optional[Dict[str, Any]]:
        return self._col.find_one({"commitment_id": commitment_id, "user_id": user_id}, {"_id": 0})

    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        r_id = data.get("id") or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        record = {
            **data,
            "id": r_id,
            "user_id": user_id,
            "status": data.get("status", "scheduled"),
            "attempt_count": 0,
            "created_at": now,
        }
        self._col.insert_one({**record, "_id": r_id})
        return record

    async def update(self, user_id: str, reminder_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = self._col.update_one(
            {"id": reminder_id, "user_id": user_id},
            {"$set": updates}
        )
        if res.matched_count == 0:
            return None
        return await self.get_by_id(user_id, reminder_id)

    async def delete(self, user_id: str, reminder_id: str) -> bool:
        res = self._col.delete_one({"id": reminder_id, "user_id": user_id})
        return res.deleted_count > 0


class MongoNotificationRepository(INotificationRepository):
    def __init__(self, db: Database):
        self._col = db.notifications

    async def list(self, user_id: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"user_id": user_id}
        if unread_only:
            query["read_at"] = None
        cursor = self._col.find(query, {"_id": 0}).sort("created_at", -1)
        return list(cursor)

    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        n_id = data.get("id") or str(uuid.uuid4())
        record = {
            **data,
            "id": n_id,
            "user_id": user_id,
            "read_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._col.insert_one({**record, "_id": n_id})
        return record

    async def mark_read(self, user_id: str, notification_id: str) -> bool:
        res = self._col.update_one(
            {"id": notification_id, "user_id": user_id},
            {"$set": {"read_at": datetime.now(timezone.utc).isoformat()}}
        )
        return res.matched_count > 0
