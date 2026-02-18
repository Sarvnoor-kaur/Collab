const express = require("express");
const path = require("path");

let multer;
try {
  multer = require("multer");
} catch (e) {
  console.warn(
    "Optional dependency 'multer' not installed — recording uploads disabled.",
  );
  multer = null;
}

const router = express.Router();

if (multer) {
  const upload = multer({ dest: path.join(__dirname, "../../uploads") });

  // Simple upload endpoint for recordings. In production, upload to S3 or blob storage.
  router.post("/", upload.single("recording"), async (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      // For development, expose the uploads folder statically or return a path
      const url = `/uploads/${req.file.filename}`;
      return res.json({ success: true, url });
    } catch (err) {
      console.error("Recording upload error:", err);
      return res.status(500).json({ success: false, message: "Upload failed" });
    }
  });
} else {
  // Fallback route: informs client that uploads are disabled until multer is installed
  router.post("/", (req, res) => {
    res
      .status(503)
      .json({
        success: false,
        message:
          "Recording uploads disabled on server (missing multer). Install multer to enable.",
      });
  });
}

module.exports = router;
