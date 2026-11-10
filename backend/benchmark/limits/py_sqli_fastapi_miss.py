# Known miss: FastAPI passes input as function parameters, which are not recognised as sources.
@app.get("/users/{user_id}")
def get_user(user_id: str):
    cur.execute(f"SELECT * FROM users WHERE id = {user_id}")
