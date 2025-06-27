from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.extensions import mongo
from models.user import User
from bson import ObjectId
import cloudinary.uploader
import requests # Import requests for Finnhub API
import os
import datetime # Import datetime for transaction timestamp

user_bp = Blueprint("user", __name__)

FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")
FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

def get_stock_quote(symbol):
    """Helper function to get live stock price from Finnhub."""
    if not FINNHUB_API_KEY:
        print("Warning: Finnhub API key is not set. Using average price for current value.")
        return None
    try:
        response = requests.get(f"{FINNHUB_BASE_URL}/quote", params={"symbol": symbol, "token": FINNHUB_API_KEY})
        response.raise_for_status()
        return response.json().get('c', 0) # 'c' is the current price
    except requests.RequestException as e:
        print(f"Error fetching quote for {symbol}: {e}")
        return None

# Listens for GET requests to /user/profile.
# This is a protected route that requires a valid JWT.
# It gathers all necessary data for the user's profile page in one go.
@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_user_profile():
    user_id = get_jwt_identity()
    user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})

    if not user_data:
        return jsonify({"error": "User not found"}), 404
        
    # --- Dust cleanup logic ---
    portfolio = user_data.get('portfolio', [])
    kept_holdings = []
    dust_value_to_liquidate = 0
    dust_symbols_liquidated = []

    for stock in portfolio:
        current_price = get_stock_quote(stock['symbol']) or stock.get('avg_price', 0)
        current_value = stock.get('quantity', 0) * current_price
        
        if current_value < 1.00:
            dust_value_to_liquidate += current_value
            dust_symbols_liquidated.append(stock['symbol'])
        else:
            kept_holdings.append(stock)

    if dust_value_to_liquidate > 0:
        dust_transaction = {
            "type": "liquidation",
            "amount": round(dust_value_to_liquidate, 2),
            "date": datetime.datetime.utcnow(),
            "description": f"Auto-liquidation of small holdings: {', '.join(dust_symbols_liquidated)}"
        }
        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {"portfolio": kept_holdings},
                "$inc": {"balance": round(dust_value_to_liquidate, 2)},
                "$push": {"transactions": dust_transaction}
            }
        )
        # Re-fetch user data after update to ensure consistency
        user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})

    user = User.from_dict(user_data)
    
    # --- Portfolio and P&L Calculations ---
    
    # 1. Enhance portfolio with total invested and current value
    total_portfolio_value = 0
    total_invested_amount = 0
    enhanced_portfolio = []
    for stock in user.portfolio:
        # The 'total_invested' is now the 'total_cost' stored with the holding.
        total_invested = round(stock.get('total_cost', 0), 2)
        total_invested_amount += total_invested
        
        current_price = get_stock_quote(stock['symbol'])
        # Fallback to average price if live price is unavailable
        if current_price is None:
            current_price = stock.get('avg_price', 0)
            
        current_value = round(stock.get('quantity', 0) * current_price, 2)
        
        enhanced_portfolio.append({
            **stock,
            "total_invested": total_invested,
            "current_value": current_value,
            "unrealized_pl": round(current_value - total_invested, 2)
        })
        total_portfolio_value += current_value

    # 2. Calculate overall Profit & Loss
    transactions = user_data.get('transactions', [])
    net_contributions = sum(t.get('amount', 0) for t in transactions if t.get('type') in ['deposit', 'liquidation'])
    # In the future, we can add withdrawals:
    # net_contributions -= sum(t.get('amount', 0) for t in transactions if t.get('type') == 'withdrawal')

    total_equity = user.balance + total_portfolio_value
    
    overall_pl = round(total_equity - net_contributions, 2)
    overall_pl_percentage = 0
    # Only calculate percentage if there have been contributions, to avoid division by zero
    # and to show 0% P/L for brand new accounts.
    if net_contributions > 0:
        overall_pl_percentage = round((overall_pl / net_contributions) * 100, 2)
    # If there are no contributions, P/L must be 0
    else:
        overall_pl = 0

    return jsonify({
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "balance": round(user.balance, 2),
        "profile_image": user.profile_image,
        "is_public": user.is_public,
        "portfolio": enhanced_portfolio,
        "transactions": transactions,
        "invested_amount": round(total_invested_amount, 2),
        "total_portfolio_value": round(total_portfolio_value, 2),
        "net_contributions": round(net_contributions, 2),
        "total_equity": round(total_equity, 2),
        "overall_pl": overall_pl,
        "overall_pl_percentage": overall_pl_percentage
    }), 200


