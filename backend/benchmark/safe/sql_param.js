app.get("/user", (req, res) => {
  db.query("SELECT * FROM users WHERE id = $1", [req.query.id]);
});
