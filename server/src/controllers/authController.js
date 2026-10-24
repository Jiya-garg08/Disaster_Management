
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const NGO = require("../models/NGO");


exports.register = async (req, res) => {
  let createdUser = null;

  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      organizationName,
      registrationNumber,
      organisationPan,
      city,
      state,
      country,
      address,
      latitude,
      longitude,
      serviceRadiusKm
    } = req.body;

    let serviceAreas = [];
    let supportedEmergencies = [];

    try {
      serviceAreas = Array.isArray(req.body.serviceAreas)
        ? req.body.serviceAreas
        : JSON.parse(req.body.serviceAreas || "[]");

      supportedEmergencies = Array.isArray(req.body.supportedEmergencies)
        ? req.body.supportedEmergencies
        : JSON.parse(req.body.supportedEmergencies || "[]");

      if (
        !Array.isArray(serviceAreas) ||
        !Array.isArray(supportedEmergencies)
      ) {
        throw new Error("Service fields must be arrays.");
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid service areas or supported emergencies."
      });
    }

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided."
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters."
      });
    }

    if (!["individual", "ngo"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role."
      });
    }

    if (role === "ngo") {
      if (
        !organizationName?.trim() ||
        !address?.trim() ||
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude)) ||
        latitude === "" ||
        longitude === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Required NGO organization and location details are missing."
        });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    // Create the user before using user._id for the NGO profile.
    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
      role
    });

    if (role === "ngo") {
      const registrationFile =
        req.files?.registrationCertificate?.[0];

      const panFile =
        req.files?.panDocument?.[0];

      await NGO.create({
        user: createdUser._id,
        organizationName: organizationName.trim(),
        registrationNumber: registrationNumber || "",
        organisationPan: organisationPan || "",
        city: city || "",
        state: state || "",
        country: country || "",
        address: address.trim(),

        location: {
          latitude: Number(latitude),
          longitude: Number(longitude)
        },

        serviceAreas,
        supportedEmergencies,

        serviceRadiusKm:
          serviceRadiusKm !== "" &&
          serviceRadiusKm !== undefined &&
          Number.isFinite(Number(serviceRadiusKm))
            ? Math.max(0, Number(serviceRadiusKm))
            : 25,

        verificationStatus: "pending",

        documents: {
          registrationCertificate: registrationFile
            ? {
                filename: registrationFile.filename,
                originalName: registrationFile.originalname,
                mimeType: registrationFile.mimetype,
                uploadedAt: new Date()
              }
            : undefined,

          panDocument: panFile
            ? {
                filename: panFile.filename,
                originalName: panFile.originalname,
                mimeType: panFile.mimetype,
                uploadedAt: new Date()
              }
            : undefined
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: role === "ngo"
        ? "Registration successful. Your NGO account is awaiting verification."
        : "Registration successful.",
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    // Remove the user if NGO profile creation failed.
    if (createdUser?._id) {
      try {
        await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupError) {
        console.error("Registration cleanup error:", cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "This account does not match the selected role."
      });
    }

let ngoStatus = null;

if (user.role === "ngo") {
    const ngoProfile = await NGO.findOne({ user: user._id });

    if (!ngoProfile) {
        return res.status(403).json({
            success: false,
            message: "NGO profile not found. Please contact support."
        });
    }

    ngoStatus = String(
        ngoProfile.verificationStatus || "pending"
    ).trim().toLowerCase();

    // Block rejected NGOs only. Pending NGOs can log in.
    if (ngoStatus === "rejected") {
        return res.status(403).json({
            success: false,
            status: ngoStatus,
            message: "Your NGO registration has been rejected. Please contact Relief Resolver staff."
        });
    }
}


    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive."
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    
return res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verificationStatus: ngoStatus
    }
});

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
};



exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    let ngoProfile = null;

    if (user.role === "ngo") {
      ngoProfile = await NGO.findOne({
        user: user._id
      }).lean();

      if (!ngoProfile) {
        return res.status(404).json({
          success: false,
          message: "NGO profile not found."
        });
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationName: ngoProfile?.organizationName || "",
        address: ngoProfile?.address || "",
        latitude: ngoProfile?.location?.latitude ?? null,
        longitude: ngoProfile?.location?.longitude ?? null,
        serviceAreas: ngoProfile?.serviceAreas || [],
        supportedEmergencies: ngoProfile?.supportedEmergencies || [],
        serviceRadiusKm: ngoProfile?.serviceRadiusKm ?? 25,
        status: ngoProfile?.verificationStatus || null
      }
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load account profile."
    });
  }
};


