const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const reportController = require("../controllers/report.controller");

router.post("/", authController.authenticate, reportController.createReport);
router.get("/", authController.authenticate, authController.checkAdminPermission, reportController.getAllReport);
router.put("/", authController.authenticate, authController.checkAdminPermission, reportController.updateReport);

module.exports = router;
