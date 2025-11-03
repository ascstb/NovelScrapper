"use strict";
const PORT = process.env.PORT || 3700;
//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");

const app = express();
app.set("port", PORT);
app.use(cors());
app.use(express.json());

app.use("/pages", express.static("./pages"));
require("./middleware/express-router")(app);

let server = http.createServer(app);

const connect = () => {
  const dbConfig = require("./config/db");
  const options = {
    // keepAlive: true,
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  };
  const uri = dbConfig.db.uri;

  mongoose.connect(uri, options).catch((err) => {
    return console.log(err, "Mongo Error");
  });
  return mongoose.connection;
};

const listen = () => {
  server.listen(PORT);
  console.log("Express app started on port " + PORT);
};

const onError = (error) => {
  switch (error.code) {
    case "EADDRINUSE":
      console.log("Port:", PORT, "is already in  use");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  console.log(
    "Express server listening on port ",
    server.address().port,
    " with pid ",
    process.pid
  );
};

const connection = connect();

connection
  .on("error", console.log)
  .on("disconnected", connect)
  .once("open", listen);

server.on("error", onError);
server.on("listening", onListening);

module.exports = app;