exports.verifyNGO = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be verified or rejected."
      });
    }

    const ngoProfile = await NGO.findById(req.params.id);

    if (!ngoProfile) {
      return res.status(404).json({
        success: false,
        message: "NGO profile not found."
      });
    }

    // Enforce document and checklist requirements before verification.
    if (status === "verified") {
      const hasRegistrationCertificate = Boolean(
        ngoProfile.documents?.registrationCertificate?.filename
      );

      const hasPanDocument = Boolean(
        ngoProfile.documents?.panDocument?.filename
      );

      if (!hasRegistrationCertificate || !hasPanDocument) {
        return res.status(400).json({
          success: false,
          message:
            "Registration certificate and PAN document are required before NGO verification."
        });
      }

      const checklist = ngoProfile.verificationChecklist;

      if (
        !checklist?.registrationReviewed ||
        !checklist?.panReviewed ||
        !checklist?.documentsReviewed
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please review all NGO documents before verification."
        });
      }
    }

    ngoProfile.verificationStatus = status;
    await ngoProfile.save();

    return res.status(200).json({
      success: true,
      message: `NGO ${status} successfully.`,
      ngo: {
        id: ngoProfile._id.toString(),
        organizationName: ngoProfile.organizationName,
        status: ngoProfile.verificationStatus
      }
    });
  } catch (error) {
    console.error("NGO verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update NGO verification status."
    });
  }
};


exports.viewNGODocument = async (req, res) => {
  try {
    const { id, kind } = req.params;

    const documentFields = {
      registration: "registrationCertificate",
      pan: "panDocument"
    };

    const field = documentFields[kind];

    if (!field) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type."
      });
    }

    const ngo = await NGO.findById(id).lean();

    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: "NGO profile not found."
      });
    }

    const document = ngo.documents?.[field];

    if (!document?.filename) {
      return res.status(404).json({
        success: false,
        message: "This document has not been uploaded."
      });
    }

    const path = require("path");
    const fs = require("fs");

    const uploadDirectory = path.resolve(
      __dirname,
      "../../uploads/ngos"
    );

    const filePath = path.resolve(
      uploadDirectory,
      document.filename
    );

    if (
      path.dirname(filePath) !== uploadDirectory ||
      !fs.existsSync(filePath)
    ) {
      return res.status(404).json({
        success: false,
        message: "Document file could not be found."
      });
    }

    res.setHeader(
      "Content-Type",
      document.mimeType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(document.originalName || document.filename).replace(/["\\\r\n]/g, "_")}"`
    );

    return res.sendFile(filePath);
  } catch (error) {
    console.error("NGO document viewing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to open NGO document."
    });
  }
};


exports.getAllNGOs = async (req, res) => {
  try {
    const ngos = await NGO.find()
      .populate("user", "name email phone isActive")
      .lean();

    return res.status(200).json({
      success: true,

      ngos: ngos.map((ngo) => ({
        id: ngo._id.toString(),
        userId: ngo.user?._id?.toString() || "",
        name: ngo.organizationName,
        contactPerson: ngo.user?.name || "",
        email: ngo.user?.email || "",
        phone: ngo.user?.phone || "",
        address: ngo.address,
        registrationNumber: ngo.registrationNumber || "",
        organisationPan: ngo.organisationPan || "",
        city: ngo.city || "",
        state: ngo.state || "",
        country: ngo.country || "",
        latitude: ngo.location?.latitude ?? null,
        longitude: ngo.location?.longitude ?? null,
        serviceAreas: ngo.serviceAreas || [],
        services: ngo.supportedEmergencies || [],
        status: ngo.verificationStatus,
        verificationStatus: ngo.verificationStatus,
        availability: ngo.availability,

        verificationChecklist: {
  registrationReviewed:
    ngo.verificationChecklist?.registrationReviewed ?? false,

  panReviewed:
    ngo.verificationChecklist?.panReviewed ?? false,

  documentsReviewed:
    ngo.verificationChecklist?.documentsReviewed ?? false
},

        documents: {
          registrationCertificate: ngo.documents?.registrationCertificate?.filename
            ? {
                filename: ngo.documents.registrationCertificate.filename,
                originalName: ngo.documents.registrationCertificate.originalName || "",
                mimeType: ngo.documents.registrationCertificate.mimeType || "",
                uploadedAt: ngo.documents.registrationCertificate.uploadedAt || null
              }
            : null,

          panDocument: ngo.documents?.panDocument?.filename
            ? {
                filename: ngo.documents.panDocument.filename,
                originalName: ngo.documents.panDocument.originalName || "",
                mimeType: ngo.documents.panDocument.mimeType || "",
                uploadedAt: ngo.documents.panDocument.uploadedAt || null
              }
            : null
        }
      }))
    });
  } catch (error) {
    console.error("Fetch NGOs error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch NGOs."
    });
  }
};



exports.updateNGOVerificationChecklist = async (req, res) => {
  try {
    const { field, value } = req.body;

    const allowedFields = [
      "registrationReviewed",
      "panReviewed",
      "documentsReviewed"
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification checklist field."
      });
    }

    if (typeof value !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Checklist value must be true or false."
      });
    }

    const ngo = await NGO.findById(req.params.id);

    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: "NGO profile not found."
      });
    }

    ngo.set(`verificationChecklist.${field}`, value);
    await ngo.save();

    return res.status(200).json({
      success: true,
      message: "Verification checklist updated successfully.",
      verificationChecklist: ngo.verificationChecklist
    });
  } catch (error) {
    console.error("NGO checklist update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update NGO verification checklist."
    });
  }
};
