const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/auth");
const {
  uploadPicture,
  updateProfile,
  rateProfessional,
} = require("../controllers/userController");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

router.post(
  "/upload-picture",
  authMiddleware,
  upload.single("picture"),
  uploadPicture
);
router.put("/profile", authMiddleware, updateProfile);
router.post("/rate/:id", authMiddleware, rateProfessional);

module.exports = router;
