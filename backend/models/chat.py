from datetime import datetime
from bson import ObjectId

class ChatMessage:
    def __init__(self, user_id, message, role, timestamp=None, session_id=None, session_name=None, _id=None):
        self.id = str(_id) if _id else None
        self.user_id = str(user_id)
        self.role = role  # 'user' or 'ai'
        self.message = message
        self.session_id = session_id or str(ObjectId())
        self.session_name = session_name or "Untitled"
        self.timestamp = timestamp or datetime.utcnow()

    def to_dict(self):
        return {
            "user_id": ObjectId(self.user_id),
            "role": self.role,
            "message": self.message,
            "session_id": self.session_id,
            "session_name": self.session_name,
            "timestamp": self.timestamp
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            user_id=data["user_id"],
            message=data["message"],
            role=data["role"],
            session_id=data.get("session_id"),
            session_name=data.get("session_name"),
            timestamp=data.get("timestamp"),
            _id=data.get("_id")
        )
