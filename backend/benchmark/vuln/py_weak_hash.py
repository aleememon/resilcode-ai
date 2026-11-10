digest = hashlib.md5(password.encode()).hexdigest()
other = hashlib.sha1(data).hexdigest()
