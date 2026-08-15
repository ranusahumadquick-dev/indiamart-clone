import User from "../models/User.js";
import Notification from "../models/Notification.js";
import sendEmail from "./sendEmail.js";

/**
 * Send requirement alerts to matching sellers
 * Called when a new buy requirement is created
 */
export const sendRequirementAlerts = async (requirement) => {
  try {
    // Find sellers with matching category alerts
    const sellers = await User.find({
      role: "seller",
      "requirementAlerts.enabled": true,
      "requirementAlerts.categories": {
        $in: [requirement.category, requirement.subCategory],
      },
      // Budget range check
      "requirementAlerts.minBudget": { $lte: requirement.budgetMax || Infinity },
      "requirementAlerts.maxBudget": { $gte: requirement.budgetMin || 0 },
    })
      .select("_id email name companyName notificationPreferences")
      .lean();

    // Optional: Filter by location if seller has preferred locations set
    const filteredSellers = sellers.filter((seller) => {
      if (
        seller.requirementAlerts?.preferredLocations &&
        seller.requirementAlerts.preferredLocations.length > 0
      ) {
        return seller.requirementAlerts.preferredLocations.some(
          (city) => city.toLowerCase() === requirement.deliveryLocation?.city?.toLowerCase()
        );
      }
      return true; // Include sellers with no location preference
    });

    // Create notifications for each matching seller
    const notificationPromises = filteredSellers.map(async (seller) => {
      // Create in-app notification
      await Notification.create({
        user: seller._id,
        type: "requirement_alert",
        title: `New ${requirement.category} requirement from buyer`,
        message: `A buyer is looking for ${requirement.productName} with budget ₹${requirement.budgetMin.toLocaleString()} - ₹${requirement.budgetMax.toLocaleString()}`,
        metadata: {
          requirementId: requirement._id,
          productName: requirement.productName,
          budgetMin: requirement.budgetMin,
          budgetMax: requirement.budgetMax,
          quantity: requirement.quantityRequired,
          city: requirement.deliveryLocation?.city,
        },
        relatedModel: "BuyRequirement",
        relatedId: requirement._id,
      });

      // Send email if seller has email notifications enabled
      if (seller.notificationPreferences?.channels?.email) {
        try {
          await sendEmail({
            to: seller.email,
            subject: `New Buyer Requirement: ${requirement.productName}`,
            template: "requirement-alert",
            context: {
              sellerName: seller.companyName || seller.name,
              productName: requirement.productName,
              category: requirement.category,
              budgetMin: requirement.budgetMin.toLocaleString(),
              budgetMax: requirement.budgetMax.toLocaleString(),
              quantity: requirement.quantityRequired,
              unit: requirement.unit,
              city: requirement.deliveryLocation?.city,
              state: requirement.deliveryLocation?.state,
              timeline: requirement.deliveryTimeline,
              requirementId: requirement._id,
            },
          });
        } catch (error) {
          console.error(`Failed to send email to seller ${seller._id}:`, error);
        }
      }
    });

    await Promise.allSettled(notificationPromises);
    return filteredSellers.length;
  } catch (error) {
    console.error("Error sending requirement alerts:", error);
    throw error;
  }
};

/**
 * Check if a seller matches a requirement
 */
export const sellerMatchesRequirement = (seller, requirement) => {
  // Check if alerts enabled
  if (!seller.requirementAlerts?.enabled) return false;

  // Check category match
  const categoryMatch =
    seller.requirementAlerts.categories?.includes(requirement.category) ||
    seller.requirementAlerts.categories?.includes(requirement.subCategory);
  if (!categoryMatch) return false;

  // Check budget match
  const budgetOk =
    seller.requirementAlerts.minBudget <= (requirement.budgetMax || Infinity) &&
    seller.requirementAlerts.maxBudget >= (requirement.budgetMin || 0);
  if (!budgetOk) return false;

  // Check location match
  if (
    seller.requirementAlerts.preferredLocations &&
    seller.requirementAlerts.preferredLocations.length > 0
  ) {
    return seller.requirementAlerts.preferredLocations.some(
      (city) =>
        city.toLowerCase() ===
        requirement.deliveryLocation?.city?.toLowerCase()
    );
  }

  return true;
};

export default { sendRequirementAlerts, sellerMatchesRequirement };
