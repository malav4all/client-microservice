import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/userdb'),
    ClientModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
