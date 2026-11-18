import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { Model, Types } from 'mongoose';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';
import { Trip, TripDocument } from './trip.schema.js';
import { BusModel, BusModelDocument } from '../bus/bus.schema.js';
import { Booking, BookingDocument } from '../booking/booking.schema.js';
import {
  TripScheduleChange,
  TripScheduleChangeDocument,
} from '../trip-schedule-change/trip-schedule-change.schema.js';

@Injectable()
export class TripService {
  constructor(
    @InjectModel(Trip.name)
    private readonly tripModel: Model<TripDocument>,
    @InjectModel(BusModel.name)
    private readonly busModel: Model<BusModelDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(TripScheduleChange.name)
    private readonly tripScheduleChangeModel: Model<TripScheduleChangeDocument>,
    @Optional()
    @InjectConnection()
    private readonly connection?: Connection,
  ) {}

  async validateTripInput(data: any, isUpdate = false) {
    const errors: string[] = [];
    const {
      source,
      destination,
      busModelId,
      price,
      tripDate,
      tripTime,
      scheduleType,
      status,
    } = data || {};

    if (!isUpdate || source !== undefined) {
      if (!source || typeof source !== 'string' || !source.trim()) {
        errors.push('Source is required and must be a non-empty string');
      }
    }

    if (!isUpdate || destination !== undefined) {
      if (!destination || typeof destination !== 'string' || !destination.trim()) {
        errors.push('Destination is required and must be a non-empty string');
      }
    }

    if (!isUpdate || busModelId !== undefined) {
      if (!busModelId || !Types.ObjectId.isValid(busModelId)) {
        errors.push('Valid busModelId is required');
      } else {
        const busModel = await this.busModel.findById(busModelId);
        if (!busModel) {
          errors.push('BusModel referenced does not exist');
        }
      }
    }

    if (!isUpdate || price !== undefined) {
      if (price === undefined || typeof price !== 'number' || price < 0 || Number.isNaN(price)) {
        errors.push('Price is required and must be a non-negative number');
      }
    }

    if (!isUpdate || tripDate !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!tripDate || typeof tripDate !== 'string' || !dateRegex.test(tripDate)) {
        errors.push('Trip date is required and must be in YYYY-MM-DD format');
      }
    }

