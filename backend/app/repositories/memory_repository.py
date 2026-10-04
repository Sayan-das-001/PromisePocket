import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.repositories.base import (
    IUserRepository,
    ICommitmentRepository,
    IPersonRepository,
    IReminderRepository,
    INotificationRepository,
)
from app.services.demo_data import generate_demo_dataset


class MemoryUserRepository(IUserRepository):
    def __init__(self):
        self._users: Dict[str, Dict[str, Any]] = {
            "demo-user-1": {
                "id": "demo-user-1",
                "email": "demo@promisepocket.ai",
                "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", # "demo1234"
                "display_name": "Sarah",
                "timezone": "Asia/Kolkata",
                "preferred_reminder_lead_minutes": 30,
                "default_reminder_time": "09:00",
                "ai_provider": "ollama",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        }

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self._users.get(user_id)

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        for u in self._users.values():
            if u["email"].lower() == email.lower():
                return u
        return None

    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = user_data.get("id") or str(uuid.uuid4())
        record = {
            **user_data,
            "id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._users[user_id] = record
        return record

    async def update(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        user = self._users.get(user_id)
        if not user:
            return None
        user.update(updates)
        return user


class MemoryCommitmentRepository(ICommitmentRepository):
    def __init__(self):
        self._commitments: Dict[str, Dict[str, Any]] = {}
        # Seed demo user commitments
        demo_data = generate_demo_dataset("demo-user-1")
        for c in demo_data["commitments"]:
            self._commitments[c["id"]] = c

    async def get_by_id(self, user_id: str, commitment_id: str) -> Optional[Dict[str, Any]]:
        c = self._commitments.get(commitment_id)
        if c and c["user_id"] == user_id:
            return c
        return None

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
        results = []
        for c in self._commitments.values():
            if c["user_id"] != user_id:
                continue
            if status and c.get("status") != status:
                continue
            if person_id and c.get("person_id") != person_id and c.get("person_name_snapshot") != person_id:
                continue
            if category and c.get("category") != category:
                continue
            if search:
                q = search.lower()
                matches = (
                    q in c.get("title", "").lower()
                    or q in (c.get("description") or "").lower()
                    or q in (c.get("person_name_snapshot") or "").lower()
                )
                if not matches:
                    continue
            if from_date and c.get("due_at") and c["due_at"] < from_date:
                continue
            if to_date and c.get("due_at") and c["due_at"] > to_date:
                continue
            results.append(c)

        # Sort by due_at
        results.sort(key=lambda x: x.get("due_at") or "9999-99-99")
        return results

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
        self._commitments[comm_id] = record
        return record

    async def update(self, user_id: str, commitment_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        c = await self.get_by_id(user_id, commitment_id)
        if not c:
            return None
        c.update(updates)
        c["updated_at"] = datetime.now(timezone.utc).isoformat()
        return c

    async def delete(self, user_id: str, commitment_id: str) -> bool:
        c = await self.get_by_id(user_id, commitment_id)
        if not c:
            return False
        del self._commitments[commitment_id]
        return True

    def reset_demo(self, user_id: str):
        # Remove old demo commitments
        self._commitments = {k: v for k, v in self._commitments.items() if v["user_id"] != user_id}
        demo_data = generate_demo_dataset(user_id)
        for c in demo_data["commitments"]:
            self._commitments[c["id"]] = c


class MemoryPersonRepository(IPersonRepository):
    def __init__(self):
        self._people: Dict[str, Dict[str, Any]] = {}
        demo_data = generate_demo_dataset("demo-user-1")
        for p in demo_data["people"]:
            self._people[p["id"]] = p

    async def get_by_id(self, user_id: str, person_id: str) -> Optional[Dict[str, Any]]:
        p = self._people.get(person_id)
        if p and p["user_id"] == user_id:
            return p
        return None

    async def get_by_name(self, user_id: str, name: str) -> Optional[Dict[str, Any]]:
        for p in self._people.values():
            if p["user_id"] == user_id and p["name"].lower() == name.lower():
                return p
        return None

    async def list(self, user_id: str) -> List[Dict[str, Any]]:
        return [p for p in self._people.values() if p["user_id"] == user_id]

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
        self._people[p_id] = record
        return record

    async def update(self, user_id: str, person_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        p = await self.get_by_id(user_id, person_id)
        if not p:
            return None
        p.update(updates)
        p["updated_at"] = datetime.now(timezone.utc).isoformat()
        return p

    async def delete(self, user_id: str, person_id: str) -> bool:
        p = await self.get_by_id(user_id, person_id)
        if not p:
            return False
        del self._people[person_id]
        return True

    def reset_demo(self, user_id: str):
        self._people = {k: v for k, v in self._people.items() if v["user_id"] != user_id}
        demo_data = generate_demo_dataset(user_id)
        for p in demo_data["people"]:
            self._people[p["id"]] = p


class MemoryReminderRepository(IReminderRepository):
    def __init__(self):
        self._reminders: Dict[str, Dict[str, Any]] = {}

    async def get_by_id(self, user_id: str, reminder_id: str) -> Optional[Dict[str, Any]]:
        r = self._reminders.get(reminder_id)
        if r and r["user_id"] == user_id:
            return r
        return None

    async def get_by_commitment_id(self, user_id: str, commitment_id: str) -> Optional[Dict[str, Any]]:
        for r in self._reminders.values():
            if r["user_id"] == user_id and r["commitment_id"] == commitment_id:
                return r
        return None

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
        self._reminders[r_id] = record
        return record

    async def update(self, user_id: str, reminder_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        r = await self.get_by_id(user_id, reminder_id)
        if not r:
            return None
        r.update(updates)
        return r

    async def delete(self, user_id: str, reminder_id: str) -> bool:
        r = await self.get_by_id(user_id, reminder_id)
        if not r:
            return False
        del self._reminders[reminder_id]
        return True


class MemoryNotificationRepository(INotificationRepository):
    def __init__(self):
        self._notifications: Dict[str, Dict[str, Any]] = {}
        demo_data = generate_demo_dataset("demo-user-1")
        for n in demo_data["notifications"]:
            self._notifications[n["id"]] = n

    async def list(self, user_id: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        res = [
            n for n in self._notifications.values()
            if n["user_id"] == user_id and (not unread_only or not n.get("read_at"))
        ]
        res.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return res

    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        n_id = data.get("id") or str(uuid.uuid4())
        record = {
            **data,
            "id": n_id,
            "user_id": user_id,
            "read_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._notifications[n_id] = record
        return record

    async def mark_read(self, user_id: str, notification_id: str) -> bool:
        n = self._notifications.get(notification_id)
        if n and n["user_id"] == user_id:
            n["read_at"] = datetime.now(timezone.utc).isoformat()
            return True
        return False
