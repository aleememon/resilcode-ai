app.post("/login", (req: Request, res: Response) => {
  const sql = "SELECT * FROM users WHERE email = '" + req.body.email + "'";
  connection.execute(sql);
});
