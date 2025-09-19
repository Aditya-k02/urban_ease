import CrudService from './baseCrudService.js';
import Visitors from '../models/visitors.js';

const visitorsCrud = new CrudService(Visitors);

export const createVisitor = (data) => visitorsCrud.create(data);
export const getVisitorById = (id, projection, options) =>
  visitorsCrud.findById(id, projection, options);
export const listVisitors = (filter, projection, options) =>
  visitorsCrud.findMany(filter, projection, options);
export const updateVisitorById = (id, updates, options) =>
  visitorsCrud.updateById(id, updates, options);
export const deleteVisitorById = (id) => visitorsCrud.deleteById(id);

export default visitorsCrud;