@user_bp.route("/profile/privacy", methods=["POST"])
@jwt_required()
def update_privacy_setting():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        is_public = bool(data['is_public'])
    except KeyError:
        return jsonify({"error": "Missing 'is_public' field"}), 400
    
    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_public": is_public}}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({"message": "Privacy setting updated successfully", "is_public": is_public}), 200


@user_bp.route("/profile/image", methods=["POST"])
@jwt_required()
def update_profile_image():
    user_id = get_jwt_identity()
    
    if 'profile_image' not in request.files:
        return jsonify({"error": "No profile image file provided"}), 400
        
    file = request.files['profile_image']
    
    user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        return jsonify({"error": "User not found"}), 404
        
    user = User.from_dict(user_data)

    # Delete the old image from Cloudinary if it exists
    if user.profile_image_public_id:
        try:
            cloudinary.uploader.destroy(user.profile_image_public_id)
        except Exception as e:
            # Log the error but don't block the upload process
            print(f"Could not delete old image {user.profile_image_public_id}: {e}")

    # Upload the new image
    try:
        upload_response = cloudinary.uploader.upload(file)
        new_image_url = upload_response.get("secure_url")
        new_public_id = upload_response.get("public_id")
    except Exception as e:
        return jsonify({"error": "New image upload failed", "details": str(e)}), 500

    # Update user in the database
    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "profile_image": new_image_url,
            "profile_image_public_id": new_public_id
        }}
    )
    
    return jsonify({
        "message": "Profile image updated successfully",
        "new_image_url": new_image_url
    }), 200


# listens for GET requests to /user/users/<username>/profile
@user_bp.route("/users/<string:username>/profile", methods=["GET"])
def public_user_profile(username):
    # Case-insensitive search for username, ignoring leading/trailing whitespace
    user_data = mongo.db.users.find_one({"name": {"$regex": f"^\\s*{username.strip()}\\s*$", "$options": "i"}})

    if not user_data:
        return jsonify({"error": "User not found"}), 404

    # Enforce privacy setting
    if not user_data.get("is_public", False):
        return jsonify({"error": "This user's profile is private."}), 403

    user = User.from_dict(user_data)
    
    # --- Portfolio and P&L Calculations ---
    
    # 1. Enhance portfolio with total invested and current value
    total_portfolio_value = 0
    total_invested_amount = 0
    enhanced_portfolio = []
    for stock in user.portfolio:
        # The 'total_invested' is now the 'total_cost' stored with the holding.
        total_invested = round(stock.get('total_cost', 0), 2)
        total_invested_amount += total_invested
        
        current_price = get_stock_quote(stock['symbol'])
        # Fallback to average price if live price is unavailable
        if current_price is None:
            current_price = stock.get('avg_price', 0)
            
        current_value = round(stock.get('quantity', 0) * current_price, 2)
        
        enhanced_portfolio.append({
            **stock,
            "total_invested": total_invested,
            "current_value": current_value,
            "unrealized_pl": round(current_value - total_invested, 2)
        })
        total_portfolio_value += current_value

    # 2. Calculate overall Profit & Loss
    transactions = user_data.get('transactions', [])
    net_contributions = sum(t.get('amount', 0) for t in transactions if t.get('type') in ['deposit', 'liquidation'])
    # In the future, we can add withdrawals:
    # net_contributions -= sum(t.get('amount', 0) for t in transactions if t.get('type') == 'withdrawal')

    total_equity = user.balance + total_portfolio_value
    
    overall_pl = round(total_equity - net_contributions, 2)
    overall_pl_percentage = 0
    # Only calculate percentage if there have been contributions, to avoid division by zero
    # and to show 0% P/L for brand new accounts.
    if net_contributions > 0:
        overall_pl_percentage = round((overall_pl / net_contributions) * 100, 2)
    # If there are no contributions, P/L must be 0
    else:
        overall_pl = 0

    return jsonify({
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "balance": round(user.balance, 2),
        "profile_image": user.profile_image,
        "is_public": user.is_public,
        "portfolio": enhanced_portfolio,
        "transactions": transactions,
        "invested_amount": round(total_invested_amount, 2),
        "total_portfolio_value": round(total_portfolio_value, 2),
        "net_contributions": round(net_contributions, 2),
        "total_equity": round(total_equity, 2),
        "overall_pl": overall_pl,
        "overall_pl_percentage": overall_pl_percentage
    }), 200

