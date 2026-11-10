app.post("/login", (req, res) => {
  res.cookie("session", token);
  res.cookie("sid", id, { httpOnly: false });
});
app.use(session({ secret: process.env.S, cookie: { secure: false } }));
