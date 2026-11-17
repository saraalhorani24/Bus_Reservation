import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TripDocument = HydratedDocument<Trip>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Trip {
  @Prop({
    type: String,
    required: [true, 'Source is required'],
    trim: true,
  })
  source: string;

  @Prop({
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
  })
  destination: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'BusModel',
    required: [true, 'BusModel reference is required'],
  })
  busModelId: Types.ObjectId;

  @Prop({
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  })
  price: number;

  @Prop({
    type: String,
    required: [true, 'Trip date is required'],
    trim: true,
  })
  tripDate: string;

  @Prop({
    type: String,
    required: [true, 'Trip time is required'],
    trim: true,
  })
  tripTime: string;

  @Prop({
    type: String,
    enum: {
      values: ['manual', 'daily', 'weekly', 'monthly'],
      message: '{VALUE} is not a valid schedule type',
    },
    default: 'manual',
  })
  scheduleType: string;

  @Prop({
    type: String,
    enum: {
      values: ['scheduled', 'active', 'completed'],
      message: '{VALUE} is not a valid status',
    },
    default: 'scheduled',
  })
  status: string;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Booked seats count cannot be negative'],
  })
  bookedSeatsCount: number;
}

export const TripSchema = SchemaFactory.createForClass(Trip);

TripSchema.virtual('availableSeats').get(function (this: any) {
  if (this.busModelId && typeof this.busModelId.capacity === 'number') {
    return Math.max(0, this.busModelId.capacity - (this.bookedSeatsCount || 0));
  }
  return undefined;
});
