import CrudService from './baseCrudService.js';
import Resident from '../models/resident.js';

const residentCrud = new CrudService(Resident);

export const createResident = (data) => residentCrud.create(data);
export const getResidentById = (id, projection, options) =>
  residentCrud.findById(id, projection, options);
export const listResidents = (filter, projection, options) =>
  residentCrud.findMany(filter, projection, options);
export const updateResidentById = (id, updates, options) =>
  residentCrud.updateById(id, updates, options);
export const countResidents = (filter = {}) => residentCrud.Model.countDocuments(filter);
