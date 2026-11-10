def page():
    a = render_template("a.html", name=request.args["n"])
    b = render_template_string("Hi {{ n }}", n=request.args["n"])
    c = HttpResponse(escape(request.GET["n"]))
    d = mark_safe("<b>static</b>")
    return a
