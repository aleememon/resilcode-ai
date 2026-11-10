app.use(cors());
app.use(cors({ origin: "*", credentials: false }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
