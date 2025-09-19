import SubscriptionPlan from "../models/subscriptionPlan.js";

/**
 * Get all subscription plans (sorted by displayOrder)
 */
export const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find()
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans",
    });
  }
};

/**
 * Get a single subscription plan by ID
 */
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findById(id).lean();

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plan",
    });
  }
};

/**
 * Create a new subscription plan
 */
export const createPlan = async (req, res) => {
  try {
    const { planKey, name, price, duration, maxResidents, features, isActive, displayOrder } = req.body;

    // Validate required fields
    if (!planKey || !name || price === undefined || !duration) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: planKey, name, price, duration",
      });
    }

    // Check if planKey already exists
    const existingPlan = await SubscriptionPlan.findOne({ planKey: planKey.toLowerCase().trim() });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: `Plan with key '${planKey}' already exists`,
      });
    }

    const newPlan = new SubscriptionPlan({
      planKey: planKey.toLowerCase().trim(),
      name: name.trim(),
      price: Number(price),
      duration,
      maxResidents: maxResidents ? Number(maxResidents) : null,
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
    });

    await newPlan.save();

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: newPlan,
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create subscription plan",
    });
  }
};

/**
 * Update a subscription plan
 */
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planKey, name, price, duration, maxResidents, features, isActive, displayOrder } = req.body;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    // If planKey is being changed, check for duplicates
    if (planKey && planKey.toLowerCase().trim() !== plan.planKey) {
      const existingPlan = await SubscriptionPlan.findOne({ planKey: planKey.toLowerCase().trim() });
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: `Plan with key '${planKey}' already exists`,
        });
      }
      plan.planKey = planKey.toLowerCase().trim();
    }

    // Update fields
    if (name !== undefined) plan.name = name.trim();
    if (price !== undefined) plan.price = Number(price);
    if (duration !== undefined) plan.duration = duration;
    if (maxResidents !== undefined) plan.maxResidents = maxResidents ? Number(maxResidents) : null;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;
    if (displayOrder !== undefined) plan.displayOrder = Number(displayOrder);

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update subscription plan",
    });
  }
};

/**
 * Delete a subscription plan
 */
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subscription plan",
    });
  }
};

/**
 * Initialize default subscription plans (called on server startup)
 */
export const initializeDefaultPlans = async () => {
  try {
    const count = await SubscriptionPlan.countDocuments();
    
    // Only create defaults if no plans exist
    if (count === 0) {
      const defaultPlans = [
        {
          planKey: "basic",
          name: "Basic Plan",
          price: 999,
          duration: "monthly",
          maxResidents: 50,
          features: [
            "Up to 50 residents",
            "Basic community management",
            "Issue tracking",
            "Visitor management"
          ],
          isActive: true,
          displayOrder: 1,
        },
        {
          planKey: "standard",
          name: "Standard Plan",
          price: 1999,
          duration: "monthly",
          maxResidents: 150,
          features: [
            "Up to 150 residents",
            "Advanced management tools",
            "Issue tracking & automation",
            "Visitor & worker management",
            "Amenity booking"
          ],
          isActive: true,
          displayOrder: 2,
        },
        {
          planKey: "premium",
          name: "Premium Plan",
          price: 3999,
          duration: "monthly",
          maxResidents: null,
          features: [
            "Unlimited residents",
            "Full feature access",
            "Priority support",
            "Custom integrations",
            "Advanced analytics"
          ],
          isActive: true,
          displayOrder: 3,
        },
      ];

      await SubscriptionPlan.insertMany(defaultPlans);
      console.log("✅ Default subscription plans initialized");
    }
  } catch (error) {
    console.error("Error initializing default subscription plans:", error);
  }
};
