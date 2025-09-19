import CrudService from './baseCrudService.js';
import Payment from '../models/payment.js';

const paymentCrud = new CrudService(Payment);

export const createPayment = (data) => paymentCrud.create(data);
export const getPaymentById = (id, projection, options) =>
  paymentCrud.findById(id, projection, options);
export const listPayments = (filter, projection, options) =>
  paymentCrud.findMany(filter, projection, options);
export const updatePaymentById = (id, updates, options) =>
  paymentCrud.updateById(id, updates, options);
export const deletePaymentById = (id) => paymentCrud.deleteById(id);

export default paymentCrud;
