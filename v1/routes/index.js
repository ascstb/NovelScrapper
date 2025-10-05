"use strict";

const express = require("express");

const AuthRoute = require("./api/AuthRoute");
const ScrapperRoute = require("./api/ScrapperRoute");
const TTSRoute = require("./api/TTSRoute");

const HomeRoute = require("./HomeRoute");

const router = express.Router();

router.use("/", AuthRoute);

router.use("/", HomeRoute);

router.use("/", ScrapperRoute);

router.use("/", TTSRoute);

module.exports = router;
