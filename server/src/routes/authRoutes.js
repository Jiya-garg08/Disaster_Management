
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  verifyNGO,
  getAllNGOs,
   viewNGODocument,
    updateNGOVerificationChecklist
} = require("../controllers/authController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadNGODocuments");
router.post(
  "/register",
  upload.fields([
    { name: "registrationCertificate", maxCount: 1 },
    { name: "panDocument", maxCount: 1 }
  ]),
  register
);
router.post("/login", login);

router.get("/me", protect, getMe);
router.get(
  "/ngos",
  protect,
  authorize("control_room"),
  getAllNGOs
);

router.patch(
  "/ngos/:id/verification",
  protect,
  authorize("control_room"),
  verifyNGO
);
router.patch(
  "/ngos/:id/verification-checklist",
  protect,
  authorize("control_room"),
  updateNGOVerificationChecklist
);

router.get(
  "/ngos/:id/documents/:kind",
  protect,
  authorize("control_room"),
  viewNGODocument
);
module.exports = router;
