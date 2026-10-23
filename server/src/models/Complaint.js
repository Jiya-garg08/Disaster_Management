
const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    complaintNumber: {
      type: String,
      unique: true,
      index: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null
    },
    category: {
      type: String,
      enum: ["relief", "ngo", "disaster"],
      required: true
    },
    issueType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "rejected"],
      default: "pending",
      index: true
    },
    controlRoomRemarks: {
      type: String,
      default: "",
      maxlength: 2000
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "under_review", "resolved", "rejected"]
        },
        remarks: {
          type: String,
          default: ""
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

complaintSchema.pre("validate", function () {
  if (!this.complaintNumber) {
    this.complaintNumber =
      `CMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);
