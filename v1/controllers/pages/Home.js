"use strict";
var path = require("path");

const getHome = async (req, res, next) => {
  try {
    let homePath = path.join(__dirname, "../../../pages/index.html");
    return res.status(200).sendFile(homePath);
  } catch (err) {
    return res.status(500).send({ error: err });
  }
};

module.exports = {
  getHome,
};
