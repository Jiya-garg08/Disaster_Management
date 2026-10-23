
const express = require("express");
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getAllRequests,
  verifyRequest,
  getVerifiedRequestsForNGO,
  attachEvidence,
  acceptRequestForNGO,
  updateNGOTracking
} = require("../controllers/requestController");
const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

// Individual routes
router.post(
  "/",
  protect,
  authorize("individual"),
  createRequest
);

router.get(
  "/mine",
  protect,
  authorize("individual"),
  getMyRequests
);

// Control Room routes
router.get(
  "/control-room",
  protect,
  authorize("control_room"),
  getAllRequests
);

router.patch(
  "/:id/verify",
  protect,
  authorize("control_room"),
  verifyRequest
);


router.patch("/:id/evidence", protect, authorize("control_room"), attachEvidence);

// NGO routes
router.get(
  "/ngo",
  protect,
  authorize("ngo"),
  getVerifiedRequestsForNGO
);
router.patch(
  "/:id/tracking",
  protect,
  authorize("ngo"),
  updateNGOTracking
);


router.patch(
  "/:id/accept",
  protect,
  authorize("ngo"),
  acceptRequestForNGO
);
module.exports = router;

