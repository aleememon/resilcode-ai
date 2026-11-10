@app.route("/calc", methods=["POST"])
def calc():
    result = eval(request.form["expr"])
    exec(request.json["code"])
    return str(result)
