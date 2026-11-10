@app.route("/load", methods=["POST"])
def load():
    obj = pickle.loads(request.data)
    return str(obj)
