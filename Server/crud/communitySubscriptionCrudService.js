import CrudService from './baseCrudService.js';
import CommunitySubscription from '../models/communitySubscription.js';

const communitySubscriptionCrud = new CrudService(CommunitySubscription);

export const createCommunitySubscription = (data) => communitySubscriptionCrud.create(data);
export const getCommunitySubscriptionById = (id, projection, options) =>
  communitySubscriptionCrud.findById(id, projection, options);
export const listCommunitySubscriptions = (filter, projection, options) =>
  communitySubscriptionCrud.findMany(filter, projection, options);
export const updateCommunitySubscriptionById = (id, updates, options) =>
  communitySubscriptionCrud.updateById(id, updates, options);
export const aggregateCommunitySubscriptions = (pipeline) => communitySubscriptionCrud.Model.aggregate(pipeline);
export const deleteCommunitySubscriptionById = (id) => communitySubscriptionCrud.Model.findByIdAndDelete(id);
