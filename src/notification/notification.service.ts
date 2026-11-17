import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Notification, NotificationDocument } from './notification.schema.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // Create a notification
  async createNotification(
    userId: string,
    relatedTripId: string,
    title: string,
    message: string,
  ) {
    const notification = await this.notificationModel.create({
      userId,
      relatedTripId,
      title,
      message,
    });

    return notification;
  }

  // Get current user's notifications
  async getMyNotifications(userId: string) {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 });
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }
}
