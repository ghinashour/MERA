import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private users: Repository<User>, private jwt: JwtService) {}
  async register(email: string, password: string) {
    if (await this.users.findOne({ where: { email } })) throw new BadRequestException('email taken');
    const u = await this.users.save(this.users.create({ email, passwordHash: await bcrypt.hash(password, 10) }));
    return { access_token: await this.jwt.signAsync({ sub: u.id, email }), user: { id: u.id, email } };
  }
  async login(email: string, password: string) {
    const u = await this.users.findOne({ where: { email } });
    if (!u || !(await bcrypt.compare(password, u.passwordHash))) throw new UnauthorizedException('invalid credentials');
    return { access_token: await this.jwt.signAsync({ sub: u.id, email }), user: { id: u.id, email } };
  }
}
