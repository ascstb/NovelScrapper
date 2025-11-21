"use strict";

const express = require("express");
const router = express.Router();

const { GroupsCtrl } = require("../../controllers");

router.get("/groups/getAll", GroupsCtrl.getAllGroups);
router.get("/groups/byId/:groupId", GroupsCtrl.getGroupById);
router.get("/groups/bySeriesId/:seriesId", GroupsCtrl.getGroupBySeriesId);
router.post("/groups/add", GroupsCtrl.addGroup);
router.put("/groups/update/:groupId", GroupsCtrl.updateGroup);
router.delete("/groups/delete/:groupId", GroupsCtrl.deleteGroup);

module.exports = router;