# listens for GET requests to /user/top
# fetches the top users by total P/L
@user_bp.route("/top", methods=["GET"])
def get_top_users():
    """
    Fetches and ranks all users by performance metrics.
    Supports sorting by overall P/L amount or percentage.
    """
    try:
        limit = int(request.args.get('limit', 3))
        sort_by = request.args.get('sortBy', 'overall_pl')
        
        # Only fetch users who have set their profile to public
        all_users = list(mongo.db.users.find({"is_public": True}))
        
        all_user_stats = []

        for user_data in all_users:
            user = User.from_dict(user_data)
            
            # --- Perform Calculations for each user ---
            total_portfolio_value = 0
            total_invested_amount = 0
            unrealized_pl = 0
            
            for stock in user.portfolio:
                total_invested = round(stock.get('total_cost', 0), 2)
                total_invested_amount += total_invested
                
                current_price = get_stock_quote(stock['symbol']) or stock.get('avg_price', 0)
                current_value = round(stock.get('quantity', 0) * current_price, 2)
                stock_unrealized_pl = round(current_value - total_invested, 2)
                
                total_portfolio_value += current_value
                unrealized_pl += stock_unrealized_pl

            transactions = user_data.get('transactions', [])
            net_contributions = sum(t.get('amount', 0) for t in transactions if t.get('type') in ['deposit', 'liquidation'])
            total_commissions = sum(t.get('commission', 0) for t in transactions if t.get('type') in ['buy', 'sell'])
            
            total_equity = user.balance + total_portfolio_value
            overall_pl = round(total_equity - net_contributions, 2)
            realized_pl = round(overall_pl - unrealized_pl, 2)
            
            overall_pl_percentage = 0
            if net_contributions > 0:
                overall_pl_percentage = round((overall_pl / net_contributions) * 100, 2)
            
            all_user_stats.append({
                "id": str(user.id),
                "name": user.name,
                "profile_image": user.profile_image,
                "balance": round(user.balance, 2),
                "net_contributions": round(net_contributions, 2),
                "total_equity": round(total_equity, 2),
                "overall_pl": overall_pl,
                "overall_pl_percentage": overall_pl_percentage,
                "unrealized_pl": round(unrealized_pl, 2),
                "realized_pl": realized_pl,
                "total_commissions": round(total_commissions, 2),
                "portfolio": user.portfolio,
                "transactions": transactions,
            })

        # Sort by the specified key, default to 'overall_pl'
        if sort_by not in ['overall_pl', 'overall_pl_percentage']:
            sort_by = 'overall_pl'
            
        all_user_stats.sort(key=lambda x: x[sort_by], reverse=True)
        
        return jsonify(all_user_stats[:limit]), 200

    except Exception as e:
        print(f"Error in get_top_users: {e}")
        return jsonify({"error": "An internal error occurred"}), 500
