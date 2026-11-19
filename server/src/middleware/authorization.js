function requireActiveUser(req, res, next) {
  if (!req.user?.isActive) return res.status(403).json({ message: "This account is inactive." });
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Administrator access required." });
  next();
}

function requireFeature(featureName) {
  return (req, res, next) => {
    if (req.user?.role === "admin") return next();
    const subscription = req.user?.subscription;
    const expired = subscription?.expiresAt && new Date(subscription.expiresAt) < new Date();
    if (expired || subscription?.status !== "active") return res.status(403).json({ message: "Your subscription has expired.", code: "SUBSCRIPTION_EXPIRED" });
    if (featureName && subscription.features?.[featureName] === false) return res.status(403).json({ message: "This feature is not included in your plan.", code: "FEATURE_NOT_INCLUDED" });
    next();
  };
}

module.exports = { requireActiveUser, requireAdmin, requireFeature };
