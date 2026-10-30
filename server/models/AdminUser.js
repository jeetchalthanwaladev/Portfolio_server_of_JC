import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false, collection: 'admins' });

export default mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);
