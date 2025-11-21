"use strict";

const { GroupModel } = require("../../../models");

const getAllGroups = async (req, res) => {
  try {
    const groups = await GroupModel.find({}, {});
    res.status(200).json(groups);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to retrieve groups." });
  }
};

const getGroupById = async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await GroupModel.findById(groupId);
    if (group) {
      res.status(200).json(group);
    } else {
      res.status(404).json({ error: "Group not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to retrieve group." });
  }
};

const getGroupBySeriesId = async (req, res) => {
  const { seriesId } = req.params;
  try {
    const groups = await GroupModel.find({ seriesId: seriesId });
    res.status(200).json(groups);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to retrieve groups." });
  }
};

const addGroup = async (req, res) => {
  const body = req.body;

  //#region Validations
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No information sent." });
  }
  //#endregion

  try {
    const group = await GroupModel(body).save();
    res.status(201).json(group);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create group." });
  }
};

const updateGroup = async (req, res) => {
  const { groupId } = req.params;
  const body = req.body;
  const filter = { _id: groupId };

  //#region Validations
  if (!groupId) {
    return res.status(400).json({ error: "Invalid or Empty Id." });
  }

  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "No information sent." });
  }
  //#endregion

  try {
    const updatedGroup = await GroupModel.findOneAndUpdate(filter, body, {
      new: true,
    });
    if (updatedGroup) {
      res.status(200).json(updatedGroup);
    } else {
      res.status(404).json({ error: "Group not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update group." });
  }
};

const deleteGroup = async (req, res) => {
  const { groupId } = req.params;

  //#region Validations
  if (!groupId) {
    return res.status(400).json({ error: "Invalid or Empty Id." });
  }
  //#endregion

  try {
    const deletedGroup = await GroupModel.findOneAndDelete({ _id: groupId });
    if (deletedGroup) {
      res.status(200).json({ message: "Group deleted successfully." });
    } else {
      res.status(404).json({ error: "Group not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete group." });
  }
};

module.exports = {
  getAllGroups,
  getGroupById,
  getGroupBySeriesId,
  addGroup,
  updateGroup,
  deleteGroup,
};
