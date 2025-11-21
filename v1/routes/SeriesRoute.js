"use strict";

const express = require("express");
const router = express.Router();

const { SeriesCtrl } = require("../controllers");

router.get("/series/getAll", SeriesCtrl.getAllSeries);
router.get("/series/byId/:seriesId", SeriesCtrl.getSeriesById);
router.post("/series/add", SeriesCtrl.addSeries);
router.put("/series/update/:seriesId", SeriesCtrl.updateSeries);
router.delete("/series/delete/:seriesId", SeriesCtrl.deleteSeries);

module.exports = router;
