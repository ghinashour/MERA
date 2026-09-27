import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriber, Post, Review, Message } from './content.entity';
import { ContentController } from './content.controller';
import { MailService } from '../mail/mail.service';

@Module({ imports: [TypeOrmModule.forFeature([Subscriber, Post, Review, Message])], controllers: [ContentController], providers: [MailService], exports: [MailService] })
export class ContentModule {}