    if (!isUpdate || tripTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3])(:[0-5][0-9])?$/;
      if (!tripTime || typeof tripTime !== 'string' || !timeRegex.test(tripTime)) {
        errors.push('Trip time is required and must be in valid HH or HH:mm format');
      }
    }

    if (scheduleType !== undefined) {
      if (!['manual', 'daily', 'weekly', 'monthly'].includes(scheduleType)) {
        errors.push('Invalid scheduleType. Must be manual, daily, weekly, or monthly');
      }
    }

    if (status !== undefined) {
      if (!['scheduled', 'active', 'completed'].includes(status)) {
        errors.push('Invalid status. Must be scheduled, active, or completed');
      }
    }

    return errors;
  }

  async getAllTrips(filters: any = {}) {
    const query: any = {};
    if (filters.source) {
      query.source = { $regex: new RegExp(filters.source, 'i') };
    }
    if (filters.destination) {
      query.destination = { $regex: new RegExp(filters.destination, 'i') };
    }
    if (filters.tripDate) {
      query.tripDate = filters.tripDate;
    }
    if (filters.busModelId) {
      query.busModelId = filters.busModelId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    return await this.tripModel.find(query).populate('busModelId').sort({ tripDate: 1, tripTime: 1 });
  }

  async findAll(filters: any = {}) {
    return this.getAllTrips(filters);
  }

  async getAvailableTrips(filters: any = {}) {
    const query: any = { status: { $in: ['scheduled', 'active'] } };
    if (filters.source) query.source = { $regex: new RegExp(filters.source, 'i') };
    if (filters.destination) query.destination = { $regex: new RegExp(filters.destination, 'i') };
    if (filters.tripDate) query.tripDate = filters.tripDate;
    if (filters.busModelId) query.busModelId = filters.busModelId;
    return await this.tripModel.find(query).populate('busModelId').sort({ tripDate: 1, tripTime: 1 });
  }

  async getTripById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      const err: any = new BadRequestException('Invalid trip ID');
      err.statusCode = 400;
      throw err;
    }
    const trip = await this.tripModel.findById(id).populate('busModelId').lean();
    if (!trip) {
      const err: any = new NotFoundException('Trip not found');
      err.statusCode = 404;
      throw err;
    }
    const tripBooking = await this.bookingModel.find({
      tripId: id,
      status: { $in: ['reserved', 'confirmed'] },
    }).lean();
    return { ...trip, tripBooking };
  }

  async findOne(id: string) {
    return this.getTripById(id);
  }

  async createTrip(data: CreateTripDto) {
    const errors = await this.validateTripInput(data, false);
    if (errors.length > 0) {
      const err: any = new BadRequestException({ message: 'Validation failed', errors });
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    const existing = await this.tripModel.findOne({
      source: data.source?.trim(),
      destination: data.destination?.trim(),
      tripDate: data.tripDate,
      tripTime: data.tripTime,
    });
    if (existing) {
      const err: any = new ConflictException(
        'A trip with the same source, destination, date, and time already exists.',
      );
      err.statusCode = 409;
      throw err;
    }

    const trip = new this.tripModel(data);
    await trip.save();
    return await this.tripModel.findById(trip._id).populate('busModelId');
  }

  async create(createTripDto: CreateTripDto) {
    return this.createTrip(createTripDto);
  }

  async updateTrip(id: string, data: UpdateTripDto, userId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      const err: any = new BadRequestException('Invalid trip ID');
      err.statusCode = 400;
      throw err;
    }

    const errors = await this.validateTripInput(data, true);
    if (errors.length > 0) {
      const err: any = new BadRequestException({ message: 'Validation failed', errors });
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }

    const trip = await this.tripModel.findById(id);
    if (!trip) {
      const err: any = new NotFoundException('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.price !== undefined && Number(data.price) !== trip.price) {
      const hasBooking = await this.bookingModel.exists({ tripId: id });
      if (hasBooking) {
        const err: any = new BadRequestException(
          'Cannot update price because bookings exist for this trip.',
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const isRescheduling =
      (data.tripDate && data.tripDate !== trip.tripDate) ||
      (data.tripTime && data.tripTime !== trip.tripTime);

    const oldTripDate = trip.tripDate;
    const oldTripTime = trip.tripTime;

    let transactionSucceeded = false;
    let session: any = null;

    try {
      if (this.connection && typeof this.connection.startSession === 'function') {
        session = await this.connection.startSession();
        session.startTransaction();

        Object.assign(trip, data);
        await trip.save({ session });

        if (isRescheduling) {
          const scheduleChange = new this.tripScheduleChangeModel({
            tripId: trip._id,
            changedBy: userId ? new Types.ObjectId(userId) : undefined,
            oldTripDate,
            oldTripTime,
            newTripDate: trip.tripDate,
            newTripTime: trip.tripTime,
          });
          await scheduleChange.save({ session });
        }

        await session.commitTransaction();
        session.endSession();
        transactionSucceeded = true;
      }
    } catch (txError: any) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (e) {}
        session.endSession();
      }

      const isNotReplicaSet =
        txError.message && txError.message.includes('replica set');
      if (!isNotReplicaSet && txError.statusCode) {
        throw txError;
      }
    }

    if (!transactionSucceeded) {
      const freshTrip = await this.tripModel.findById(id);
      if (freshTrip) {
        Object.assign(freshTrip, data);
        await freshTrip.save();

        if (isRescheduling) {
          const scheduleChange = new this.tripScheduleChangeModel({
            tripId: freshTrip._id,
            changedBy: userId ? new Types.ObjectId(userId) : undefined,
            oldTripDate,
            oldTripTime,
            newTripDate: freshTrip.tripDate,
            newTripTime: freshTrip.tripTime,
          });
          await scheduleChange.save();
        }
      }
    }

    return await this.tripModel.findById(id).populate('busModelId');
  }

  async update(id: string, updateTripDto: UpdateTripDto, userId?: string) {
    return this.updateTrip(id, updateTripDto, userId);
  }

  async deleteTrip(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      const err: any = new BadRequestException('Invalid trip ID');
      err.statusCode = 400;
      throw err;
    }

    const trip = await this.tripModel.findById(id);
    if (!trip) {
      const err: any = new NotFoundException('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    const hasBooking = await this.bookingModel.exists({ tripId: id });
    if (hasBooking) {
      const err: any = new BadRequestException(
        'Cannot delete trip because bookings are associated with it.',
      );
      err.statusCode = 400;
      throw err;
    }

    await this.tripModel.findByIdAndDelete(id);
    return { message: 'Trip deleted successfully' };
  }

  async remove(id: string) {
    return this.deleteTrip(id);
  }
}
