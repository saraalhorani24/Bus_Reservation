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
  @Roles('customer')
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    const user = this.getCurrentUser(req);

    return this.bookingService.createBooking(
      user.id,
      createBookingDto.tripId,
      createBookingDto.seatNumbers,
    );
  }

  @Get()
  @Roles('admin', 'secretary')
  findAll() {
    return this.bookingService.getAllBookings();
  }

  @Get('my-bookings')
  @Roles('customer')
  getMyBookings(@Req() req: any) {
    const user = this.getCurrentUser(req);

    return this.bookingService.getCustomerBookings(user.id);
  }

  @Get(':id')
  @Roles('admin', 'secretary')
  findOne(@Param('id') id: string) {
    return this.bookingService.getBookingById(id);
  }

  @Patch(':id')
  @Roles('customer')
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
  @Roles('customer', 'secretary')
  cancel(@Param('id') id: string, @Req() req: any) {
    const user = this.getCurrentUser(req);

    return this.bookingService.cancelBooking(id, user.id, user.role);
  }

  @Patch(':id/confirm')
  @Roles('secretary')
  confirm(@Param('id') id: string, @Req() req: any) {
    const user = this.getCurrentUser(req);

    return this.bookingService.confirmBooking(id, user.id, user.role);
  }
}
