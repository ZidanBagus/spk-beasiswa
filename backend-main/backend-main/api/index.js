// api/index.js - Vercel serverless function entry point
const app = require('../app.js');

// Export the Express app as a serverless function
module.exports = app;