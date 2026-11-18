import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { UserRole } from '../auth/roles.js';

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
    enum: [UserRole.ADMIN, UserRole.SECRETARY, UserRole.CUSTOMER],
    default: UserRole.CUSTOMER,
    required: true,
  })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
