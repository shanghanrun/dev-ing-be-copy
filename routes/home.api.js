const express = require("express");
const router = express.Router();

const homeController = require("../controllers/home.controller");

router.get("/", homeController.getHomeData);
router.get("/meetup", homeController.getHomeMeetUpData);

module.exports = router;
