import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

app = Flask(__name__)
CORS(app)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

# Import blueprints after `supabase` is defined so trips.py can import it
from trips import trips_bp

app.register_blueprint(trips_bp)


if __name__ == '__main__':
    # Port 5000 is taken by macOS AirPlay Receiver, so use 5001
    app.run(debug=True, port=5001)