
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const Request = require("../models/Request");

const CATEGORIES = ["relief", "ngo", "disaster"];
const STATUSES = ["pending", "under_review", "resolved", "rejected"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

exports.createComplaint = async (req, res) => {
  try {
    const { category, issueType, description, requestId } = req.body;

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid complaint category."
      });
    }

    if (
      typeof issueType !== "string" ||
      !issueType.trim() ||
      issueType.length > 100 ||
      typeof description !== "string" ||
      !description.trim() ||
      description.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Issue type and description are required."
      });
    }

    let linkedRequest = null;

    if (requestId) {
      if (!mongoose.isValidObjectId(requestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid emergency request ID."
        });
      }

      linkedRequest = await Request.findOne({
        _id: requestId,
        individual: req.user.id
      }).select("_id");

      if (!linkedRequest) {
        return res.status(404).json({
          success: false,
          message: "The linked request was not found for your account."
        });
      }
    }

    const complaint = await Complaint.create({
      submittedBy: req.user.id,
      request: linkedRequest?._id || null,
      category,
      issueType: issueType.trim(),
      description: description.trim(),
      statusHistory: [{
        status: "pending",
        remarks: "Complaint submitted",
        updatedBy: req.user.id
      }]
    });

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully.",
      complaint
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit complaint."
    });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      submittedBy: req.user.id
    })
      .populate("request", "requestNumber emergencyType")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error("Fetch personal complaints error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch your complaints."
    });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("submittedBy", "name email phone")
      .populate("request", "requestNumber emergencyType")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error("Fetch complaints error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch complaints."
    });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const { status, priority, remarks = "" } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID."
      });
    }

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint status."
      });
    }

    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint priority."
      });
    }

    if (typeof remarks !== "string" || remarks.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Remarks must be under 2000 characters."
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    complaint.status = status;

    if (priority !== undefined) {
      complaint.priority = priority;
    }

    complaint.controlRoomRemarks = remarks.trim();

    complaint.statusHistory.push({
      status,
      remarks: remarks.trim(),
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    await complaint.save();

    return res.json({
      success: true,
      message: "Complaint updated successfully.",
      complaint
    });
  } catch (error) {
    console.error("Update complaint error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update complaint."
    });
  }
};
