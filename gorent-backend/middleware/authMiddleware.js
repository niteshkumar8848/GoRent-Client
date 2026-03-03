const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get JWT_SECRET dynamically (not at module load time)
  const JWT_SECRET = process.env.JWT_SECRET;
  
  // Get token from header
  const authHeader = req.header("Authorization");

  // Check if no token
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: "No token, authorization denied" 
    });
  }

  // Check if JWT_SECRET is configured
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured!");
    return res.status(500).json({
      success: false,
      message: "Server configuration error - JWT_SECRET not set"
    });
  }

  try {
    // Remove "Bearer " prefix if present
    const tokenString = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7, authHeader.length) 
      : authHeader;
    
    // Verify token
    const verified = jwt.verify(tokenString, JWT_SECRET);
    req.user = verified; // contains id + role
    next();
  } catch (err) {
    // Handle different JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: "Token is not valid" 
    });
  }
};

