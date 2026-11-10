// Known miss: sources only cover Express-style req.*, not Koa's ctx.query.
router.get("/user", async (ctx) => {
  ctx.body = await db.query("SELECT * FROM users WHERE id = " + ctx.query.id);
});
