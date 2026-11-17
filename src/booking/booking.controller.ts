import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Body('customerId') customerId?: string, @Req() req?: any) {
    const custId = customerId || req?.user?._id || req?.user?.id;
    return this.bookingService.createBooking(
      custId,
      createBookingDto.tripId,
      createBookingDto.seatNumbers,
    );
  }

  @Get()
  findAll() {
    return this.bookingService.getAllBookings();
  }

  @Get('my-bookings')
  getMyBookings(@Req() req: any, @Body('customerId') customerId?: string) {
    const custId = customerId || req?.user?._id || req?.user?.id;
    return this.bookingService.getCustomerBookings(custId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.getBookingById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Body('customerId') customerId?: string,
    @Req() req?: any,
  ) {
    const custId = customerId || req?.user?._id || req?.user?.id;
    return this.bookingService.updateBooking(id, custId, updateBookingDto.seatNumbers);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('userId') userId?: string,
    @Body('userRole') userRole?: string,
    @Req() req?: any,
  ) {
    const uid = userId || req?.user?._id || req?.user?.id;
    const role = userRole || req?.user?.role || 'customer';
    return this.bookingService.cancelBooking(id, uid, role);
  }

  @Patch(':id/confirm')
  confirm(
    @Param('id') id: string,
    @Body('userId') userId?: string,
    @Body('userRole') userRole?: string,
    @Req() req?: any,
  ) {
    const uid = userId || req?.user?._id || req?.user?.id;
    const role = userRole || req?.user?.role || 'customer';
    return this.bookingService.confirmBooking(id, uid, role);
  }
}
