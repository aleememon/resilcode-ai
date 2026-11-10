@app.route("/find", methods=["POST"])
def find():
    cur.execute("SELECT * FROM users WHERE name = '%s'" % request.form["name"])
    cur.execute("SELECT * FROM users WHERE email = '{}'".format(request.form["email"]))
