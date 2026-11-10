DEBUG = os.environ.get("DEBUG") == "1"
SESSION_COOKIE_SECURE = True
app.run(debug=False)
requests.get(url, verify=True, timeout=5)
CORS(app, origins=["https://app.example.com"])
resp.set_cookie("sid", v, httponly=True, secure=True, samesite="Lax")
