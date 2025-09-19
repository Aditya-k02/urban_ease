import CrudService from './baseCrudService.js';
import Workers from '../models/workers.js';

const workersCrud = new CrudService(Workers);

export const createWorker = (data) => workersCrud.create(data);
export const getWorkerById = (id, projection, options) =>
  workersCrud.findById(id, projection, options);
export const listWorkers = (filter, projection, options) =>
  workersCrud.findMany(filter, projection, options);
export const updateWorkerById = (id, updates, options) =>
  workersCrud.updateById(id, updates, options);
export const deleteWorkerById = (id) => workersCrud.deleteById(id);

export default workersCrud;
