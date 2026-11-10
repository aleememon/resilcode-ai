@app.route("/ping")
def ping():
    return os.popen("ping -c 1 " + request.args["host"]).read()
