const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");

router.post("/", userController.createUser);
router.get("/", authController.authenticate, userController.getUser);
router.post("/block", authController.authenticate, authController.checkAdminPermission, userController.blockUser)
router.get("/all", userController.getAllUser);
router.get("/me/:nickName", userController.getUserByNickName);
router.post("/me/:nickName/follow", authController.authenticate, userController.followUser);
router.post("/me/:nickName/unfollow", authController.authenticate, userController.unfollowUser);
router.get("/:id", userController.getUserInfo);
router.put("/", authController.authenticate, userController.updateUser);
router.put("/google", authController.authenticate, userController.updateGoogleUser);
router.post("/forgetpassword", userController.forgetPassword);
router.post("/resetpassword", userController.resetPassword);

module.exports = router;
