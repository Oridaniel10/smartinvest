from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId

class User:
    def __init__(self, name, email, password, balance=0.0, portfolio=None, profile_image=None, profile_image_public_id=None, _id=None):
        self.id = str(_id) if _id else None
        self.name = name
        self.email = email
        self.password = password  
        self.balance = balance
        self.portfolio = portfolio if portfolio else []
        self.profile_image = profile_image 
        self.profile_image_public_id = profile_image_public_id

    @classmethod
    def from_dict(cls, data):
        return cls(
            name=data.get("name"),
            email=data.get("email"),
            password=data.get("password"),
            balance=data.get("balance", 0.0),
            portfolio=data.get("portfolio", []),
            profile_image=data.get("profile_image"),  
            profile_image_public_id=data.get("profile_image_public_id"),
            _id=data.get("_id")
        )

    def to_dict(self):
        return {
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "balance": self.balance,
            "portfolio": self.portfolio,
            "profile_image": self.profile_image,
            "profile_image_public_id": self.profile_image_public_id
        }

    def check_password(self, plain_password):
        return check_password_hash(self.password, plain_password)

    def hash_password(self):
        self.password = generate_password_hash(self.password)
