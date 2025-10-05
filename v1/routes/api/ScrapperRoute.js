"use strict";
const express = require("express");
const router = express.Router();

const { ScrapperCtrl } = require("../../controllers");

router.get("/chapter-list", ScrapperCtrl.getChapterList);
router.get("/download-chapter", ScrapperCtrl.downloadChapter);
router.post("/download-novel", ScrapperCtrl.downloadNovel);

module.exports = router;