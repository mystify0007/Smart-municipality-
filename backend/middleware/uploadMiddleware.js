// middleware/uploadMiddleware.js
// Handles multipart/form-data file uploads using multer, storing files
// on local disk under /uploads. Swap the `destination` logic for an S3
// upload later without touching any controller code, since controllers
// only ever read `req.file.filename` / `req.file.path`.

const multer = require("multer");
const path = require("path");
const fs = require("fs");

function makeStorage(subfolder) {
  const uploadDir = path.join(__dirname, "..", "uploads", subfolder);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
}

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const IMAGE_AND_VIDEO_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  "video/mp4", "video/webm", "video/quicktime", // .mp4, .webm, .mov
];

function makeFileFilter(allowedTypes) {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  };
}

const uploadCertificateDoc = multer({
  storage: makeStorage("certificates"),
  fileFilter: makeFileFilter(IMAGE_MIME_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadProductImage = multer({
  storage: makeStorage("products"),
  fileFilter: makeFileFilter(IMAGE_MIME_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Complaints accept photo OR video evidence, so this one gets a larger
// size limit (videos are much bigger than a photo) and a wider mime list.
const uploadComplaintMedia = multer({
  storage: makeStorage("complaints"),
  fileFilter: makeFileFilter(IMAGE_AND_VIDEO_MIME_TYPES),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

module.exports = { uploadCertificateDoc, uploadProductImage, uploadComplaintMedia };
