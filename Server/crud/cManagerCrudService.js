import CrudService from './baseCrudService.js';
import CommunityManager from '../models/cManager.js';

const cManagerCrud = new CrudService(CommunityManager);

export const createCommunityManager = (data) => cManagerCrud.create(data);
export const getCommunityManagerById = (id, projection, options) =>
  cManagerCrud.findById(id, projection, options);
export const listCommunityManagers = (filter, projection, options) =>
  cManagerCrud.findMany(filter, projection, options);
export const updateCommunityManagerById = (id, updates, options) =>
  cManagerCrud.updateById(id, updates, options);
export const deleteCommunityManagerById = (id) => cManagerCrud.deleteById(id);

export default cManagerCrud;
