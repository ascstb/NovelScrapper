"use stricts";

const express = require("express");
const router = express.Router();

const { HomeCtrl } = require("../controllers");

router.get("/", HomeCtrl.getHome);

module.exports = router;
