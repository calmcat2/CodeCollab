import requests
import sys

try:
    r = requests.post("http://127.0.0.1:8000/api/v1/sessions")
    r.raise_for_status()
    data = r.json()
    sid = data['id']
    with open("session_id.txt", "w") as f:
        f.write(sid)
    print(f"Created session {sid}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
