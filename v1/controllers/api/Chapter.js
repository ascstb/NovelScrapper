"use strict";

const { ChapterModel } = require("../../../models");

const getChapterById = async (req, res) => {
  const { chapterId } = req.params;
  try {
    const chapter = await ChapterModel.findById(chapterId);
    if (chapter) {
      res.status(200).json(chapter);
    } else {
      res.status(404).json({ error: "Chapter not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to retrieve chapter." });
  }
};

const getChaptersBySeriesId = async (req, res) => {
  const { seriesId } = req.params;
  try {
    const chapters = await ChapterModel.find({ seriesId: seriesId });
    res.status(200).json(chapters);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to retrieve chapters." });
  }
};

const getChaptersByGroupId = async (req, res) => {
  const { groupId } = req.params;
  try {
    const chapters = await ChapterModel.find({ groupId: groupId });
    res.status(200).json(chapters);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to retrieve chapters." });
  }
};

const addChapter = async (req, res) => {
  const body = req.body;

  //#region Validations
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No information sent." });
  }
  //#endregion

  try {
    const chapter = await ChapterModel(body).save();
    res.status(201).json(chapter);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create chapter." });
  }
};

const updateChapter = async (req, res) => {
  const { chapterId } = req.params;
  const body = req.body;

  //#region Validations
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No information sent." });
  }
  //#endregion

  try {
    const chapter = await ChapterModel.findByIdAndUpdate(chapterId, body, {
      new: true,
    });
    if (chapter) {
      res.status(200).json(chapter);
    } else {
      res.status(404).json({ error: "Chapter not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update chapter." });
  }
};

const deleteChapter = async (req, res) => {
  const { chapterId } = req.params;

  //#region Validations
  if (!chapterId) {
    return res.status(400).json({ error: "Invalid or Empty Id." });
  }
  //#endregion

  try {
    const deletedChapter = await ChapterModel.findByIdAndDelete(chapterId);
    if (deletedChapter) {
      res.status(200).json({ message: "Chapter deleted successfully." });
    } else {
      res.status(404).json({ error: "Chapter not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete chapter." });
  }
};

module.exports = {
  getChapterById,
  getChaptersBySeriesId,
  getChaptersByGroupId,
  addChapter,
  updateChapter,
  deleteChapter,
};
