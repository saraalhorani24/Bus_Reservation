import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';
import { Booking, BookingDocument } from './booking.schema.js';
import { Trip, TripDocument } from '../trip/trip.schema.js';
import { BusModel, BusModelDocument } from '../bus/bus.schema.js';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Trip.name)
    private readonly tripModel: Model<TripDocument>,
    @InjectModel(BusModel.name)
    private readonly busModel: Model<BusModelDocument>,
  ) {}

  async reconcileTripBookedSeats(tripId: string | Types.ObjectId): Promise<number> {
    const activeBookings = await this.bookingModel.find({
      tripId,
      status: { $in: ['reserved', 'confirmed'] },
    });
    const totalBooked = activeBookings.reduce(
      (sum, b) => sum + (b.seatNumbers ? b.seatNumbers.length : 0),
      0,
    );
    await this.tripModel.findByIdAndUpdate(tripId, { bookedSeatsCount: totalBooked });
    return totalBooked;
  }

  async createBooking(
    customerId: string | Types.ObjectId,
    tripId: string | Types.ObjectId,
    seatNumbers: number[],
  ) {
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      throw new BadRequestException('At least one seat is required');
    }

    if (!Types.ObjectId.isValid(tripId.toString())) {
      throw new BadRequestException('Invalid trip ID');
    }

    const trip = await this.tripModel.findById(tripId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (!['scheduled', 'active'].includes(trip.status)) {
      throw new BadRequestException('This trip is not available for booking');
    }

    const busModel = await this.busModel.findById(trip.busModelId);
    if (!busModel) {
      throw new NotFoundException('Bus model not found');
    }

    const uniqueSeats = new Set(seatNumbers);
    if (
      seatNumbers.some(
        (seat) => !Number.isInteger(seat) || seat < 1 || seat > busModel.capacity,
      ) ||
      uniqueSeats.size !== seatNumbers.length
    ) {
      throw new BadRequestException('Invalid seat numbers');
    }

    // Check seat conflicts with active bookings
    const existingBookings = await this.bookingModel.find({
      tripId: new Types.ObjectId(tripId.toString()),
      status: { $in: ['reserved', 'confirmed'] },
    });

    const bookedSeats = existingBookings.flatMap((b) => b.seatNumbers || []);
    const isSeatBooked = seatNumbers.some((seat) => bookedSeats.includes(seat));
    if (isSeatBooked) {
      throw new BadRequestException('One or more seats are already booked');
    }

    // Atomically increment bookedSeatsCount with capacity check
    const updatedTrip = await this.tripModel.findOneAndUpdate(
      {
        _id: tripId,
        $expr: {
          $lte: [
            { $add: ['$bookedSeatsCount', seatNumbers.length] },
            busModel.capacity,
          ],
        },
      },
      { $inc: { bookedSeatsCount: seatNumbers.length } },
      { new: true },
    );

    if (!updatedTrip) {
      throw new BadRequestException('Not enough available seats or capacity exceeded');
    }

    try {
      const booking = await this.bookingModel.create({
        tripId: new Types.ObjectId(tripId.toString()),
        customerId: new Types.ObjectId(customerId.toString()),
        seatNumbers,
        status: 'reserved',
      });
      return booking;
    } catch (error) {
      // Rollback counter if creation fails
      await this.tripModel.findByIdAndUpdate(tripId, {
        $inc: { bookedSeatsCount: -seatNumbers.length },
      });
      throw error;
    }
  }

  async getAllBookings() {
    return await this.bookingModel
      .find()
      .populate('customerId', 'name phone username')
      .populate('tripId');
  }

  async getBookingById(bookingId: string) {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking ID');
    }
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('customerId', 'name phone username')
      .populate('tripId');

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getCustomerBookings(customerId: string | Types.ObjectId) {
    return await this.bookingModel
      .find({ customerId: new Types.ObjectId(customerId.toString()) })
      .populate('tripId');
  }

  async updateBooking(
    bookingId: string,
    customerId: string | Types.ObjectId,
    newSeatNumbers: number[],
  ) {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking ID');
    }

    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId.toString() !== customerId.toString()) {
      throw new ForbiddenException('You cannot update this booking');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Cancelled bookings cannot be updated');
    }

    if (!Array.isArray(newSeatNumbers) || newSeatNumbers.length === 0) {
      throw new BadRequestException('At least one seat is required');
    }

    const trip = await this.tripModel.findById(booking.tripId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const busModel = await this.busModel.findById(trip.busModelId);
    if (!busModel) {
      throw new NotFoundException('Bus model not found');
    }

    if (
      newSeatNumbers.some(
        (seat) => !Number.isInteger(seat) || seat < 1 || seat > busModel.capacity,
      ) ||
      new Set(newSeatNumbers).size !== newSeatNumbers.length
    ) {
      throw new BadRequestException('Invalid seat numbers');
    }

    const otherBookings = await this.bookingModel.find({
      tripId: booking.tripId,
      _id: { $ne: booking._id },
      status: { $in: ['reserved', 'confirmed'] },
    });

    const otherBookedSeats = otherBookings.flatMap((item) => item.seatNumbers || []);
    const hasConflict = newSeatNumbers.some((seat) => otherBookedSeats.includes(seat));
    if (hasConflict) {
      throw new BadRequestException('One or more seats are already booked');
    }

    const oldSeatCount = booking.seatNumbers.length;
    const newSeatCount = newSeatNumbers.length;
    const difference = newSeatCount - oldSeatCount;

    if (difference > 0) {
      const updatedTrip = await this.tripModel.findOneAndUpdate(
        {
          _id: booking.tripId,
          $expr: {
            $lte: [{ $add: ['$bookedSeatsCount', difference] }, busModel.capacity],
          },
        },
        { $inc: { bookedSeatsCount: difference } },
        { new: true },
      );

      if (!updatedTrip) {
        throw new BadRequestException('Not enough available seats');
      }
    } else if (difference < 0) {
      await this.tripModel.findByIdAndUpdate(booking.tripId, {
        $inc: { bookedSeatsCount: difference },
      });
    }

    booking.seatNumbers = newSeatNumbers;
    await booking.save();

    return booking;
  }

  async cancelBooking(
    bookingId: string,
    userId: string | Types.ObjectId,
    userRole = 'customer',
  ) {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking ID');
    }

    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userRole === 'customer' && booking.customerId.toString() !== userId.toString()) {
      throw new ForbiddenException('You cannot cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }

    const trip = await this.tripModel.findById(booking.tripId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const numberOfSeats = booking.seatNumbers.length;

    booking.status = 'cancelled';
    await booking.save();

    await this.tripModel.findByIdAndUpdate(booking.tripId, {
      $inc: { bookedSeatsCount: -numberOfSeats },
    });

    await this.tripModel.updateOne(
      { _id: booking.tripId, bookedSeatsCount: { $lt: 0 } },
      { $set: { bookedSeatsCount: 0 } },
    );

    return booking;
  }

  async confirmBooking(
    bookingId: string,
    userId: string | Types.ObjectId,
    userRole = 'customer',
  ) {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Invalid booking ID');
    }

    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userRole === 'customer' && booking.customerId.toString() !== userId.toString()) {
      throw new ForbiddenException('You cannot confirm this booking');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Cancelled bookings cannot be confirmed');
    }

    if (booking.status === 'confirmed') {
      return booking;
    }

    booking.status = 'confirmed';
    await booking.save();

    return booking;
  }

  // Generic methods
  async create(createBookingDto: CreateBookingDto & { customerId?: string }) {
    if (!createBookingDto.customerId) {
      throw new BadRequestException('Customer ID is required');
    }
    return this.createBooking(
      createBookingDto.customerId,
      createBookingDto.tripId,
      createBookingDto.seatNumbers,
    );
  }

  async findAll() {
    return this.getAllBookings();
  }

  async findOne(id: string) {
    return this.getBookingById(id);
  }

  async update(id: string, updateBookingDto: UpdateBookingDto & { customerId?: string }) {
    if (!updateBookingDto.customerId) {
      throw new BadRequestException('Customer ID is required');
    }
    return this.updateBooking(
      id,
      updateBookingDto.customerId,
      updateBookingDto.seatNumbers as number[],
    );
  }

  async remove(id: string, userId?: string, role?: string) {
    return this.cancelBooking(id, userId || '', role || 'admin');
  }
}
