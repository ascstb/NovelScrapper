"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VoiceSchema = new Schema(
    {
        language: Schema.Types.String,
        country: Schema.Types.String,
        group: Schema.Types.String,
        voiceName: Schema.Types.String,
        gender: Schema.Types.String,
        model: Schema.Types.String,
        filePath: Schema.Types.String,
        minAge: Schema.Types.Number,
        maxAge: Schema.Types.Number,
        pitch: Schema.Types.String,
        timbre: Schema.Types.String,
        texture: Schema.Types.String,
        energy: Schema.Types.String,
        speed: Schema.Types.String,
        temperament: Schema.Types.String,
    },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Voice", VoiceSchema);