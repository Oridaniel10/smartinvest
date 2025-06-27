import os
from pymongo import MongoClient

# This script now requires the MONGO_URI to be passed as an environment variable.
# Example: MONGO_URI="..." python3 your_script_name.py
MONGO_URI = os.environ.get("MONGO_URI")

def run_migration():
    """
    Connects to the MongoDB database using the provided MONGO_URI and
    updates all user documents that do not have an 'is_public' field,
    setting it to True by default.
    """
    if not MONGO_URI:
        print("Error: The MONGO_URI environment variable is not set.")
        print("Please run the script like this:")
        print('MONGO_URI="your_connection_string" python3 backend/migrations/001_add_is_public_field.py')
        return

    try:
        print(f"Attempting to connect to MongoDB using the provided MONGO_URI...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping') 
        print("Successfully connected to the database.")
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return

    try:
        db = client.get_database() 
        users_collection = db.users
        # The query finds all users that do NOT have the 'is_public' field.
        query = { "is_public": { "$exists": False } }
        update = { "$set": { "is_public": True } }
        
        result = users_collection.update_many(query, update)
        print("-" * 30)
        print("Database migration completed.")
        print(f"Users found without 'is_public' field: {result.matched_count}")
        print(f"Users updated to 'is_public: True':   {result.modified_count}")
        print("-" * 30)
    except Exception as e:
        print(f"An error occurred during the update: {e}")
    finally:
        client.close()
        print("Database connection closed.")


if __name__ == "__main__":
    run_migration() 