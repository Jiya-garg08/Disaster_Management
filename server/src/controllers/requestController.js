
const Request = require("../models/Request");



exports.createRequest = async (req, res) => {
  try {
    const {
      requestNumber,
      emergencyType,
      description,
      location,
      contactNumber,
      peopleAffected,
      daysWithoutSupply,
      urgencyLevel,
      vulnerablePerson,
      evidencePhoto
    } = req.body;

    if (
      !emergencyType ||
      !description ||
      !location?.address ||
      !contactNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Emergency type, description, address, and contact number are required."
      });
    }

    const request = await Request.create({
      requestNumber:
        requestNumber ||
        `RR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      individual: req.user.id,
      emergencyType,
      description,
      evidencePhoto: evidencePhoto || "",
      location,
      contactNumber,
      peopleAffected: Number(peopleAffected) || 1,
      daysWithoutSupply: Number(daysWithoutSupply) || 0,
      urgencyLevel: urgencyLevel || "normal",
      vulnerablePerson: Boolean(vulnerablePerson),
      verificationStatus: "pending",
      ngoResponses: [],
      
      helpReceived: false
    });

    return res.status(201).json({
      success: true,
      message:
        "Emergency request submitted and is awaiting Control Room verification.",
      request
    });
  } catch (error) {
    console.error("Create request error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This request number already exists."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit emergency request."
    });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const {
      requestNumber,
      emergencyType,
      description,
      location,
      contactNumber,
      peopleAffected,
      daysWithoutSupply,
      urgencyLevel,
      vulnerablePerson,
      evidencePhoto
    } = req.body;

    if (
      !emergencyType ||
      !description ||
      !location?.address ||
      !contactNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Emergency type, description, address, and contact number are required."
      });
    }

    const request = await Request.create({
      requestNumber:
        requestNumber ||
        `RR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      individual: req.user.id,
      emergencyType,
      description,
      evidencePhoto: evidencePhoto || "",
      location,
      contactNumber,
      peopleAffected: Number(peopleAffected) || 1,
      daysWithoutSupply: Number(daysWithoutSupply) || 0,
      urgencyLevel: urgencyLevel || "normal",
      vulnerablePerson: Boolean(vulnerablePerson),
      verificationStatus: "pending",
      ngoResponses: [],
      
      helpReceived: false
    });

    return res.status(201).json({
      success: true,
      message:
        "Emergency request submitted and is awaiting Control Room verification.",
      request
    });
  } catch (error) {
    console.error("Create request error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This request number already exists."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit emergency request."
    });
  }
};



exports.getMyRequests = async (req, res) => {
    try {
        const requests = await Request.find({
            individual: req.user.id
        }).sort({ createdAt: -1 });

        const NGO = require("../models/NGO");
        const User = require("../models/user");

        for (const request of requests) {
            if (!request.trackingNgoId) continue;

            const ngo = await NGO.findOne({
                user: request.trackingNgoId
            }).lean();

            if (!ngo) {
                console.warn(
                    "Assigned NGO profile not found:",
                    String(request.trackingNgoId)
                );
                continue;
            }

            // Fetch contact information from the associated User.
            const user = await User.findById(ngo.user)
                .select("name email phone")
                .lean();

            if (ngo.organizationName) {
                request.trackingNgoName = ngo.organizationName;
            }

            // Return the actual NGO profile and contact details.
            request._doc.trackingNGODetails = {
                name:
                    ngo.organizationName ||
                    request.trackingNgoName ||
                    "Assigned NGO",
                phone: user?.phone || "",
                email: user?.email || "",
                city: ngo.city || "",
                state: ngo.state || "",
                address: ngo.address || "",
                services: ngo.supportedEmergencies || [],
                serviceAreas: ngo.serviceAreas || [],
                availability: ngo.availability || "",
                capacity: ngo.capacity || {},
                inventory: ngo.inventory || {}
            };

            // Validate the NGO coordinates.
            const latitude = Number(ngo.location?.latitude);
            const longitude = Number(ngo.location?.longitude);

            if (
                ngo.location?.latitude != null &&
                ngo.location?.longitude != null &&
                ngo.location.latitude !== "" &&
                ngo.location.longitude !== "" &&
                Number.isFinite(latitude) &&
                Number.isFinite(longitude) &&
                latitude >= -90 &&
                latitude <= 90 &&
                longitude >= -180 &&
                longitude <= 180
            ) {
                request._doc.trackingNgoCoordinates = {
                    latitude,
                    longitude
                };
            }
        }

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error("Fetch requests error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your requests."
        });
    }
};


exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("individual", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const formattedRequests = requests.map((request) => ({
      ...request,
      id: request._id.toString(),
      mongoId: request._id.toString(),
      reporterName: request.individual?.name || "Affected Person",
      contactNumber:
        request.contactNumber ||
        request.individual?.phone ||
        "",
      situationDetails: request.description || "",
      verified: request.verificationStatus === "verified",
      status: request.verificationStatus,
      lat: request.location?.latitude ?? null,
      lng: request.location?.longitude ?? null,
      locationName: request.location?.address || "Affected location",
      peopleAffected: request.peopleAffected || 1
    }));

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    });
  } catch (error) {
    console.error("Fetch all requests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch emergency requests."
    });
  }
};


exports.verifyRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either verified or rejected."
      });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Emergency request not found."
      });
    }

    if (request.verificationStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: "This request has already been reviewed."
      });
    }

    request.verificationStatus = status;
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Emergency request ${status} successfully.`,
      request
    });
  } catch (error) {
    console.error("Verify request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update request verification."
    });
  }
};


exports.acceptRequestForNGO = async (req, res) => {
    try {
        const NGO = require("../models/NGO");
        const User = require("../models/user");

        // 1. Fetch the logged-in NGO profile.
        const ngo = await NGO.findOne({
            user: req.user.id
        }).lean();

        if (!ngo) {
            return res.status(404).json({
                success: false,
                message: "NGO profile not found."
            });
        }

        // 2. Get the linked user's contact details.
        const user = await User.findById(req.user.id)
            .select("name phone")
            .lean();

        // The actual organization name is organizationName.
        const ngoName =
            ngo.organizationName ||
            user?.name ||
            "Verified NGO";

        const ngoPhone = user?.phone || "";

        // 3. Identify the request.
        const { id } = req.params;

        if (!id || !require("mongoose").isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        const existing = await Request.findById(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Emergency request not found."
            });
        }

        if (existing.verificationStatus !== "verified") {
            return res.status(409).json({
                success: false,
                message: "Only verified requests can be accepted."
            });
        }

        // 4. Prevent another NGO from claiming this request.
        if (existing.trackingNgoId) {
            if (
                String(existing.trackingNgoId) ===
                String(req.user.id)
            ) {
                // Repair the name if this NGO already accepted it.
                const updatedExisting = await Request.findByIdAndUpdate(
                    existing._id,
                    {
                        $set: {
                            trackingNgoName: ngoName,
                            trackingNgoPhone: ngoPhone
                        }
                    },
                    { new: true }
                );

                return res.status(200).json({
                    success: true,
                    message: "Your NGO has already accepted this request.",
                    request: updatedExisting
                });
            }

            return res.status(409).json({
                success: false,
                message: "This request has already been accepted by another NGO."
            });
        }

        const now = new Date();

        // 5. Atomically claim the request and initialize tracking.
        const request = await Request.findOneAndUpdate(
            {
                _id: id,
                verificationStatus: "verified",
                $or: [
                    { trackingNgoId: null },
                    { trackingNgoId: { $exists: false } },
                    { trackingNgoId: "" }
                ]
            },
            {
                $set: {
                    trackingNgoId: req.user.id,
                    trackingNgoName: ngoName,
                    trackingNgoPhone: ngoPhone,
                    coordinationStatus: "ngo_accepted"
                },
                $push: {
                    ngoResponses: {
                        ngo: req.user.id,
                        response: "accepted",
                        progressStatus: "accepted",
                        respondedAt: now,
                        statusUpdatedAt: now
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!request) {
            return res.status(409).json({
                success: false,
                message: "Another NGO has already accepted this request. Refresh your list."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request accepted successfully.",
            request
        });

    } catch (error) {
        console.error("Accept request error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to accept this request."
        });
    }
};


exports.getVerifiedRequestsForNGO = async (req, res) => {
  try {
    const NGO = require("../models/NGO");

const ngo = await NGO.findOne({
  user: req.user.id
}).lean();

if (!ngo) {
  return res.status(404).json({
    success: false,
    message: "NGO profile not found."
  });
}

    // Get the NGO's registered coordinates.
   const ngoLat = Number(ngo.location?.latitude);
const ngoLng = Number(ngo.location?.longitude);

console.log("NGO location:", ngo.location);
console.log("NGO coordinates:", ngoLat, ngoLng);

    if (!Number.isFinite(ngoLat) || !Number.isFinite(ngoLng)) {
      return res.status(400).json({
        success: false,
        message: "Your NGO account needs valid latitude and longitude."
      });
    }

    const requests = await Request.find({
      verificationStatus: "verified"
    })
      .populate("individual", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    const toRadians = (degrees) => degrees * Math.PI / 180;

    const distanceKm = (lat1, lng1, lat2, lng2) => {
      const dLat = toRadians(lat2 - lat1);
      const dLng = toRadians(lng2 - lng1);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLng / 2) ** 2;

      return 6371 * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );
    };


const nearbyRequests = requests.filter((request) => {
  // Hide requests claimed by a different NGO.
  if (
    request.trackingNgoId &&
    String(request.trackingNgoId) !== String(req.user.id)
  ) {
    return false;
  }

  const lat = Number(request.location?.latitude);
  const lng = Number(request.location?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  const distance = distanceKm(ngoLat, ngoLng, lat, lng);
  const operatingRadius = Number(ngo.serviceRadiusKm) || 0;
  const totalRadius = operatingRadius + 25;

  return distance <= totalRadius;
});


    const formattedRequests = nearbyRequests.map((request) => ({
      ...request,
      id: request._id.toString(),
      mongoId: request._id.toString(),
      reporterName: request.individual?.name || "Affected Person",
      submittedByName: request.individual?.name || "Affected Person",
      contactNumber: request.contactNumber || request.individual?.phone || "",
      situationDetails: request.description || "",
      description: request.description || "",
      verified: true,
      status: request.verificationStatus,
      ngoNotificationStatus: "notified",
      lat: request.location?.latitude ?? null,
      lng: request.location?.longitude ?? null,
      locationName: request.location?.address || "Affected location",
      peopleAffected: request.peopleAffected || 1,
      victims: request.peopleAffected || 1,
      supplyType: request.emergencyType || "Relief support"
    }));

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    });
  } catch (error) {
    console.error("Fetch verified NGO requests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch verified emergency requests."
    });
  }
};


exports.updateNGOTracking = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "preparing",
      "on_the_way",
      "reached",
      "delivered"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tracking status."
      });
    }

    const request = await Request.findOne({
      _id: req.params.id,
      verificationStatus: "verified",
      trackingNgoId: req.user.id,
      ngoResponses: {
        $elemMatch: {
          ngo: req.user.id,
          response: "accepted"
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Accepted request not found for your NGO."
      });
    }

    const ngoResponse = request.ngoResponses.find(
      item => String(item.ngo) === String(req.user.id)
    );

    if (!ngoResponse) {
      return res.status(404).json({
        success: false,
        message: "NGO response was not found."
      });
    }

    const steps = [
      "accepted",
      "preparing",
      "on_the_way",
      "reached",
      "delivered"
    ];

    const currentIndex = steps.indexOf(
      ngoResponse.progressStatus || "accepted"
    );

    if (
      currentIndex < 0 ||
      steps.indexOf(status) !== currentIndex + 1
    ) {
      return res.status(409).json({
        success: false,
        message: "Please complete the previous tracking step first."
      });
    }

    ngoResponse.progressStatus = status;
    ngoResponse.statusUpdatedAt = new Date();

    request.coordinationStatus =
      status === "delivered" ? "delivered" : status;

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Tracking status updated successfully.",
      request
    });
  } catch (error) {
    console.error("========== NGO TRACKING ERROR ==========");
    console.error(error.message);
    console.error(error.stack);
    console.error("=========================================");

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update tracking status."
    });
  }
};



exports.attachEvidence = async (req, res) => {
    try {
        const { evidencePhoto } = req.body;

        if (
            typeof evidencePhoto !== "string" ||
            !evidencePhoto.startsWith("data:image/")
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid evidence image is required."
            });
        }

        const request = await Request.findByIdAndUpdate(
            req.params.id,
            { evidencePhoto },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        res.json({
            success: true,
            message: "Evidence attached successfully.",
            request
        });
    } catch (error) {
        console.error("Attach evidence error:", error);

        res.status(500).json({
            success: false,
            message: "Could not attach evidence."
        });
    }
};



exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("individual", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const formattedRequests = requests.map((request) => ({
      ...request,
      id: request._id.toString(),
      mongoId: request._id.toString(),
      reporterName: request.individual?.name || "Affected Person",
      contactNumber:
        request.contactNumber ||
        request.individual?.phone ||
        "",
      situationDetails: request.description || "",
      verified: request.verificationStatus === "verified",
      status: request.verificationStatus,
      lat: request.location?.latitude ?? null,
      lng: request.location?.longitude ?? null,
      locationName: request.location?.address || "Affected location",
      peopleAffected: request.peopleAffected || 1
    }));

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    });
  } catch (error) {
    console.error("Fetch all requests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch emergency requests."
    });
  }
};


exports.verifyRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either verified or rejected."
      });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Emergency request not found."
      });
    }

    if (request.verificationStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: "This request has already been reviewed."
      });
    }

    request.verificationStatus = status;
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Emergency request ${status} successfully.`,
      request
    });
  } catch (error) {
    console.error("Verify request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update request verification."
    });
  }
};


