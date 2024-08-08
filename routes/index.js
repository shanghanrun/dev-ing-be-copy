const express = require("express");
const router = express.Router();

const userApi = require("./user.api");
const authApi = require("./auth.api");
const postApi = require("./post.api");
const meetUpApi = require("./meetUp.api");
const qnaApi = require("./qna.api");
const homeApi = require("./home.api");
const chatApi = require("./chat.api");
const reportApi = require("./report.api");
const adminApi = require("./admin.api");

router.use("/user", userApi);
router.use("/auth", authApi);
router.use("/post", postApi);
router.use("/meetup", meetUpApi);
router.use("/qna", qnaApi);
router.use("/home", homeApi);
router.use("/chat", chatApi);
router.use("/report", reportApi);
router.use("/admin", adminApi);

module.exports = router;
