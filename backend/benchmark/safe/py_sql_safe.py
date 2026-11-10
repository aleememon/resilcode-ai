@app.route("/user")
def user():
    cur.execute("SELECT * FROM users WHERE id = %s", (request.args["id"],))
    cur.execute("SELECT * FROM users WHERE name = ?", (request.form["n"],))
    cur.execute("SELECT count(*) FROM users")
