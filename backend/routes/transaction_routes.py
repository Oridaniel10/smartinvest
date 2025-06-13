from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.extensions import mongo
from models.user import User
from bson import ObjectId
import datetime

transaction_bp = Blueprint("transaction", __name__)

# helper function to calculate the total invested amount in a portfolio.
# this is the sum of (quantity * average_price) for each stock.
def calculate_invested_amount(portfolio):
    return round(sum(stock.get("quantity", 0) * stock.get("avg_price", 0) for stock in portfolio), 2)

# listens for POST requests on /transaction/buy
@transaction_bp.route("/buy", methods=["POST"])
@jwt_required()
def buy_stock():
    user_id = get_jwt_identity() 
    data = request.get_json()
    
    print(f"[/buy] Received data: {data}")

    if not data:
        return jsonify({"error": "Request body is empty or not JSON"}), 400

    try:
        symbol = data["symbol"]
        quantity = float(data["quantity"])
        price = float(data["price"])
        commission = float(data.get("commission", 0))
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Invalid or missing data. Required: symbol, quantity, price."}), 400

    if not symbol:
        return jsonify({"error": "Symbol cannot be empty."}), 400

    if quantity <= 0 or price <= 0 or commission < 0:
        return jsonify({"error": "Transaction values must be positive."}), 400

    user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        return jsonify({"error": "User not found"}), 404

    user = User.from_dict(user_data)
    
    # Round the total cost to 2 decimal places to handle floating point inaccuracies
    total_cost = round((price * quantity) + commission, 2)

    # --- Debug Print ---
    # Log the balance and cost for easier debugging
    print(f"[buy_stock_debug] Comparing Balance: {user.balance} with Total Cost: {total_cost}")

    # Also round the user's balance for a safe comparison
    if round(user.balance, 2) < total_cost:
        return jsonify({"error": "Insufficient funds"}), 400

    stock_in_portfolio = next((stock for stock in user.portfolio if stock["symbol"] == symbol), None)
    
    transaction_cost = price * quantity

    if stock_in_portfolio:
        stock_in_portfolio["quantity"] += quantity
        stock_in_portfolio["total_cost"] = stock_in_portfolio.get("total_cost", 0) + transaction_cost
        stock_in_portfolio["avg_price"] = stock_in_portfolio["total_cost"] / stock_in_portfolio["quantity"]
    else:
        user.portfolio.append({
            "symbol": symbol, 
            "quantity": quantity, 
            "total_cost": transaction_cost,
            "avg_price": price
        })

    user.balance -= total_cost

    transaction = {
        "type": "buy", "symbol": symbol, "quantity": quantity,
        "price": price, "commission": commission, "date": datetime.datetime.utcnow()
    }

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"balance": user.balance, "portfolio": user.portfolio}, "$push": {"transactions": transaction}}
    )

    return jsonify({"message": "Stock purchased successfully", "new_balance": user.balance}), 200

# listens for POST requests on /transaction/sell
@transaction_bp.route("/sell", methods=["POST"])
@jwt_required()
def sell_stock():
    user_id = get_jwt_identity()
    data = request.get_json()
    print(f"[/sell] Received data: {data}")

    if not data:
        return jsonify({"error": "Request body is empty or not JSON"}), 400

    try:
        symbol = data["symbol"]
        quantity_to_sell = float(data["quantity"])
        price = float(data["price"])
        commission = float(data.get("commission", 0))
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Invalid or missing data. Required: symbol, quantity, price."}), 400

    if not symbol:
        return jsonify({"error": "Symbol cannot be empty."}), 400
    if quantity_to_sell <= 0 or price <= 0 or commission < 0:
        return jsonify({"error": "Transaction values must be positive."}), 400

    user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        return jsonify({"error": "User not found"}), 404

    user = User.from_dict(user_data)
    stock_to_sell = next((stock for stock in user.portfolio if stock["symbol"] == symbol), None)

    if not stock_to_sell or stock_to_sell["quantity"] < quantity_to_sell:
        return jsonify({"error": "Insufficient stock quantity to sell"}), 400
    
    total_revenue = (price * quantity_to_sell) - commission
    if total_revenue < 0:
        return jsonify({"error": "Commission cannot be greater than sale value."}), 400

    # Update total_cost before quantity
    stock_to_sell["total_cost"] = stock_to_sell.get("total_cost", 0) - (stock_to_sell["avg_price"] * quantity_to_sell)
    
    user.balance += total_revenue
    stock_to_sell["quantity"] -= quantity_to_sell

    if stock_to_sell["quantity"] < 1e-6: # Using a small threshold to handle float inaccuracies
        user.portfolio = [stock for stock in user.portfolio if stock["symbol"] != symbol]
    
    transaction = {
        "type": "sell", "symbol": symbol, "quantity": quantity_to_sell,
        "price": price, "commission": commission, "date": datetime.datetime.utcnow()
    }

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"balance": user.balance, "portfolio": user.portfolio}, "$push": {"transactions": transaction}}
    )

    return jsonify({"message": "Stock sold successfully", "new_balance": user.balance}), 200

@transaction_bp.route("/deposit", methods=["POST"])
@jwt_required()
def deposit_funds():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or "amount" not in data:
        return jsonify({"error": "Request must include amount"}), 400
    
    try:
        amount = float(data['amount'])
        if amount <= 0:
            raise ValueError("Amount must be positive")
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount provided"}), 400

    deposit_transaction = {
        "type": "deposit",
        "amount": amount,
        "date": datetime.datetime.utcnow(),
        "description": "User deposit"
    }

    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$inc": {"balance": amount},
            "$push": {"transactions": deposit_transaction}
        }
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    new_balance = user_data.get('balance')

    return jsonify({
        "message": "Deposit successful",
        "new_balance": new_balance
    }), 200

# listens for GET requests on /transaction/history
@transaction_bp.route("/history", methods=["GET"])
@jwt_required()
def get_transaction_history():
    user_id = get_jwt_identity()
    user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)}, {"transactions": 1, "_id": 0})
    if not user_data or "transactions" not in user_data:
        return jsonify([]), 200
    transactions = user_data.get("transactions", [])
    for t in transactions:
        t['date'] = t['date'].isoformat() if isinstance(t.get('date'), datetime.datetime) else None
    return jsonify(transactions), 200
