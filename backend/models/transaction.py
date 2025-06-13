from datetime import datetime
from bson import ObjectId

class Transaction:
    def __init__(self, user_id, type, symbol, quantity, price, commission=0.0, timestamp=None, _id=None):
        self.id = str(_id) if _id else None
        self.user_id = str(user_id)
        self.type = type  # 'buy' or 'sell'
        self.symbol = symbol.upper()
        self.quantity = float(quantity)
        self.price = float(price)
        self.commission = float(commission)
        self.timestamp = timestamp if timestamp else datetime.utcnow()

    def total(self):
        """
        Returns the total value of the transaction after adding/removing commission.
        For 'buy' it's cost (price * quantity + commission),
        for 'sell' it's revenue (price * quantity - commission).
        """
        total = self.quantity * self.price
        if self.type == 'buy':
            return round(total + self.commission, 2)
        elif self.type == 'sell':
            return round(total - self.commission, 2)
        return 0.0

    def to_dict(self):
        return {
            "user_id": ObjectId(self.user_id),
            "type": self.type,
            "symbol": self.symbol,
            "quantity": self.quantity,
            "price": self.price,
            "commission": self.commission,
            "total": self.total(),
            "timestamp": self.timestamp
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            user_id=data["user_id"],
            type=data["type"],
            symbol=data["symbol"],
            quantity=data["quantity"],
            price=data["price"],
            commission=data.get("commission", 0.0),
            timestamp=data.get("timestamp", datetime.utcnow()),
            _id=data.get("_id")
        )

    def calculate_total_commissions(transactions):
        return round(sum(txn.get("commission", 0.0) for txn in transactions), 2)
