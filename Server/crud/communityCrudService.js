// Community-specific CRUD service built on top of the generic CrudService

import CrudService from './baseCrudService.js';
import Community from '../models/communities.js';
import { deleteCommunityCascade } from "../utils/communityCascadeDelete.js";

const communityCrud = new CrudService(Community);

// Re-export with model-specific names for clarity
export const createCommunity = (data) => communityCrud.create(data);
export const getCommunityById = (id, projection, options) =>
  communityCrud.findById(id, projection, options);
export const listCommunities = (filter, projection, options) =>
  communityCrud.findMany(filter, projection, options);
export const updateCommunityById = (id, updates, options) =>
  communityCrud.updateById(id, updates, options);
export const deleteCommunityById = async (id) => {
  const exists = await communityCrud.findById(id);
  if (!exists) return null;
  return deleteCommunityCascade(id);
};
export const aggregateCommunities = (pipeline) => communityCrud.Model.aggregate(pipeline);
export const countCommunities = (filter = {}) => communityCrud.Model.countDocuments(filter);
export const updateManyCommunities = (filter, updates, options) => communityCrud.updateMany(filter, updates, options);
// used for code generation 
export const getCommunityByIdWithFreshCode = async (id, projection, options) => {
  const community = await communityCrud.findById(id, projection, options);

  if (!community) return null;
  // 🔑 Domain logic injected here
  await community.rotateCodeIfExpired();
  return community;
};


export default communityCrud;
