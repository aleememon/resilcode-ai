// res.send with an object returns JSON, but taint still follows the input.
app.post("/echo", (req, res) => res.send({ data: req.body }));
