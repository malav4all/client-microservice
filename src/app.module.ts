import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://malav:4O61EhqGlLiTWD0@ingress.imztech.io:30018/admin?replicaSet=rs0&readPreference=secondaryPreferred&directConnection=true'
    ),
    ClientModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
