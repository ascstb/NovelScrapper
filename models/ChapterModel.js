"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChapterSchema = new Schema(
  {
    seriesId: Schema.Types.ObjectId,
    groupId: Schema.Types.ObjectId,
    chapterNumber: Schema.Types.Number,
    title: Schema.Types.String,
    subtitle: Schema.Types.String,
    contentSource: [
      {
        language: Schema.Types.String,
        url: Schema.Types.String,
      },
    ],
    audioSource: [
      {
        language: Schema.Types.String,
        url: Schema.Types.String,
      },
    ],
    duration: Schema.Types.Number,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Chapter", ChapterSchema);
