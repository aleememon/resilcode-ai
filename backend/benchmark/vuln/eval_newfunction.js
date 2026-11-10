app.get("/run", (req, res) => {
  const fn = new Function("return " + req.query.code);
  res.send(String(fn()));
});
