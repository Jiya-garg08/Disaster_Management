
const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    organizationName: {
      type: String,
      required: true,
      trim: true
    },

    registrationNumber: {
      type: String,
      trim: true,
      default: ""
    },

    organisationPan: {
      type: String,
      trim: true,
      default: ""
    },

    city: {
      type: String,
      trim: true,
      default: ""
    },

    state: {
      type: String,
      trim: true,
      default: ""
    },

    country: {
      type: String,
      trim: true,
      default: ""
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },

    serviceAreas: [{
      type: String,
      trim: true
    }],

    supportedEmergencies: [{
      type: String,
      trim: true
    }],

    serviceRadiusKm: {
      type: Number,
      default: 25,
      min: 0
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },

    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available"
    },

    documents: {
      registrationCertificate: {
        filename: {
          type: String,
          default: ""
        },
        originalName: {
          type: String,
          default: ""
        },
        mimeType: {
          type: String,
          default: ""
        },
        uploadedAt: {
          type: Date,
          default: null
        }
      },

      panDocument: {
        filename: {
          type: String,
          default: ""
        },
        originalName: {
          type: String,
          default: ""
        },
        mimeType: {
          type: String,
          default: ""
        },
        uploadedAt: {
          type: Date,
          default: null
        }
      }
    },

  
    verificationChecklist: {
      registrationReviewed: {
        type: Boolean,
        default: false
      },
      panReviewed: {
        type: Boolean,
        default: false
      },
      documentsReviewed: {
        type: Boolean,
        default: false
      }
    },

    capacity: {
      volunteersAvailable: {
        type: Number,
        min: 0,
        default: 0
      },
      vehiclesAvailable: {
        type: Number,
        min: 0,
        default: 0
      }
    },

    inventory: {
      medicine: {
        type: Number,
        min: 0,
        default: 0
      },
      foodPackets: {
        type: Number,
        min: 0,
        default: 0
      },
      waterUnits: {
        type: Number,
        min: 0,
        default: 0
      }
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("NGO", ngoSchema);
