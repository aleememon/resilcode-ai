a = yaml.safe_load(request.data)
b = yaml.load(open("c.yml"), Loader=yaml.SafeLoader)
c = json.loads(request.data)
