from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from config.extensions import mongo # Import mongo instance

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

    @staticmethod
    def get_user_profile_data(user_id_str: str) -> dict:
        """
        A static method to fetch and assemble all profile data for a given user ID.
        This includes user details, portfolio, and transactions from the user document.
        """
        user_id = ObjectId(user_id_str)
        
        # Fetch the main user document which contains portfolio and transactions
        user_data = mongo.db.users.find_one({"_id": user_id})
        if not user_data:
            return None # Or raise an exception

        # Portfolio and transactions are embedded in the user document, not separate collections.
        portfolio = user_data.get("portfolio", [])
        transactions = user_data.get("transactions", [])

        # Clean up ObjectIDs for JSON serialization, if they exist in sub-documents
        for item in portfolio:
            if '_id' in item and isinstance(item['_id'], ObjectId):
                item['_id'] = str(item['_id'])
            if 'user_id' in item and isinstance(item['user_id'], ObjectId):
                item['user_id'] = str(item['user_id'])
        for item in transactions:
            if '_id' in item and isinstance(item['_id'], ObjectId):
                item['_id'] = str(item['_id'])
            if 'user_id' in item and isinstance(item['user_id'], ObjectId):
                item['user_id'] = str(item['user_id'])

        return {
            "id": str(user_data['_id']),
            "name": user_data.get('name'),
            "email": user_data.get('email'),
            "balance": user_data.get('balance', 0),
            "profile_image": user_data.get('profile_image'),
            "portfolio": portfolio,
            "transactions": transactions
        }

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
