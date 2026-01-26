const mongoose = require('mongoose');

const reportFileSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    filePath: { type: String, required: true }, 
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    // e.g. visitation log date range
    periodStart: Date,
    periodEnd: Date,

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clerk'
    }
  },
  { timestamps: true }
);

reportFileSchema.index({ createdAt: -1 });

const ReportFile = mongoose.model('ReportFile', reportFileSchema);
module.exports = ReportFile;
