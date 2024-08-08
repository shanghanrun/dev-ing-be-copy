const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const adminController = require("../controllers/admin.controller");

router.get("/post", authController.authenticate, authController.checkAdminPermission, adminController.getPostList);
router.get("/meetup", authController.authenticate, authController.checkAdminPermission, adminController.getMeetUpList);
router.get("/qna", authController.authenticate, authController.checkAdminPermission, adminController.getQnaList);

module.exports = router;