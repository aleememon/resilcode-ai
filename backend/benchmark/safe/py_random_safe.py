delay = random.random() * 2
color = random.choice(["red", "blue"])
token = secrets.token_urlsafe(32)
reset_code = random.SystemRandom().choice(string.digits)
