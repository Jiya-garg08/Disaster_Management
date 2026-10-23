
const NGO = require("../models/NGO");

exports.updateMyCapacity = async (req, res) => {
  try {
    const {
      availability,
      volunteersAvailable,
      vehiclesAvailable,
      medicine,
      foodPackets,
      waterUnits,
      services
    } = req.body;

    const allowedAvailability = [
      "available",
      "busy",
      "unavailable"
    ];

    if (
      availability !== undefined &&
      !allowedAvailability.includes(availability)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status."
      });
    }

    const numberFields = {
      volunteersAvailable,
      vehiclesAvailable,
      medicine,
      foodPackets,
      waterUnits
    };

    for (const [field, value] of Object.entries(numberFields)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      if (!Number.isInteger(Number(value)) || Number(value) < 0) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a non-negative whole number.`
        });
      }
    }

    if (
      services !== undefined &&
      (!Array.isArray(services) ||
        !services.every(
          service => typeof service === "string" && service.trim()
        ))
    ) {
      return res.status(400).json({
        success: false,
        message: "Services must be a list of non-empty strings."
      });
    }

    const ngo = await NGO.findOne({ user: req.user.id });

    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: "Your NGO record could not be found."
      });
    }

    if (availability !== undefined) {
      ngo.availability = availability;
    }

    if (services !== undefined) {
      ngo.supportedEmergencies = [
        ...new Set(services.map(service => service.trim()))
      ];
    }

    if (volunteersAvailable !== undefined) {
      ngo.capacity.volunteersAvailable = Number(volunteersAvailable);
    }

    if (vehiclesAvailable !== undefined) {
      ngo.capacity.vehiclesAvailable = Number(vehiclesAvailable);
    }

    if (medicine !== undefined) {
      ngo.inventory.medicine = Number(medicine);
    }

    if (foodPackets !== undefined) {
      ngo.inventory.foodPackets = Number(foodPackets);
    }

    if (waterUnits !== undefined) {
      ngo.inventory.waterUnits = Number(waterUnits);
    }

    await ngo.save();

    return res.status(200).json({
      success: true,
      message: "Capacity details saved successfully.",
      ngo: {
        id: ngo._id.toString(),
        availability: ngo.availability,
        services: ngo.supportedEmergencies,
        capacity: ngo.capacity,
        inventory: ngo.inventory
      }
    });
  } catch (error) {
    console.error("Update NGO capacity error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save capacity details."
    });
  }
};
