const child_process = require("child_process");
app.post("/convert", (req, res) => {
  const out = child_process.execSync(`convert ${req.body.file} out.png`);
  res.send(out);
});
