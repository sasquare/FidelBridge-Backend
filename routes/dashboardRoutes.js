const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/auth");

router.get("/metrics", authMiddleware, dashboardController.getMetrics);
router.get("/requests", authMiddleware, dashboardController.getRequests);

module.exports = router;
