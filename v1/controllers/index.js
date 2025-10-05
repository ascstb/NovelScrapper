"use strict";

const Auth = require("./auth/Auth");
const Scrapper = require("./api/Scrapper");
const TTS = require("./api/TTS");
const Translator = require("./api/Translator");

const Home = require("./pages/Home");

module.exports = {
  AuthCtrl: Auth,
  HomeCtrl: Home,
  ScrapperCtrl: Scrapper,
  TTSCtrl: TTS,
  TranslatorCtrl: Translator,
};
