import requests
import sys

try:
    with open("session_id.txt", "r") as f:
        sid = f.read().strip()
    
    print(f"Checking session {sid}...")
    r = requests.get(f"http://127.0.0.1:8000/api/v1/sessions/{sid}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"✅ Session {sid} exists! Code length: {len(data.get('code', ''))}")
    else:
        print(f"❌ Session {sid} not found (Status {r.status_code})")
        sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
