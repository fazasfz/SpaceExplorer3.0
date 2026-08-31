const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract Bearer <token>
  
  if (!token) {
    return res.status(401).json({ message: 'No authorization token, access denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attaches id and role to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid active token token structure.' });
  }
};