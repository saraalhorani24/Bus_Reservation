import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../auth/roles.js';

@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  private getCurrentUser(req: any) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('You must be logged in');
    }

    return {
      id: user.id || user._id,
      role: user.role,
    };
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    const user = this.getCurrentUser(req);

    return this.bookingService.createBooking(
      user.id,
      createBookingDto.tripId,
      createBookingDto.seatNumbers,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  findAll() {
    return this.bookingService.getAllBookings();
  }

  @Get('my-bookings')
  @Roles(UserRole.CUSTOMER)
  getMyBookings(@Req() req: any) {
    const user = this.getCurrentUser(req);

    return this.bookingService.getCustomerBookings(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  findOne(@Param('id') id: string) {
    return this.bookingService.getBookingById(id);
  }

  @Patch(':id')
  @Roles(UserRole.CUSTOMER)
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Req() req: any,
  ) {
    const user = this.getCurrentUser(req);

    return this.bookingService.updateBooking(
      id,
      user.id,
      updateBookingDto.seatNumbers,
    );
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER, UserRole.SECRETARY, UserRole.ADMIN)
  cancel(@Param('id') id: string, @Req() req: any) {
    const user = this.getCurrentUser(req);

    return this.bookingService.cancelBooking(id, user.id, user.role);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.CUSTOMER, UserRole.SECRETARY, UserRole.ADMIN)
  confirm(@Param('id') id: string, @Req() req: any) {
    const user = this.getCurrentUser(req);

    return this.bookingService.confirmBooking(id, user.id, user.role);
  }
}
