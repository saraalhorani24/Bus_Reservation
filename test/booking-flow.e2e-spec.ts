import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { Connection } from 'mongoose';

describe('Bus Reservation Workflow (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let customerId: string;
  let busModelId: string;
  let tripId: string;
  let bookingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    connection = moduleFixture.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    if (connection) {
      await connection.dropDatabase();
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. Register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test Customer',
        username: 'testcust' + Date.now(),
        phone: '123' + Math.floor(Math.random() * 10000000),
        password: 'password123',
        role: 'customer',
      })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    customerId = res.body.user.id;
  });

  it('2. Complete end-to-end booking and cancellation workflow', async () => {
    // 1. Register User
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Workflow User',
        username: 'workflowuser' + Date.now(),
        phone: '988' + Math.floor(Math.random() * 10000000),
        password: 'password123',
        role: 'customer',
      })
      .expect(201);

    const userId = regRes.body.user.id;

    // 2. Create Bus Model
    const busRes = await request(app.getHttpServer())
      .post('/bus')
      .send({
        category: 'economy_class',
        size: 'large',
        capacity: 50,
        totalBusesCount: 5,
      })
      .expect(201);

    const bModelId = busRes.body._id;

    // 3. Create Trip
    const tripRes = await request(app.getHttpServer())
      .post('/trip')
      .send({
        busModelId: bModelId,
        source: 'City A',
        destination: 'City B',
        price: 50,
        tripDate: '2025-12-01',
        tripTime: '10:00',
        scheduleType: 'daily',
        status: 'scheduled',
      })
      .expect(201);

    const tId = tripRes.body._id;

    // 4. Verify Available Trips
    const availRes = await request(app.getHttpServer())
      .get('/trip/available')
      .expect(200);

    const foundTrip = availRes.body.find((t: any) => t._id === tId);
    expect(foundTrip).toBeDefined();
    expect(foundTrip.availableSeats).toBe(50);

    // 5. Create Booking (Seats 1 and 2)
    const bookingRes = await request(app.getHttpServer())
      .post('/booking')
      .send({
        tripId: tId,
        customerId: userId,
        seatNumbers: [1, 2],
      })
      .expect(201);

    const bId = bookingRes.body._id;
    expect(bookingRes.body.seatNumbers).toEqual([1, 2]);

    // 6. Prevent Double Booking for Seat 2
    await request(app.getHttpServer())
      .post('/booking')
      .send({
        tripId: tId,
        customerId: userId,
        seatNumbers: [2, 3],
      })
      .expect(400);

    // 7. Verify Trip Seat Count after booking
    const tripCheck1 = await request(app.getHttpServer())
      .get(`/trip/${tId}`)
      .expect(200);

    expect(tripCheck1.body.bookedSeatsCount).toBe(2);
    expect(tripCheck1.body.availableSeats).toBe(48);

    // 8. Cancel Booking
    await request(app.getHttpServer())
      .patch(`/booking/${bId}/cancel`)
      .send({
        userId,
        userRole: 'customer',
      })
      .expect(200);

    // 9. Verify Trip Seats Released
    const tripCheck2 = await request(app.getHttpServer())
      .get(`/trip/${tId}`)
      .expect(200);

    expect(tripCheck2.body.bookedSeatsCount).toBe(0);
    expect(tripCheck2.body.availableSeats).toBe(50);
  });
});
