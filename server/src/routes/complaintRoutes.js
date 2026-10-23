
const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint
} = require("../controllers/complaintController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

// Individual: submit and track personal complaints
router.post(
  "/",
  protect,
  authorize("individual"),
  createComplaint
);

router.get(
  "/mine",
  protect,
  authorize("individual"),
  getMyComplaints
);

// Control Room: view and manage all complaints
router.get(
  "/control-room",
  protect,
  authorize("control_room"),
  getAllComplaints
);

router.patch(
  "/:id",
  protect,
  authorize("control_room"),
  updateComplaint
);

module.exports = router;
