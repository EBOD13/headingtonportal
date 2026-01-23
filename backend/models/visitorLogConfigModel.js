// backend/models/visitorLogConfigModel.js
const mongoose = require('mongoose');

const visitorLogConfigSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },
    spreadsheetId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisitorLogConfig', visitorLogConfigSchema);
