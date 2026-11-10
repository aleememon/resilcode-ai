app.get("/user", (req, res) => {
  db.query("SELECT * FROM users WHERE id = " + req.query.id);
});
