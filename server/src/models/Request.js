
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    individual: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    emergencyType: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },
evidencePhoto: {
  type: String,
  default: ""
},

    location: {
      address: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number }
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true
    },

    peopleAffected: {
      type: Number,
      min: 1,
      default: 1
    },

    
daysWithoutSupply: {
  type: Number,
  min: 0,
  default: 0
},

urgencyLevel: {
  type: String,
  enum: ["normal", "urgent", "critical"],
  default: "normal"
},

vulnerablePerson: {
  type: Boolean,
  default: false
},


    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },

 
ngoResponses: [
  {
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    response: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },
    progressStatus: {
      type: String,
     enum: [
  "not_started",
  "accepted",
  "preparing",
  "on_the_way",
  "reached",
  "delivered"
],
      default: "not_started"
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now
    }
  }
],


trackingNgoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},
trackingNgoName: {
    type: String,
    default: ""
},
trackingNgoPhone: {
    type: String,
    default: ""
},

coordinationStatus: {
  type: String,
  enum: [
    "available",
    "ngo_accepted",
    "preparing",
    "on_the_way",
    "reached",
    "delivered",
    "assistance_delivered"
  ],
  default: "available"
},


    helpReceived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
