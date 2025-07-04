// api/index.js - Vercel serverless function entry point
const app = require('../app.js');

// Export handler for Vercel serverless
module.exports = (req, res) => {
  return app(req, res);
};