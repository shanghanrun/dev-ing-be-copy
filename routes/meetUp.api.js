const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const meetUpController = require("../controllers/meetUp.controller");

//모임 관련 라우터
router.get("/all", meetUpController.getAllMeetUp);
router.get("/:id", meetUpController.getMeetUp);
router.post("/", authController.authenticate, meetUpController.createMeetUp);
router.put("/:id", meetUpController.updateMeetUp);
router.delete("/:id", authController.authenticate, meetUpController.deleteMeetUp);
router.put("/block/:id", authController.authenticate, authController.checkAdminPermission, meetUpController.blockMeetUp);

//참여 관련 라우터
router.post("/join", authController.authenticate, meetUpController.joinMeetUp);
router.post("/leave", authController.authenticate, meetUpController.leaveMeetUp);

module.exports = router;
