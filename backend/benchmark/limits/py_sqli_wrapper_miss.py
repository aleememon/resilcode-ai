# Known miss: the free Semgrep engine tracks data inside one function only.
def run_query(sql):
    cur.execute(sql)

@app.route("/user")
def user():
    run_query("SELECT * FROM users WHERE id = " + request.args["id"])
