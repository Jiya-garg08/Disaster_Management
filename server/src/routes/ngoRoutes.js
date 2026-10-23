
const express = require("express");
const router = express.Router();

const { updateMyCapacity } = require("../controllers/ngoController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.patch(
  "/me/capacity",
  protect,
  authorize("ngo"),
  updateMyCapacity
);

module.exports = router;
