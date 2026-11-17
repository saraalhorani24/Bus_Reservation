import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TripScheduleChangeDocument = HydratedDocument<TripScheduleChange>;

@Schema({ timestamps: true })
export class TripScheduleChange {
  @Prop({
    type: Types.ObjectId,
    ref: 'Trip',
    required: true,
  })
  tripId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  changedBy: Types.ObjectId;

  @Prop({ type: String, required: false })
  oldTripDate: string;

  @Prop({ type: String, required: false })
  oldTripTime: string;

  @Prop({ type: String, required: false })
  newTripDate: string;

  @Prop({ type: String, required: false })
  newTripTime: string;
}

export const TripScheduleChangeSchema = SchemaFactory.createForClass(TripScheduleChange);
