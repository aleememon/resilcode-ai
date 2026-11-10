@app.route("/ls")
def ls():
    out = subprocess.run("ls " + request.args["dir"], shell=True, capture_output=True)
    return out.stdout
