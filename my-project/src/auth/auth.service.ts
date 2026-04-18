import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(body: { fullName: string; email?: string; phone?: string; password: string }) {
    const passwordHash = await bcrypt.hash(body.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          fullName: body.fullName,
          email: body.email || null,
          phone: body.phone || null,
          passwordHash,
          role: 'BUYER',
        } as any,
      });

      return { userId: user.id.toString() };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const target = Array.isArray(e?.meta?.target) ? e.meta.target.join(', ') : 'email/phone';
        throw new BadRequestException(`${target} already exists`);
      }
      throw new BadRequestException(e?.message || 'Registration failed');
    }
  }

  async me(payload: any) {
    const sub = payload?.sub;
    if (!sub) throw new BadRequestException("Invalid token payload (missing sub)");

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(sub) as any },
      select: { id: true, fullName: true, email: true, phone: true, role: true, createdAt: true },
    });

    if (!user) throw new BadRequestException("User not found");

    return {
      id: user.id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }



  async login(body: { emailOrPhone: string; password: string }) {
    const input = (body.emailOrPhone ?? '').trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.toLowerCase() }, { phone: input }],
      },
    });

    if (!user) throw new BadRequestException('Invalid credentials');

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new BadRequestException('Invalid credentials');

    const token = await this.jwt.signAsync({
      sub: user.id.toString(),
      role: user.role,
      fullName: user.fullName,
    });

    return {
      accessToken: token,
      user: { id: user.id.toString(), role: user.role, fullName: user.fullName },
    };
  }
}
