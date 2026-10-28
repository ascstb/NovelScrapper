"use strict";

const express = require("express");
const router = express.Router();

const { NovelCtrl } = require("../../controllers");

router.get("/samples/get", NovelCtrl.getSamples);
router.get("/novels/get", NovelCtrl.getNovels);
router.get("/novels/characters", NovelCtrl.getCharacters);
router.post("/novels/character", NovelCtrl.updateCharacters);
router.get("/novels/voices", NovelCtrl.getVoices);
router.post("/novels/assingCharacters", NovelCtrl.assignCharacters);
router.post("/novels/getChapters", NovelCtrl.getNovelChapters);

module.exports = router;