const { app, mongoose } = require("./question-history-service");

const port = 8005;

const server = app.listen(port, () => {
  console.log(`Questions Service listening at http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
