import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface IDiscountRule {
  type: 'percentage' | 'fixed' | 'bxgy' | 'tiered';
  value: number;
  minQuantity?: number;
  freeQuantity?: number;
  tiers?: Array<{
    quantity: number;
    discount: number;
  }>;
}

export interface IBundle extends Document {
  shopId: string;
  name: string;
  description: string;
  products: IProduct[];
  discountRules: IDiscountRule[];
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  displaySettings: {
    showOnProduct: boolean;
    showOnCollection: boolean;
    showInCart: boolean;
    showOnBundlePage: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BundleSchema: Schema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  products: [{
    productId: { type: String, required: true },
    variantId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  discountRules: [{
    type: { type: String, required: true, enum: ['percentage', 'fixed', 'bxgy', 'tiered'] },
    value: { type: Number, required: true },
    minQuantity: { type: Number },
    freeQuantity: { type: Number },
    tiers: [{
      quantity: { type: Number },
      discount: { type: Number }
    }]
  }],
  isActive: { type: Boolean, default: true },
  validFrom: { type: Date },
  validTo: { type: Date },
  displaySettings: {
    showOnProduct: { type: Boolean, default: true },
    showOnCollection: { type: Boolean, default: true },
    showInCart: { type: Boolean, default: true },
    showOnBundlePage: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

export default mongoose.models.Bundle || mongoose.model<IBundle>('Bundle', BundleSchema); 