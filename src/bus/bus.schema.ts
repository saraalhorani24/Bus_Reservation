import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BusModelDocument = HydratedDocument<BusModel>;

@Schema({ timestamps: true })
export class BusModel {
  @Prop({ type: String, required: false, trim: true })
  title: string;

  @Prop({
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['first_class', 'business_class', 'economy_class'],
      message: 'Category must be one of: first_class, business_class, economy_class',
    },
    trim: true,
  })
  category: string;

  @Prop({
    type: String,
    required: [true, 'Size is required'],
    enum: {
      values: ['large', 'medium'],
      message: 'Size must be one of: large, medium',
    },
    trim: true,
  })
  size: string;

  @Prop({
    type: Number,
    required: [true, 'Capacity is required'],
  })
  capacity: number;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Total buses count cannot be negative'],
  })
  totalBusesCount: number;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: [true, 'Layout details are required'],
  })
  layoutDetails: any;
}

export const BusModelSchema = SchemaFactory.createForClass(BusModel);

// Prevent duplicate models for the same category and size
BusModelSchema.index({ category: 1, size: 1 }, { unique: true });

// Auto-generate title if not explicitly provided
BusModelSchema.pre('validate', function (next: any) {
  if (!this.title && this.category && this.size) {
    const format = (str: string) =>
      str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    this.title = `${format(this.category)} (${format(this.size)})`;
  }
  if (typeof next === 'function') {
    next();
  }
});

export type BusDocument = BusModelDocument;
export const Bus = BusModel;
export const BusSchema = BusModelSchema;
