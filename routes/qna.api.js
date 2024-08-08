const express = require("express");
const router = express.Router();
const qnaController = require("../controllers/qna.controller");
const authController = require("../controllers/auth.controller");

//질문 관련 라우터
router.get('/all', qnaController.getAllQnA)
router.get("/:id", qnaController.getQnA);
router.post("/", authController.authenticate, qnaController.createQnA);
router.put("/:id", qnaController.updateQnA);
router.delete("/:id", authController.authenticate, qnaController.deleteQnA);
router.put("/block/:id", authController.authenticate, authController.checkAdminPermission, qnaController.blockQnA);

//답변 관련 라우터
router.post("/answer", authController.authenticate, qnaController.createAnswer);
router.put("/:qnaId/answer/:answerId", authController.authenticate, qnaController.updateAnswer);
router.delete("/:qnaId/answer/:answerId", authController.authenticate, qnaController.deleteAnswer);
router.post("/:qnaId/answer/:answerId/like", authController.authenticate, qnaController.likesAnswer)

module.exports = router;
