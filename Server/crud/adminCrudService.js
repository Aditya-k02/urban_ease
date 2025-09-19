import CrudService from './baseCrudService.js';
import Admin from '../models/admin.js';

const adminCrud = new CrudService(Admin);

export const createAdmin = (data) => adminCrud.create(data);
export const getAdminById = (id, projection, options) =>
  adminCrud.findById(id, projection, options);
export const listAdmins = (filter, projection, options) =>
  adminCrud.findMany(filter, projection, options);
export const updateAdminById = (id, updates, options) =>
  adminCrud.updateById(id, updates, options);
export const deleteAdminById = (id) => adminCrud.deleteById(id);

export default adminCrud;
