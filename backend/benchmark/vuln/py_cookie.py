SESSION_COOKIE_SECURE = False
def login():
    resp = make_response("ok")
    resp.set_cookie("session", token)
    resp.set_cookie("sid", sid, httponly=False)
    return resp
