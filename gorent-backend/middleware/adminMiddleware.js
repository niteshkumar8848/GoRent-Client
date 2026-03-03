module.exports = function (req, res, next) {
  // Check if user exists (should be set by auth middleware)
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: "Unauthorized - No user found" 
    });
  }

  // Check if user has role property
  if (!req.user.role) {
    return res.status(403).json({ 
      success: false,
      message: "Forbidden - No role found" 
    });
  }

  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false,
      message: "Access denied. Admin only." 
    });
  }

  next();
};

