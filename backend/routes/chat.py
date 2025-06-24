from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.extensions import mongo
from models.chat import ChatMessage
from datetime import datetime, timedelta
from bson import ObjectId
from models.user import User
from utils.portfolio_utils import calculate_portfolio_stats, generate_profile_as_text
import os
from azure.core.credentials import AzureKeyCredential
from azure.ai.inference import ChatCompletionsClient
import google.generativeai as genai
import traceback

chat_bp = Blueprint("chat", __name__)

# --- AI Configuration ---
AI_ENDPOINT = "https://models.github.ai/inference"
AI_MODEL = "openai/gpt-4.1-nano"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_FLASH_2")

# Initialize the AI client only if the token is available
ai_client = None
if GITHUB_TOKEN:
    try:
        ai_client = ChatCompletionsClient(
            endpoint=AI_ENDPOINT,
            credential=AzureKeyCredential(GITHUB_TOKEN)
        )
    except Exception as e:
        print(f"Failed to initialize AI client: {e}")

# Initialize Gemini client
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("Gemini client configured successfully.")
    except Exception as e:
        print(f"Failed to configure Gemini client: {e}")
else:
    print("GEMINI_FLASH_2 key not found, Gemini model will not be available.")

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


# # listens for GET requests on /chat/sessions
# @chat_bp.route("/sessions", methods=["GET"])
# @jwt_required()
# def get_sessions():
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
    print(f"--- Deletion Request ---")
    print(f"Attempting to delete session '{session_id}' for user '{user_id}'")
    
    # We ensure the user can only delete their own sessions
    try:
        result = mongo.db.chat.delete_many({
            "user_id": ObjectId(user_id),
            "session_id": session_id
        })
        
        print(f"DB query complete. Messages deleted: {result.deleted_count}")
        print(f"------------------------")

        if result.deleted_count > 0:
            return jsonify({"message": f"Session {session_id} deleted. {result.deleted_count} messages removed."}), 200
        else:
            # This can happen if the session_id is wrong or doesn't belong to the user
            return jsonify({"message": "No session found to delete."}), 404
            
    except Exception as e:
        print(f"Error deleting session {session_id}: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

# listens for POST requests on /chat/ask and the function is called ask_ai
@chat_bp.route("/ask", methods=["POST"])
@jwt_required()
def ask_ai():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        messages_history = data["messages"] # Expecting a list of message objects
        user_message_content = messages_history[-1]['content']
        session_id = data["session_id"]
        session_name = data.get("session_name", "Untitled")
        model_choice = data.get("model", "azure") # Default to azure
    except (KeyError, IndexError):
        return jsonify({"error": "Missing or invalid fields in request"}), 400

    # 1. Save the user's message
    user_chat_message = ChatMessage(
        user_id=user_id, message=user_message_content, role='user',
        session_id=session_id, session_name=session_name
    )
    mongo.db.chat.insert_one(user_chat_message.to_dict())

    try:
        # 2. Generate AI context from user's profile
        raw_user_data = User.get_user_profile_data(user_id)
        live_user_data = calculate_portfolio_stats(raw_user_data)
        profile_context = generate_profile_as_text(live_user_data)

        system_prompt = f"""You are SmartInvest AI, a helpful and concise financial assistant.
        The user has provided the following summary of their investment portfolio. Use this information to answer their questions accurately.
        ---
        {profile_context}
        ---
        """
        
        ai_message_content = ""

        # 3. Call the selected AI model
        if model_choice == 'azure':
            if not ai_client:
                return jsonify({"error": "Azure AI service is not configured"}), 503

            api_history = [{"role": "system", "content": system_prompt}]
            for msg in messages_history:
                api_history.append({
                    "role": "assistant" if msg["role"] == "ai" else msg["role"],
                    "content": msg["content"]
                })
            
            response = ai_client.complete(model=AI_MODEL, messages=api_history)
            ai_message_content = response.choices[0].message.content or "Sorry, I couldn't process that."

        elif model_choice == 'gemini':
            if not GEMINI_API_KEY:
                return jsonify({"error": "Gemini AI service is not configured"}), 503
            
            gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Gemini has a different message format
            gemini_history = []
            for msg in messages_history:
                # Gemini uses 'model' for 'assistant'
                role = 'user' if msg['role'] == 'user' else 'model'
                gemini_history.append({'role': role, 'parts': [msg['content']]})

            # Prepend system prompt to the conversation history
            full_prompt = [
                {'role': 'user', 'parts': [system_prompt]},
                {'role': 'model', 'parts': ["Understood. I am SmartInvest AI, ready to assist with the user's portfolio."]}
            ] + gemini_history

            response = gemini_model.generate_content(full_prompt)
            ai_message_content = response.text or "Sorry, I couldn't process that with Gemini."
        
        else:
            return jsonify({"error": "Invalid model selected"}), 400

        # 4. Save the AI's response
        ai_chat_message = ChatMessage(
            user_id=user_id, message=ai_message_content, role='ai',
            session_id=session_id, session_name=session_name
        )
        mongo.db.chat.insert_one(ai_chat_message.to_dict())

        # 5. Return the AI's response to the frontend
        return jsonify({"role": "ai", "content": ai_message_content}), 200

    except Exception as e:
        print(f"Error during AI processing: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to get response from AI"}), 500
