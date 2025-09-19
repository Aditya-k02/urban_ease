import CrudService from './baseCrudService.js';
import CommonSpaces from '../models/commonSpaces.js';

const commonSpacesCrud = new CrudService(CommonSpaces);

export const createCommonSpace = (data) => commonSpacesCrud.create(data);
export const getCommonSpaceById = (id, projection, options) =>
  commonSpacesCrud.findById(id, projection, options);
export const listCommonSpaces = (filter, projection, options) =>
  commonSpacesCrud.findMany(filter, projection, options);
export const updateCommonSpaceById = (id, updates, options) =>
  commonSpacesCrud.updateById(id, updates, options);
export const deleteCommonSpaceById = (id) => commonSpacesCrud.deleteById(id);

export default commonSpacesCrud;
