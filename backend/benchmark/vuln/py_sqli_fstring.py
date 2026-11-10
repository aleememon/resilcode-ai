@app.route("/user")
def user():
    uid = request.args.get("id")
    cur.execute(f"SELECT * FROM users WHERE id = {uid}")
