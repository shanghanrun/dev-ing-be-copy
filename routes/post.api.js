const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const authController = require("../controllers/auth.controller");

//post 관련 라우터
router.get("/all", authController.authenticate, postController.getAllPost);
router.get("/:id", postController.getPost);
router.post("/", authController.authenticate, postController.createPost);
router.put("/:id", postController.updatePost);
router.delete("/:id", authController.authenticate, postController.deletePost);
router.put("/block/:id", authController.authenticate, authController.checkAdminPermission, postController.blockPost);

//comment 관련 라우터
router.post('/comment', authController.authenticate, postController.createComment)
router.put('/:postId/comment/:commentId', authController.authenticate, postController.updateComment)
router.delete('/:postId/comment/:commentId', authController.authenticate, postController.deleteComment)

//like & scrap 관련 라우터
router.post("/like", authController.authenticate, postController.incrementLikesAndAddUser)
router.post('/scrap', authController.authenticate, postController.addScrap)
router.put('/scrap/private', authController.authenticate, postController.toggleScrapPrivate)
router.put('/scrap/delete', authController.authenticate, postController.deleteScrap)


module.exports = router;
