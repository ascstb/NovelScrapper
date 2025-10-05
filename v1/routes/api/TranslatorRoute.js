"use strict";
const express = require("express");
const router = express.Router();

const { TranslatorCtrl } = require("../../controllers");

router.post("/translate-chapter", TranslatorCtrl.translateChapter);

module.exports = router;