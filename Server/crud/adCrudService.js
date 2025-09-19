import CrudService from './baseCrudService.js';
import Ad from '../models/Ad.js';

const adCrud = new CrudService(Ad);

export const createAd = (data) => adCrud.create(data);
export const getAdById = (id, projection, options) =>
  adCrud.findById(id, projection, options);
export const listAds = (filter, projection, options) =>
  adCrud.findMany(filter, projection, options);
export const updateAdById = (id, updates, options) =>
  adCrud.updateById(id, updates, options);
export const deleteAdById = (id) => adCrud.deleteById(id);

export default adCrud;
