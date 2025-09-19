// Generic reusable CRUD service factory for Mongoose models

export default class CrudService {
  constructor(Model) {
    this.Model = Model;
  }

  // Create a new document
  async create(data) {
    const doc = new this.Model(data);
    return await doc.save();
  }

  // Read: single document by id
  async findById(id, projection = null, options = {}) {
    return await this.Model.findById(id, projection, options).exec();
  }

  // Read: list documents by filter
  async findMany(filter = {}, projection = null, options = {}) {
    let query = this.Model.find(filter, projection, options);
    if (options.populate) {
      if (Array.isArray(options.populate)) {
        options.populate.forEach(pop => query = query.populate(pop));
      } else {
        query = query.populate(options.populate);
      }
    }
    return await query.exec();
  }

  // Update by id
  async updateById(id, updates, options = {}) {
    const finalOptions = { new: true, runValidators: true, ...options };
    return await this.Model.findByIdAndUpdate(id, updates, finalOptions).exec();
  }

  // Update many documents
  async updateMany(filter, updates, options = {}) {
    return await this.Model.updateMany(filter, updates, options);
  }

  // Delete by id
  async deleteById(id, options = {}) {
    return await this.Model.findByIdAndDelete(id, options).exec();
  }
}
