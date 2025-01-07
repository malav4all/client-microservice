import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Client extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ unique: true, sparse: true })
  apiKey: string;

  @Prop({ type: Date, default: null })
  apiKeyExpiresAt: Date;

  @Prop({ type: [String], default: [] })
  roles: string[];

  @Prop({ type: Object, default: {} })
  permissionMatrix: Record<string, any>;

  @Prop({ type: Object, default: {} })
  usageCounters: Record<string, any>;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
