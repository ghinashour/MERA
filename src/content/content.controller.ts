import { Controller, Get, Post as HttpPost, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber, Post, Review, Message } from './content.entity';
import { MailService } from '../mail/mail.service';

@Controller()
export class ContentController {
  constructor(
    @InjectRepository(Subscriber) private subs: Repository<Subscriber>,
    @InjectRepository(Post) private posts: Repository<Post>,
    @InjectRepository(Review) private reviews: Repository<Review>,
    @InjectRepository(Message) private msgs: Repository<Message>,
    private mail: MailService,
  ) {}
  @HttpPost('newsletter') async sub(@Body() b: { email: string }) {
    if (!b.email?.includes('@')) return { ok: false, error: 'invalid email' };
    try { await this.subs.save(this.subs.create({ email: b.email })); } catch {}
    // Honest result: mailed=true only when a real transport delivered it.
    try {
      const r = await this.mail.welcomeEmail(b.email);
      return { ok: true, mailed: r.sent, transport: r.transport };
    } catch (e: any) {
      return { ok: true, mailed: false, transport: this.mail.status().transport, error: String(e?.message || e) };
    }
  }
  @Get('newsletter/status') mailStatus() { return this.mail.status(); }
  @Get('posts') plist() { return this.posts.find({ order: { createdAt: 'DESC' } }); }
  @Get('posts/:slug') pone(@Param('slug') slug: string) { return this.posts.findOne({ where: { slug } }); }
  @HttpPost('admin/posts') pcreate(@Body() b: any) { return this.posts.save(this.posts.create(b)); }
  @Get('reviews') rlist(@Query('productId') pid?: string) { return this.reviews.find({ where: pid ? { productId: pid } : {}, order: { createdAt: 'DESC' } }); }
  @HttpPost('reviews') rcreate(@Body() b: any) { return this.reviews.save(this.reviews.create(b)); }
  @HttpPost('contact') contact(@Body() b: any) { return this.msgs.save(this.msgs.create(b)); }
  @Get('admin/messages') mlist() { return this.msgs.find({ order: { createdAt: 'DESC' } }); }
}
