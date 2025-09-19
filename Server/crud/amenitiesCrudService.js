import CrudService from './baseCrudService.js';
import Amenities from '../models/Amenities.js';

const amenitiesCrud = new CrudService(Amenities);

export const createAmenity = (data) => amenitiesCrud.create(data);
export const getAmenityById = (id, projection, options) =>
  amenitiesCrud.findById(id, projection, options);
export const listAmenities = (filter, projection, options) =>
  amenitiesCrud.findMany(filter, projection, options);
export const updateAmenityById = (id, updates, options) =>
  amenitiesCrud.updateById(id, updates, options);
export const deleteAmenityById = (id) => amenitiesCrud.deleteById(id);

export default amenitiesCrud;
