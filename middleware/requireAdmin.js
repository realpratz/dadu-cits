const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } 
  else {
    res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
};

module.exports = requireAdmin;