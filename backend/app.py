import os
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')

if not url or not key:
    print("Error:  environment variable missing.")
supabase: Client = create_client(url, key)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "OPTIONS"])


def get_authenticated_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    token = auth_header.replace('Bearer ', '')
    
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user

        if user and user.email.endswith('.edu'):
            return user

        return None
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None

@app.route('/', methods=['GET'])
def home():
    return "Flask is successfully running"


@app.route('/api/auth', methods=['POST'])
def register_auth_user():
    if request.method == 'OPTIONS':
        return {"status": "preflight ok"}, 200

    user = get_authenticated_user()

    if user:
        try:
            supabase.table('users').upsert({
                'id': user.id,
                'email': user.email
            }).execute()
            return {"status": "success", "message": f"User {user.email} registered successfully."}
        except Exception as e:
            print(f"Error registering user: {e}")
            return {"status": "error", "message": "Failed to register user."}, 500

    return {"status": "error", "message": "Unauthorized."}, 401


@app.route('/api/test', methods=['GET'])
def test_auth():
    if request.method == 'OPTIONS':
        return {"status": "preflight ok"}, 200

    user = get_authenticated_user()

    if user:
        return {"status": "success", "message": f"Welcome, {user}!"}
    
    return {"status": "error", "message": "rejected!"}

if __name__ == '__main__':
    app.run(debug=True, port=5000)