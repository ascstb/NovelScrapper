"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupSchema = new Schema(
  {
    seriesId: Schema.Types.ObjectId,
    title: Schema.Types.String,
    description: Schema.Types.String,
    sortOrder: Schema.Types.Number,
    type: Schema.Types.String,
    coverUrl: Schema.Types.String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Group", GroupSchema);
