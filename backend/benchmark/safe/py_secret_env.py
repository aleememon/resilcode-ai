DB_PASSWORD = os.environ["DB_PASSWORD"]
api_key = os.getenv("API_KEY", "")
password_label = "Password"
token_type = "Bearer"
password = request.form["password"]
forgot_password = "Forgot your password?"
client = connect(host="db", password=os.environ["DB_PASS"])
