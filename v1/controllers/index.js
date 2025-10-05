"use strict";

const Auth = require("./auth/Auth");
const Scrapper = require("./api/Scrapper");

const Home = require("./pages/Home");

module.exports = {
  AuthCtrl: Auth,
  HomeCtrl: Home,
  ScrapperCtrl: Scrapper,
};
