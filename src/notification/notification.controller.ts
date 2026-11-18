import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';

import { NotificationService } from './notification.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ALL_USER_ROLES } from '../auth/roles.js';

@Controller('notification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ALL_USER_ROLES)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Get current user's notifications
  @Get('my-notifications')
  getMyNotifications(@Req() req: any) {
    const userId = req.user.id;

    return this.notificationService.getMyNotifications(userId);
  }

  // Mark notification as read
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;

    return this.notificationService.markNotificationAsRead(id, userId);
  }
}
