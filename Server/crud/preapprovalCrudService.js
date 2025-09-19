import CrudService from './baseCrudService.js';
import Preapproval from '../models/preapproval.js';

const preapprovalCrud = new CrudService(Preapproval);

export const createPreapproval = (data) => preapprovalCrud.create(data);
export const getPreapprovalById = (id, projection, options) =>
  preapprovalCrud.findById(id, projection, options);
export const listPreapprovals = (filter, projection, options) =>
  preapprovalCrud.findMany(filter, projection, options);
export const updatePreapprovalById = (id, updates, options) =>
  preapprovalCrud.updateById(id, updates, options);
export const deletePreapprovalById = (id) => preapprovalCrud.deleteById(id);

export default preapprovalCrud;
