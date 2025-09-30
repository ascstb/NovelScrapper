"use-strict";

const express = require("express");
const router = express.Router();
const indexRouterV1 = require("../v1/routes");

module.exports = (app) => {
  app.use("/api/v1", indexRouterV1);

  app.get("/", function (req, res) {
    res.status(200).json({
      message: `The api: ${res.req.url} doesn't exist, please review the url`,
    });
  });

  app.post("/", function (req, res) {
    res.status(404).json({
      message: `The api: ${res.req.url} doesn't exist, please review the url`,
    });
  });

  app.put("/", function (req, res) {
    res.status(404).json({
      message: `The api: ${res.req.url} doesn't exist, please review the url`,
    });
  });

  app.use(function (err, req, res, next) {
    res.status(500).json({
      message: "Error Handler: " + err.stack,
    });
  });

  app.use(router);
};
