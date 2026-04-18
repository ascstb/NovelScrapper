"use strict";
const express = require("express");
const router = express.Router();

const { TTSCtrl } = require("../../controllers");

router.post("/add-two", TTSCtrl.functionTest);
router.get("/voices", TTSCtrl.getVoices);
router.get("/models", TTSCtrl.getModels);
router.get("/indexes", TTSCtrl.getIndexes);
router.post("/generateRVC", TTSCtrl.generateRVC);
router.post("/generateSamples", TTSCtrl.generateSamples);
router.post("/generateChapter", TTSCtrl.generateChapter);

module.exports = router;