const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-default-key-please-change');
    req.user = decoded; // { userId, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized, invalid token' });
  }
};

module.exports = authMiddleware;
