"use strict";
const express = require("express");
const router = express.Router();

const { TranslatorCtrl } = require("../../controllers");

router.post("/translate-chapter", TranslatorCtrl.translateChapter);
router.post("/translate-novel", TranslatorCtrl.translateNovel);

module.exports = router;