exports.acceptRequestForNGO = async (req, res) => {
    try {
        const NGO = require("../models/NGO");
        const User = require("../models/user");

        // 1. Fetch the logged-in NGO profile.
        const ngo = await NGO.findOne({
            user: req.user.id
        }).lean();

        if (!ngo) {
            return res.status(404).json({
                success: false,
                message: "NGO profile not found."
            });
        }

        // 2. Get the linked user's contact details.
        const user = await User.findById(req.user.id)
            .select("name phone")
            .lean();

        // The actual organization name is organizationName.
        const ngoName =
            ngo.organizationName ||
            user?.name ||
            "Verified NGO";

        const ngoPhone = user?.phone || "";

        // 3. Identify the request.
        const { id } = req.params;

        if (!id || !require("mongoose").isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID."
            });
        }

        const existing = await Request.findById(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Emergency request not found."
            });
        }

        if (existing.verificationStatus !== "verified") {
            return res.status(409).json({
                success: false,
                message: "Only verified requests can be accepted."
            });
        }

        // 4. Prevent another NGO from claiming this request.
        if (existing.trackingNgoId) {
            if (
                String(existing.trackingNgoId) ===
                String(req.user.id)
            ) {
                // Repair the name if this NGO already accepted it.
                const updatedExisting = await Request.findByIdAndUpdate(
                    existing._id,
                    {
                        $set: {
                            trackingNgoName: ngoName,
                            trackingNgoPhone: ngoPhone
                        }
                    },
                    { new: true }
                );

                return res.status(200).json({
                    success: true,
                    message: "Your NGO has already accepted this request.",
                    request: updatedExisting
                });
            }

            return res.status(409).json({
                success: false,
                message: "This request has already been accepted by another NGO."
            });
        }

        const now = new Date();

        // 5. Atomically claim the request and initialize tracking.
        const request = await Request.findOneAndUpdate(
            {
                _id: id,
                verificationStatus: "verified",
                $or: [
                    { trackingNgoId: null },
                    { trackingNgoId: { $exists: false } },
                    { trackingNgoId: "" }
                ]
            },
            {
                $set: {
                    trackingNgoId: req.user.id,
                    trackingNgoName: ngoName,
                    trackingNgoPhone: ngoPhone,
                    coordinationStatus: "ngo_accepted"
                },
                $push: {
                    ngoResponses: {
                        ngo: req.user.id,
                        response: "accepted",
                        progressStatus: "accepted",
                        respondedAt: now,
                        statusUpdatedAt: now
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!request) {
            return res.status(409).json({
                success: false,
                message: "Another NGO has already accepted this request. Refresh your list."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request accepted successfully.",
            request
        });

    } catch (error) {
        console.error("Accept request error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to accept this request."
        });
    }
};


exports.getVerifiedRequestsForNGO = async (req, res) => {
  try {
    const NGO = require("../models/NGO");

const ngo = await NGO.findOne({
  user: req.user.id
}).lean();

if (!ngo) {
  return res.status(404).json({
    success: false,
    message: "NGO profile not found."
  });
}

    // Get the NGO's registered coordinates.
   const ngoLat = Number(ngo.location?.latitude);
const ngoLng = Number(ngo.location?.longitude);

console.log("NGO location:", ngo.location);
console.log("NGO coordinates:", ngoLat, ngoLng);

    if (!Number.isFinite(ngoLat) || !Number.isFinite(ngoLng)) {
      return res.status(400).json({
        success: false,
        message: "Your NGO account needs valid latitude and longitude."
      });
    }

    const requests = await Request.find({
      verificationStatus: "verified"
    })
      .populate("individual", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    const toRadians = (degrees) => degrees * Math.PI / 180;

    const distanceKm = (lat1, lng1, lat2, lng2) => {
      const dLat = toRadians(lat2 - lat1);
      const dLng = toRadians(lng2 - lng1);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLng / 2) ** 2;

      return 6371 * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );
    };


const nearbyRequests = requests.filter((request) => {
  // Hide requests claimed by a different NGO.
  if (
    request.trackingNgoId &&
    String(request.trackingNgoId) !== String(req.user.id)
  ) {
    return false;
  }

  const lat = Number(request.location?.latitude);
  const lng = Number(request.location?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  const distance = distanceKm(ngoLat, ngoLng, lat, lng);
  const operatingRadius = Number(ngo.serviceRadiusKm) || 0;
  const totalRadius = operatingRadius + 25;

  return distance <= totalRadius;
});


    const formattedRequests = nearbyRequests.map((request) => ({
      ...request,
      id: request._id.toString(),
      mongoId: request._id.toString(),
      reporterName: request.individual?.name || "Affected Person",
      submittedByName: request.individual?.name || "Affected Person",
      contactNumber: request.contactNumber || request.individual?.phone || "",
      situationDetails: request.description || "",
      description: request.description || "",
      verified: true,
      status: request.verificationStatus,
      ngoNotificationStatus: "notified",
      lat: request.location?.latitude ?? null,
      lng: request.location?.longitude ?? null,
      locationName: request.location?.address || "Affected location",
      peopleAffected: request.peopleAffected || 1,
      victims: request.peopleAffected || 1,
      supplyType: request.emergencyType || "Relief support"
    }));

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    });
  } catch (error) {
    console.error("Fetch verified NGO requests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch verified emergency requests."
    });
  }
};


