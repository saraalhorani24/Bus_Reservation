import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user/user.schema.js';
import { BusModel } from './bus/bus.schema.js';
import { Trip } from './trip/trip.schema.js';
import { Booking } from './booking/booking.schema.js';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userModel = app.get(getModelToken(User.name));
  const busModel = app.get(getModelToken(BusModel.name));
  const tripModel = app.get(getModelToken(Trip.name));
  const bookingModel = app.get(getModelToken(Booking.name));

  console.log('Seeding database with rich sample data...');

  // 1. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await userModel.findOneAndUpdate(
    { username: 'admin' },
    { name: 'System Admin', username: 'admin', phone: '0911111111', password: hashedPassword, role: 'admin' },
    { upsert: true, new: true }
  );

  await userModel.findOneAndUpdate(
    { username: 'secretary' },
    { name: 'Transit Secretary', username: 'secretary', phone: '0922222222', password: hashedPassword, role: 'secretary' },
    { upsert: true, new: true }
  );

  const customer = await userModel.findOneAndUpdate(
    { username: 'john_customer' },
    { name: 'John Passenger', username: 'john_customer', phone: '0933333333', password: hashedPassword, role: 'customer' },
    { upsert: true, new: true }
  );

  // 2. Create Bus Models
  const bus1 = await busModel.findOneAndUpdate(
    { category: 'economy_class', size: 'large' },
    { category: 'economy_class', size: 'large', title: 'Economy Class (Large)', capacity: 50, totalBusesCount: 8, layoutDetails: { rows: 10, seatsPerRow: 5 } },
    { upsert: true, new: true }
  );

  const bus2 = await busModel.findOneAndUpdate(
    { category: 'business_class', size: 'large' },
    { category: 'business_class', size: 'large', title: 'Business Class (Large)', capacity: 40, totalBusesCount: 6, layoutDetails: { rows: 10, seatsPerRow: 4 } },
    { upsert: true, new: true }
  );

  const bus3 = await busModel.findOneAndUpdate(
    { category: 'first_class', size: 'large' },
    { category: 'first_class', size: 'large', title: 'First Class (Large)', capacity: 30, totalBusesCount: 4, layoutDetails: { rows: 10, seatsPerRow: 3 } },
    { upsert: true, new: true }
  );

  // 3. Create Trips
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  const tripsData = [
    { busModelId: bus1._id, source: 'Capital City', destination: 'Coastal Resort', price: 45, tripDate: tomorrow, tripTime: '08:00', scheduleType: 'daily', status: 'scheduled', bookedSeatsCount: 2 },
    { busModelId: bus2._id, source: 'Metropolis', destination: 'Mountain Valley', price: 65, tripDate: tomorrow, tripTime: '10:30', scheduleType: 'daily', status: 'scheduled', bookedSeatsCount: 0 },
    { busModelId: bus3._id, source: 'North Station', destination: 'South Harbor', price: 95, tripDate: dayAfter, tripTime: '14:00', scheduleType: 'weekly', status: 'scheduled', bookedSeatsCount: 0 },
    { busModelId: bus1._id, source: 'City A', destination: 'City B', price: 35, tripDate: today, tripTime: '16:00', scheduleType: 'daily', status: 'active', bookedSeatsCount: 0 },
    { busModelId: bus2._id, source: 'East Terminal', destination: 'West Gateway', price: 55, tripDate: dayAfter, tripTime: '09:00', scheduleType: 'daily', status: 'scheduled', bookedSeatsCount: 0 },
  ];

  const createdTrips = [];
  for (const t of tripsData) {
    let trip = await tripModel.findOne({ source: t.source, destination: t.destination, tripDate: t.tripDate, tripTime: t.tripTime });
    if (!trip) {
      trip = await tripModel.create(t);
    } else {
      trip.busModelId = t.busModelId;
      trip.price = t.price;
      trip.bookedSeatsCount = t.bookedSeatsCount;
      await trip.save();
    }
    createdTrips.push(trip);
  }

  // 4. Create Sample Booking
  await bookingModel.deleteMany({ customerId: customer._id });
  await bookingModel.create({
    tripId: createdTrips[0]._id,
    customerId: customer._id,
    seatNumbers: [1, 2],
    status: 'reserved'
  });

  console.log('Database successfully seeded with rich sample data!');
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
