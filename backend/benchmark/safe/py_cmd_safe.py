subprocess.run(["ls", "-l"])
subprocess.run(["ping", "-c", "1", request.args["host"]], capture_output=True)
os.system("clear")
