import mongoose from 'mongoose';

const portfolioContentSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'main', required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

export default mongoose.models.PortfolioContent
  || mongoose.model('PortfolioContent', portfolioContentSchema);
