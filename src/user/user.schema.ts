import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true })
  phone: string;

  @Prop({ required: true, trim: true, unique: true })
  username: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({
    type: String,
    enum: ['admin', 'secretary', 'customer'],
    default: 'customer',
    required: true,
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
