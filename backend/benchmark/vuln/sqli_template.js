app.get("/user", async (req, res) => {
  const { name } = req.query;
  const rows = await pool.query(`SELECT * FROM users WHERE name = '${name}'`);
  res.json(rows);
});
