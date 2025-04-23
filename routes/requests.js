const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, requestController.createRequest);
router.get("/", authMiddleware, requestController.getRequests);
router.put("/respond/:id", authMiddleware, requestController.respondToRequest);

module.exports = router;
