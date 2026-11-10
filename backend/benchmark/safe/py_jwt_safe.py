t = jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")
c = jwt.decode(t, key, algorithms=["HS256"])
