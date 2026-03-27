import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: {
    full_name: string;
    email: string;
    password?: string;
    role: 'client' | 'attorney' | 'admin';
    phone?: string;
    speciality_ids?: string[];
  }) {
    if (dto.role === 'client') {
      // Clients have no password — identified by email only
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already registered');

      const user = await this.prisma.user.create({
        data: { full_name: dto.full_name, email: dto.email, phone: dto.phone },
      });

      const token = this.jwtService.sign({ sub: user.id, email: user.email, role: 'client' });
      return {
        access_token: token,
        user: { id: user.id, full_name: user.full_name, email: user.email, role: 'client' },
      };
    }

    // Attorney or Admin — requires password
    if (!dto.password) throw new BadRequestException('Password is required');

    const existing = await this.prisma.attorney.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const password_hash = await bcrypt.hash(dto.password, 10);

    const attorney = await this.prisma.attorney.create({
      data: {
        full_name: dto.full_name,
        email: dto.email,
        password_hash,
        role: dto.role,
        attorney_specialities: dto.speciality_ids?.length
          ? { create: dto.speciality_ids.map((speciality_id) => ({ speciality_id })) }
          : undefined,
      },
      include: { attorney_specialities: { include: { speciality: true } } },
    });

    const token = this.jwtService.sign({ sub: attorney.id, email: attorney.email, role: attorney.role });
    return {
      access_token: token,
      user: { id: attorney.id, full_name: attorney.full_name, email: attorney.email, role: attorney.role },
    };
  }

  async login(dto: { email: string; password?: string; role?: string }) {
    // Client login — email only, no password
    if (dto.role === 'client') {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (!user) throw new UnauthorizedException('Client not found');

      const token = this.jwtService.sign({ sub: user.id, email: user.email, role: 'client' });
      return {
        access_token: token,
        user: { id: user.id, full_name: user.full_name, email: user.email, role: 'client' },
      };
    }

    // Attorney / Admin — requires password
    const attorney = await this.prisma.attorney.findUnique({ where: { email: dto.email } });
    if (!attorney) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password ?? '', attorney.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: attorney.id, email: attorney.email, role: attorney.role });
    return {
      access_token: token,
      user: { id: attorney.id, full_name: attorney.full_name, email: attorney.email, role: attorney.role },
    };
  }
}
