from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.extensions import mongo
from models.chat import ChatMessage
from datetime import datetime, timedelta
from bson import ObjectId

chat_bp = Blueprint("chat", __name__)

# listens for POST requests on /chat/send
@chat_bp.route("/send", methods=["POST"])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        message = data["message"]
        role = data["role"]  # 'user' or 'ai'
        session_id = data.get("session_id")
        session_name = data.get("session_name", "Untitled")
    except KeyError:
        return jsonify({"error": "Missing fields"}), 400

    chat_message = ChatMessage(
        user_id=user_id,
        message=message,
        role=role,
        session_id=session_id,
        session_name=session_name
    )
    mongo.db.chat.insert_one(chat_message.to_dict())

    return jsonify({
        "message": "Message saved",
        "session_id": chat_message.session_id,
        "session_name": chat_message.session_name
    }), 200


# listens for GET requests on /chat/sessions
@chat_bp.route("/sessions", methods=["GET"])
@jwt_required()
def get_sessions():
    user_id = get_jwt_identity()
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    # use MongoDB aggregation to efficiently group messages by session
    sessions = mongo.db.chat.aggregate([
        {"$match": {
            "user_id": ObjectId(user_id),
            "timestamp": {"$gte": one_week_ago}
        }},
        {"$sort": {"timestamp": -1}},  # חשוב כדי לקבל את שם השיחה האחרון
        {"$group": {
            "_id": "$session_id",
            "last_message_time": {"$max": "$timestamp"},
            "session_name": {"$first": "$session_name"},
            "message_count": {"$sum": 1}
        }},
        {"$sort": {"last_message_time": -1}}
    ])

    session_list = []
    for s in sessions:
        session_list.append({
            "session_id": s["_id"],
            "session_name": s.get("session_name", "Untitled"),
            "last_message_time": s["last_message_time"].isoformat(),
            "message_count": s["message_count"]
        })

    return jsonify({"sessions": session_list}), 200

# listens for GET requests on /chat/history
@chat_bp.route("/history", methods=["GET"])
@jwt_required()
def get_chat_history():
    user_id = get_jwt_identity()
    session_id = request.args.get("session_id")

    one_week_ago = datetime.utcnow() - timedelta(days=7)
    query = {
        "user_id": ObjectId(user_id),
        "timestamp": {"$gte": one_week_ago}
    }
    if session_id:
        query["session_id"] = session_id

    messages = list(mongo.db.chat.find(query).sort("timestamp", 1))
    for msg in messages:
        msg["_id"] = str(msg["_id"])
        msg["user_id"] = str(msg["user_id"])
        msg["timestamp"] = msg["timestamp"].isoformat()

    return jsonify({"messages": messages}), 200

# Listens for DELETE requests to /chat/sessions/<session_id>
# This will delete all messages associated with a specific session for the logged-in user.
@chat_bp.route("/sessions/<string:session_id>", methods=["DELETE"])
@jwt_required()
def delete_chat_session(session_id):
    user_id = get_jwt_identity()
    
    # We ensure the user can only delete their own sessions
    try:
        result = mongo.db.chat.delete_many({
            "user_id": ObjectId(user_id),
            "session_id": session_id
        })
        
        if result.deleted_count > 0:
            return jsonify({"message": f"Session {session_id} deleted. {result.deleted_count} messages removed."}), 200
        else:
            # This can happen if the session_id is wrong or doesn't belong to the user
            return jsonify({"message": "No session found to delete."}), 404
            
    except Exception as e:
        print(f"Error deleting session {session_id}: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500
