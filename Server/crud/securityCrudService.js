import CrudService from './baseCrudService.js';
import Security from '../models/security.js';

const securityCrud = new CrudService(Security);

export const createSecurity = (data) => securityCrud.create(data);
export const getSecurityById = (id, projection, options) =>
  securityCrud.findById(id, projection, options);
export const listSecurities = (filter, projection, options) =>
  securityCrud.findMany(filter, projection, options);
export const updateSecurityById = (id, updates, options) =>
  securityCrud.updateById(id, updates, options);
export const deleteSecurityById = (id) => securityCrud.deleteById(id);

export default securityCrud;
