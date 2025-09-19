import CrudService from './baseCrudService.js';
import Notifications from '../models/Notifications.js';

const notificationsCrud = new CrudService(Notifications);

export const createNotification = (data) => notificationsCrud.create(data);
export const getNotificationById = (id, projection, options) =>
  notificationsCrud.findById(id, projection, options);
export const listNotifications = (filter, projection, options) =>
  notificationsCrud.findMany(filter, projection, options);
export const updateNotificationById = (id, updates, options) =>
  notificationsCrud.updateById(id, updates, options);
export const deleteNotificationById = (id) => notificationsCrud.deleteById(id);

export default notificationsCrud;
