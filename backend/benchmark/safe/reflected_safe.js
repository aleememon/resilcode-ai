app.get("/a", (req, res) => res.send(escapeHtml(req.query.name)));
app.get("/b", (req, res) => res.json({ name: req.query.name }));
app.get("/c", (req, res) => res.send("ok"));
app.post("/d", (req, res) => res.status(201).send({ saved: true, id: req.params.id }));
