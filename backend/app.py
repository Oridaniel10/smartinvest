import os
from flask import Flask
from flask_cors import CORS
import cloudinary
from config.config import Config
from config.extensions import mongo, jwt

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Load configuration
    app.config["MONGO_URI"] = Config.MONGO_URI
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY

    #define cloudinary config from env variables
    cloudinary.config(
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key = os.getenv("CLOUDINARY_API_KEY"),
        api_secret = os.getenv("CLOUDINARY_API_SECRET")
    )

    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)

    # Register routes ------------------------------------------------------------------------------------
    from routes.auth_routes import auth_bp
    from routes.transaction_routes import transaction_bp
    from routes.user_routes import user_bp
    from routes.chat import chat_bp



    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(transaction_bp, url_prefix="/transaction")
    app.register_blueprint(user_bp, url_prefix="/user")
    app.register_blueprint(chat_bp, url_prefix="/chat")

    #-----------------------------------------------------------------------------------------------------


    
    @app.route("/")
    def home():
        return {"message": "SmartInvest API is running!"}

    return app

# Run the server
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=Config.PORT)
