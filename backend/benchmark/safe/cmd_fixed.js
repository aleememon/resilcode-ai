const { exec, execFile } = require("child_process");
exec("git status");
app.get("/ver", (req, res) => {
  execFile("node", ["--version"], (e, out) => res.send(out));
});
