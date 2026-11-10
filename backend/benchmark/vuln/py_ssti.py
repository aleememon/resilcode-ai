@app.route("/hello")
def hello():
    return render_template_string("<h1>Hello " + request.args["name"] + "</h1>")
