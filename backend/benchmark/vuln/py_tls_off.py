r = requests.get(url, verify=False)
ctx = ssl.create_default_context()
ctx.check_hostname = False
bad = ssl._create_unverified_context()
