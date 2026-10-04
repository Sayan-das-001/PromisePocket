from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class IUserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass


class ICommitmentRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: str, commitment_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
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
        pass

    @abstractmethod
    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update(self, user_id: str, commitment_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete(self, user_id: str, commitment_id: str) -> bool:
        pass


class IPersonRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: str, person_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_by_name(self, user_id: str, name: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def list(self, user_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update(self, user_id: str, person_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete(self, user_id: str, person_id: str) -> bool:
        pass


class IReminderRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: str, reminder_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_by_commitment_id(self, user_id: str, commitment_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update(self, user_id: str, reminder_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete(self, user_id: str, reminder_id: str) -> bool:
        pass


class INotificationRepository(ABC):
    @abstractmethod
    async def list(self, user_id: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def mark_read(self, user_id: str, notification_id: str) -> bool:
        pass
