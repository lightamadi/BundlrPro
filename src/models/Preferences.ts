import mongoose, { Document } from 'mongoose';

export interface IPreferences extends Document {
  shopId: string;
  bundle_display_location: string;
  createdAt: Date;
  updatedAt: Date;
}

const PreferencesSchema = new mongoose.Schema({
  shopId: {
    type: String,
    required: true,
    unique: true,
  },
  bundle_display_location: {
    type: String,
    required: true,
    enum: ['product-form', 'product-description', 'product-sidebar'],
    default: 'product-form',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Preferences || mongoose.model<IPreferences>('Preferences', PreferencesSchema); 