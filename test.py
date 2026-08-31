import urllib.request
import json

url = 'https://codexcape-stl1.onrender.com//api/admin/login'
headers = {
    'Origin': 'https://code-xcape.vercel.app',
    'Content-Type': 'application/json'
}
data = json.dumps({"password": "admin123"}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers, method='POST')

try:
    response = urllib.request.urlopen(req)
    print("Status:", response.status)
    print("Response:", response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error Status:", e.code)
    print("HTTP Error Response:", e.read().decode())
except Exception as e:
    print("Other Error:", str(e))
