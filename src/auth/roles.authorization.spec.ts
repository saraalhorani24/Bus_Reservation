import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from './roles.decorator.js';
import { ALL_USER_ROLES, UserRole } from './roles.js';
import { BookingController } from '../booking/booking.controller.js';
import { BusController } from '../bus/bus.controller.js';
import { NotificationController } from '../notification/notification.controller.js';
import { TripController } from '../trip/trip.controller.js';
import { TripScheduleChangeController } from '../trip-schedule-change/trip-schedule-change.controller.js';
import { UserController } from '../user/user.controller.js';

describe('Role authorization metadata', () => {
  const reflector = new Reflector();

  const rolesFor = (controller: Function, methodName: string): UserRole[] => {
    const handler = Object.getOwnPropertyDescriptor(
      controller.prototype,
      methodName,
    )?.value;

    if (!handler) {
      throw new Error(`Controller method ${methodName} was not found`);
    }

    return reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      handler,
      controller,
    ]);
  };

  it('matches the booking role rules from the Express API', () => {
    expect(rolesFor(BookingController, 'create')).toEqual([UserRole.CUSTOMER]);
    expect(rolesFor(BookingController, 'findAll')).toEqual([
      UserRole.ADMIN,
      UserRole.SECRETARY,
    ]);
    expect(rolesFor(BookingController, 'getMyBookings')).toEqual([
      UserRole.CUSTOMER,
    ]);
    expect(rolesFor(BookingController, 'update')).toEqual([UserRole.CUSTOMER]);
    expect(rolesFor(BookingController, 'cancel')).toEqual([
      UserRole.CUSTOMER,
      UserRole.SECRETARY,
      UserRole.ADMIN,
    ]);
    expect(rolesFor(BookingController, 'confirm')).toEqual([
      UserRole.CUSTOMER,
      UserRole.SECRETARY,
      UserRole.ADMIN,
    ]);
  });

  it('allows admins and secretaries to manage users', () => {
    expect(rolesFor(UserController, 'findAll')).toEqual([
      UserRole.ADMIN,
      UserRole.SECRETARY,
    ]);
  });

  it('requires an admin to change trips and bus models', () => {
    expect(rolesFor(TripController, 'create')).toEqual([UserRole.ADMIN]);
    expect(rolesFor(TripController, 'update')).toEqual([UserRole.ADMIN]);
    expect(rolesFor(TripController, 'remove')).toEqual([UserRole.ADMIN]);
    expect(rolesFor(BusController, 'create')).toEqual([UserRole.ADMIN]);
    expect(rolesFor(BusController, 'update')).toEqual([UserRole.ADMIN]);
  });

  it('allows every known user role to read shared resources', () => {
    expect(rolesFor(TripController, 'findAll')).toEqual(ALL_USER_ROLES);
    expect(rolesFor(BusController, 'findAll')).toEqual(ALL_USER_ROLES);
    expect(rolesFor(NotificationController, 'getMyNotifications')).toEqual(
      ALL_USER_ROLES,
    );
    expect(rolesFor(TripScheduleChangeController, 'findAll')).toEqual(
      ALL_USER_ROLES,
    );
  });
});
