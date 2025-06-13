import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import cloudinary.uploader
from config.config import Config
from config.status_codes import STATUS
from config.extensions import mongo  
from models.user import User
import datetime

auth_bp = Blueprint("auth", __name__)


# listens for POST requests to /auth/register
@auth_bp.route("/register", methods=["POST"])
def register():
    name = request.form.get("name")
    email = request.form.get("email")
    password = request.form.get("password")
    file = request.files.get("profile_image")

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 409
    
    if mongo.db.users.find_one({"name": name}):
        return jsonify({"error": "Username already exists"}), 409

    # Set a default image URL, which will be overwritten if a file is uploaded.
    image_url = Config.DEFAULT_USER_IMAGE_URL
    public_id = None
    if file:
        try:
            # upload the image file to Cloudinary and get the secure URL.
            upload_response = cloudinary.uploader.upload(file)
            image_url = upload_response.get("secure_url", "")
            public_id = upload_response.get("public_id")
        except Exception as e:
            return jsonify({"error": "Image upload failed", "details": str(e)}), 500

    # create user object with a starting balance
    user = User(
        name=name,
        email=email.lower(),
        password=password,
        balance=0.0,  # Give every new user a starting balance of $10,000
        portfolio=[],
        profile_image=image_url,
        profile_image_public_id=public_id
    )
    # hash the user's password before storing it in the database
    user.hash_password()

    # Insert the new user's data into the database.
    inserted = mongo.db.users.insert_one(user.to_dict())

    user.id = str(inserted.inserted_id)

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "balance": user.balance,
            "profile_image": user.profile_image
        }
    }), 201


# listens for POST requests to /auth/login
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email").lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), STATUS["BAD_REQUEST"]

    user_data = mongo.db.users.find_one({"email": email})
    if not user_data:
        return jsonify({"error": "Invalid username or password"}), STATUS["UNAUTHORIZED"]

    user = User.from_dict(user_data)
    # check if the provided password matches the hashed password in the database.
    if not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), STATUS["UNAUTHORIZED"]

    # create a JWT for the user to use for authenticating future requests
    access_token = create_access_token(
        identity=user.id,
        expires_delta=datetime.timedelta(days=1)
    )

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "balance": user.balance,
            "profile_image": user.profile_image 
        }
    }), STATUS["SUCCESS"]
