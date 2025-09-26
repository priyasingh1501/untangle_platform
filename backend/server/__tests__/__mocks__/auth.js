// Mock auth middleware for testing
const mockUserId = '507f1f77bcf86cd799439011';

const auth = (req, res, next) => {
  req.user = { id: mockUserId };
  next();
};

module.exports = auth;
