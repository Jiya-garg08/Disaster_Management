
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(
  __dirname,
  "../../uploads/ngos"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
  }
});


const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
];


const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {
    console.log("NGO upload received:", {
      field: file.fieldname,
      filename: file.originalname,
      mimeType: file.mimetype
    });

    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.error("Rejected NGO document:", {
        field: file.fieldname,
        filename: file.originalname,
        mimeType: file.mimetype
      });

      return cb(
        new Error(
          `Unsupported file type: ${file.mimetype || "empty"}. Please upload a PDF, JPG, or PNG file.`
        )
      );
    }

    cb(null, true);
  }
});

module.exports = upload;
