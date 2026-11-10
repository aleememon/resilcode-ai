// Known miss: the free Semgrep engine tracks data inside one function only.
// The user input reaches exec() through a helper function, so the flow is lost.
const { exec } = require("child_process");
function runCommand(cmd) {
  exec(cmd);
}
app.get("/ping", (req, res) => {
  runCommand("ping -c 1 " + req.query.host);
});
