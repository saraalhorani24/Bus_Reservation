import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';

import { Booking, BookingDocument } from './booking.schema.js';
import { Trip, TripDocument } from '../trip/trip.schema.js';
import { BusModel, BusModelDocument } from '../bus/bus.schema.js';
import { UserRole } from '../auth/roles.js';

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

  // Check whether an ID is a valid MongoDB ObjectId
  private validateObjectId(id: string | Types.ObjectId, fieldName: string) {
    if (!Types.ObjectId.isValid(id.toString())) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }
  }

  // Get the trip departure date and time
  private getDepartureDate(trip: TripDocument): Date {
    const time =
      trip.tripTime.length === 5 ? `${trip.tripTime}:00` : trip.tripTime;

    const departureDate = new Date(`${trip.tripDate}T${time}`);

    if (Number.isNaN(departureDate.getTime())) {
      throw new BadRequestException('Invalid trip date or time');
    }

    return departureDate;
  }

  // Recalculate bookedSeatsCount from active bookings
  async reconcileTripBookedSeats(
    tripId: string | Types.ObjectId,
  ): Promise<number> {
    this.validateObjectId(tripId, 'trip ID');

    const activeBookings = await this.bookingModel.find({
      tripId: new Types.ObjectId(tripId.toString()),
      status: { $in: ['reserved', 'confirmed'] },
    });

    const totalBooked = activeBookings.reduce(
      (sum, booking) => sum + booking.seatNumbers.length,
      0,
    );

    await this.tripModel.findByIdAndUpdate(tripId, {
      bookedSeatsCount: totalBooked,
    });

    return totalBooked;
  }

  // Create a new booking
  async createBooking(
    customerId: string | Types.ObjectId,
    tripId: string | Types.ObjectId,
    seatNumbers: number[],
  ) {
    this.validateObjectId(customerId, 'customer ID');
    this.validateObjectId(tripId, 'trip ID');

    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      throw new BadRequestException('At least one seat is required');
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
        (seat) =>
          !Number.isInteger(seat) || seat < 1 || seat > busModel.capacity,
      ) ||
      uniqueSeats.size !== seatNumbers.length
    ) {
      throw new BadRequestException('Invalid seat numbers');
    }

    // Find existing active bookings for this trip
    const existingBookings = await this.bookingModel.find({
      tripId: trip._id,
      status: { $in: ['reserved', 'confirmed'] },
    });

    const bookedSeats = existingBookings.flatMap(
      (booking) => booking.seatNumbers,
    );

    const hasConflict = seatNumbers.some((seat) => bookedSeats.includes(seat));

    if (hasConflict) {
      throw new ConflictException('One or more seats are already booked');
    }

    // Increment the trip counter only if capacity is not exceeded
    const updatedTrip = await this.tripModel.findOneAndUpdate(
      {
        _id: tripId,
        status: { $in: ['scheduled', 'active'] },
        $expr: {
          $lte: [
            { $add: ['$bookedSeatsCount', seatNumbers.length] },
            busModel.capacity,
          ],
        },
      },
      {
        $inc: { bookedSeatsCount: seatNumbers.length },
      },
      { new: true },
    );

    if (!updatedTrip) {
      throw new BadRequestException(
        'Not enough available seats or capacity exceeded',
      );
    }

    try {
      return await this.bookingModel.create({
        tripId: new Types.ObjectId(tripId.toString()),
        customerId: new Types.ObjectId(customerId.toString()),
        seatNumbers,
        status: 'reserved',
      });
    } catch (error) {
      // Roll back the counter if booking creation fails
      await this.tripModel.findByIdAndUpdate(tripId, {
        $inc: { bookedSeatsCount: -seatNumbers.length },
      });

      throw error;
    }
  }

  // Get all bookings
  async getAllBookings() {
    return this.bookingModel
      .find()
      .populate('customerId', 'name phone username')
      .populate({
        path: 'tripId',
        populate: { path: 'busModelId' },
      });
  }

  // Get one booking by ID
  async getBookingById(bookingId: string) {
    this.validateObjectId(bookingId, 'booking ID');

    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('customerId', 'name phone username')
      .populate({
        path: 'tripId',
        populate: { path: 'busModelId' },
      });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  // Get bookings belonging to one customer
  async getCustomerBookings(customerId: string | Types.ObjectId) {
    this.validateObjectId(customerId, 'customer ID');

    return this.bookingModel
      .find({
        customerId: new Types.ObjectId(customerId.toString()),
      })
      .populate({
        path: 'tripId',
        populate: { path: 'busModelId' },
      });
  }

  // Update the seats of a reserved booking
  async updateBooking(
    bookingId: string,
    customerId: string | Types.ObjectId,
    newSeatNumbers: number[],
  ) {
    this.validateObjectId(bookingId, 'booking ID');
    this.validateObjectId(customerId, 'customer ID');

    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId.toString() !== customerId.toString()) {
      throw new ForbiddenException('You cannot update this booking');
    }

    // Only reserved bookings can be updated
    if (booking.status !== 'reserved') {
      throw new BadRequestException('Only reserved bookings can be updated');
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
        (seat) =>
          !Number.isInteger(seat) || seat < 1 || seat > busModel.capacity,
      ) ||
      new Set(newSeatNumbers).size !== newSeatNumbers.length
    ) {
      throw new BadRequestException('Invalid seat numbers');
    }

    // Exclude the current booking when checking seat conflicts
    const otherBookings = await this.bookingModel.find({
      tripId: booking.tripId,
      _id: { $ne: booking._id },
      status: { $in: ['reserved', 'confirmed'] },
    });

    const otherBookedSeats = otherBookings.flatMap((item) => item.seatNumbers);

    const hasConflict = newSeatNumbers.some((seat) =>
      otherBookedSeats.includes(seat),
    );

    if (hasConflict) {
      throw new ConflictException('One or more seats are already booked');
    }

    const oldSeatCount = booking.seatNumbers.length;
    const newSeatCount = newSeatNumbers.length;
    const difference = newSeatCount - oldSeatCount;

    // Update the trip counter if the number of seats changes
    if (difference > 0) {
      const updatedTrip = await this.tripModel.findOneAndUpdate(
        {
          _id: booking.tripId,
          $expr: {
            $lte: [
              { $add: ['$bookedSeatsCount', difference] },
              busModel.capacity,
            ],
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

    try {
      booking.seatNumbers = newSeatNumbers;
      await booking.save();

      return booking;
    } catch (error) {
      // Restore the counter if saving the booking fails
      if (difference !== 0) {
        await this.tripModel.findByIdAndUpdate(booking.tripId, {
          $inc: { bookedSeatsCount: -difference },
        });
      }

      throw error;
    }
  }

  // Cancel a booking
  async cancelBooking(
    bookingId: string,
    userId: string | Types.ObjectId,
    userRole: string,
  ) {
    this.validateObjectId(bookingId, 'booking ID');
    this.validateObjectId(userId, 'user ID');

    if (
      ![UserRole.CUSTOMER, UserRole.SECRETARY, UserRole.ADMIN].includes(
        userRole as UserRole,
      )
    ) {
      throw new ForbiddenException('You are not allowed to cancel bookings');
    }

    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (userRole === UserRole.CUSTOMER) {
      if (booking.customerId.toString() !== userId.toString()) {
        throw new ForbiddenException('You cannot cancel this booking');
      }

      if (booking.status !== 'reserved') {
        throw new BadRequestException(
          'Only reserved bookings can be cancelled by customers',
        );
      }
    }

    if (userRole === UserRole.SECRETARY && booking.status !== 'reserved') {
      throw new BadRequestException(
        'Secretary can only cancel reserved bookings',
      );
    }

    const trip = await this.tripModel.findById(booking.tripId);

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Secretary cancellation is allowed only during the last 30 minutes
    // before departure. Reschedule-refusal exception will be added
    // when BookingFollowUp is implemented.
    if (userRole === UserRole.SECRETARY) {
      const departureDate = this.getDepartureDate(trip);
      const minutesUntilDeparture =
        (departureDate.getTime() - Date.now()) / (1000 * 60);

      if (minutesUntilDeparture < 0 || minutesUntilDeparture > 30) {
        throw new BadRequestException(
          'Secretary can cancel a booking only within 30 minutes before departure',
        );
      }
    }

    const numberOfSeats = booking.seatNumbers.length;

    // Decrease the trip counter without allowing it to become negative
    const updatedTrip = await this.tripModel.findOneAndUpdate(
      {
        _id: booking.tripId,
        bookedSeatsCount: { $gte: numberOfSeats },
      },
      {
        $inc: { bookedSeatsCount: -numberOfSeats },
      },
      { new: true },
    );

    if (!updatedTrip) {
      throw new BadRequestException(
        'Could not update booked seats count. Please reconcile the trip counter.',
      );
    }

    try {
      booking.status = 'cancelled';
      await booking.save();

      return booking;
    } catch (error) {
      // Restore the counter if saving the cancellation fails
      await this.tripModel.findByIdAndUpdate(booking.tripId, {
        $inc: { bookedSeatsCount: numberOfSeats },
      });

      throw error;
    }
  }

  // Confirm a booking - customer (own booking), secretary, or admin
  async confirmBooking(
    bookingId: string,
    userId: string | Types.ObjectId,
    userRole: string,
  ) {
    this.validateObjectId(bookingId, 'booking ID');
    this.validateObjectId(userId, 'user ID');

    if (
      ![UserRole.CUSTOMER, UserRole.SECRETARY, UserRole.ADMIN].includes(
        userRole as UserRole,
      )
    ) {
      throw new ForbiddenException('You are not allowed to confirm bookings');
    }

    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (
      userRole === UserRole.CUSTOMER &&
      booking.customerId.toString() !== userId.toString()
    ) {
      throw new ForbiddenException('You cannot confirm this booking');
    }

    if (booking.status === 'confirmed') {
      return booking;
    }

    if (booking.status !== 'reserved') {
      throw new BadRequestException('Only reserved bookings can be confirmed');
    }

    booking.status = 'confirmed';
    await booking.save();

    return booking;
  }

  // Generic methods used by the generated NestJS controller

  async create(createBookingDto: CreateBookingDto, customerId: string) {
    return this.createBooking(
      customerId,
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

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    customerId: string,
  ) {
    return this.updateBooking(id, customerId, updateBookingDto.seatNumbers);
  }

  async remove(id: string, userId: string, userRole: string) {
    return this.cancelBooking(id, userId, userRole);
  }
}
