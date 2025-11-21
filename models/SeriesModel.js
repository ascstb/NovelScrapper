"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SeriesSchema = new Schema(
  {
    title: Schema.Types.String,
    coverUrl: Schema.Types.String,
    author: Schema.Types.String,
    description: Schema.Types.String,
    totalChapters: Schema.Types.Number,
    genres: [Schema.Types.String],
    languages: [Schema.Types.String],
    status: Schema.Types.String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Series", SeriesSchema);
