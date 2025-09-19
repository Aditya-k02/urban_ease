import CrudService from './baseCrudService.js';
import InterestForm from '../models/interestForm.js';

const interestFormCrud = new CrudService(InterestForm);

export const createInterestForm = (data) => interestFormCrud.create(data);
export const getInterestFormById = (id, projection, options) =>
  interestFormCrud.findById(id, projection, options);
export const listInterestForms = (filter, projection, options) =>
  interestFormCrud.findMany(filter, projection, options);
export const updateInterestFormById = (id, updates, options) =>
  interestFormCrud.updateById(id, updates, options);
export const deleteInterestFormById = (id) => interestFormCrud.deleteById(id);

export default interestFormCrud;
