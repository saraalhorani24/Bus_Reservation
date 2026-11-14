import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

import { User, UserDocument } from '../user/user.schema.js';

import { RegisterDto } from './dto/register.dto.js';
import { loginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    private jwtService: JwtService,
  ) {}
  async register(registerDto: RegisterDto) {
    const { name, phone, username, password } = registerDto;

    const existingUser = await this.userModel.findOne({
      $or: [{ phone }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('Phone or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.userModel.create({
      name,
      phone,
      username,
      password: hashedPassword,
    });

    const token = await this.jwtService.signAsync({
      sub: newUser._id.toString(),
      role: newUser.role,
    });

    return {
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role,
      },
    };
  }
  async login(loginDto: loginDto) {
    const { username, password } = loginDto;

    const user = await this.userModel.findOne({ username }).select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const token = await this.jwtService.signAsync({
      sub: user._id.toString(),
      role: user.role,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    };
  }
}
