import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true })
export class Booking {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  customerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Trip',
    required: true,
  })
  tripId: Types.ObjectId;

  @Prop({
    type: [Number],
    required: true,
  })
  seatNumbers: number[];

  @Prop({
    type: String,
    enum: ['reserved', 'confirmed', 'cancelled'],
    default: 'reserved',
    required: true,
  })
  status: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
