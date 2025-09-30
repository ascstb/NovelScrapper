const express = require("express");
const router = express.Router();

const { AuthCtrl } = require("../../controllers");

router.post("/auth/signIn/", AuthCtrl.signIn);

module.exports = router;
