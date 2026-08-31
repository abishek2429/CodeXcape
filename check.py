import urllib.request
import re

url = "https://code-xcape.vercel.app/assets/index-5leqjBGC.js"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    content = response.read().decode('utf-8')
    matches = re.findall(r'fetch\([^,]*?/api/admin/login[^,]*?,', content)
    print("Found fetches to /api/admin/login:", matches)
    
    # Let's also check VITE_API_URL specifically
    if "codexcape-stl1.onrender.com" in content:
        print("Backend URL IS embedded in the bundle!")
    else:
        print("Backend URL IS MISSING from the bundle!")
