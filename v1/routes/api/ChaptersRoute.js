"use strict";

const express = require("express");
const router = express.Router();

const { ChaptersCtrl } = require("../../controllers");

router.get("/chapters/bySeriesId/:seriesId", ChaptersCtrl.getChaptersBySeriesId);
router.get("/chapters/byGroupId/:groupId", ChaptersCtrl.getChaptersByGroupId);
router.get("/chapters/byId/:chapterId", ChaptersCtrl.getChapterById);
router.post("/chapters/add", ChaptersCtrl.addChapter);
router.put("/chapters/update/:chapterId", ChaptersCtrl.updateChapter);
router.delete("/chapters/delete/:chapterId", ChaptersCtrl.deleteChapter);

module.exports = router;