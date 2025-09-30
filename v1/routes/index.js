"use strict";

const express = require("express");

const AuthRoute = require("./api/AuthRoute");

const HomeRoute = require("./HomeRoute");

const router = express.Router();

router.use("/", AuthRoute);

router.use("/", HomeRoute);

module.exports = router;