exports.updateNGOTracking = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "preparing",
      "on_the_way",
      "reached",
      "delivered"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tracking status."
      });
    }

    const request = await Request.findOne({
      _id: req.params.id,
      verificationStatus: "verified",
      trackingNgoId: req.user.id,
      ngoResponses: {
        $elemMatch: {
          ngo: req.user.id,
          response: "accepted"
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Accepted request not found for your NGO."
      });
    }

    const ngoResponse = request.ngoResponses.find(
      item => String(item.ngo) === String(req.user.id)
    );

    if (!ngoResponse) {
      return res.status(404).json({
        success: false,
        message: "NGO response was not found."
      });
    }

    const steps = [
      "accepted",
      "preparing",
      "on_the_way",
      "reached",
      "delivered"
    ];

    const currentIndex = steps.indexOf(
      ngoResponse.progressStatus || "accepted"
    );

    if (
      currentIndex < 0 ||
      steps.indexOf(status) !== currentIndex + 1
    ) {
      return res.status(409).json({
        success: false,
        message: "Please complete the previous tracking step first."
      });
    }

    ngoResponse.progressStatus = status;
    ngoResponse.statusUpdatedAt = new Date();

    request.coordinationStatus =
      status === "delivered" ? "delivered" : status;

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Tracking status updated successfully.",
      request
    });
  } catch (error) {
    console.error("========== NGO TRACKING ERROR ==========");
    console.error(error.message);
    console.error(error.stack);
    console.error("=========================================");

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update tracking status."
    });
  }
};



exports.attachEvidence = async (req, res) => {
    try {
        const { evidencePhoto } = req.body;

        if (
            typeof evidencePhoto !== "string" ||
            !evidencePhoto.startsWith("data:image/")
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid evidence image is required."
            });
        }

        const request = await Request.findByIdAndUpdate(
            req.params.id,
            { evidencePhoto },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        res.json({
            success: true,
            message: "Evidence attached successfully.",
            request
        });
    } catch (error) {
        console.error("Attach evidence error:", error);

        res.status(500).json({
            success: false,
            message: "Could not attach evidence."
        });
    }
};
