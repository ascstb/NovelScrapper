"use strict";

const { SeriesModel } = require("../../../models");

const getAllSeries = async (req, res) => {
  try {
    const series = await SeriesModel.find({}, {});
    res.status(200).json(series);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to retrieve series." });
  }
};

const getSeriesById = async (req, res) => {
  const { seriesId } = req.params;
  try {
    const series = await SeriesModel.findById(seriesId);
    if (series) {
      res.status(200).json(series);
    } else {
      res.status(404).json({ error: "Series not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to retrieve series." });
  }
};

const addSeries = async (req, res) => {
  const body = req.body;

  //#region Validations
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No information sent." });
  }
  //#endregion

  try {
    const series = await SeriesModel(body).save();
    res.status(201).json(series);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create series." });
  }
};

const updateSeries = async (req, res) => {
  const { seriesId } = req.params;
  const body = req.body;
  const filter = { _id: seriesId };

  //#region Validations
  if (!seriesId) {
    return res.status(400).json({ error: "Invalid or Empty Id." });
  }

  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No information sent." });
  }
  //#endregion

  try {
    const series = await SeriesModel.findOneAndUpdate(filter, body, {
      new: true,
    });
    if (series) {
      res.status(200).json(series);
    } else {
      res.status(404).json({ error: "Series not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update series." });
  }
};

const deleteSeries = async (req, res) => {
  const { seriesId } = req.params;
  const filter = { _id: seriesId };

  //#region Validations
  if (!seriesId) {
    return res.status(400).json({ error: "Invalid or Empty Id." });
  }
  //#endregion

  try {
    const series = await SeriesModel.findByIdAndDelete(filter);
    if (series) {
      res.status(200).json({ message: "Series deleted successfully." });
    } else {
      res.status(404).json({ error: "Series not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete series." });
  }
};

module.exports = {
  getAllSeries,
  getSeriesById,
  addSeries,
  updateSeries,
  deleteSeries,
};
