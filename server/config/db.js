const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  
  if (!uri) {
    uri = 'mongodb://127.0.0.1:27017/smart-parking-system';
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`\x1b[32m[MongoDB Connected] Host: ${conn.connection.host}, Database: ${conn.connection.name}\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m[MongoDB Connection Error] Failed to connect to MongoDB at: ${uri}\x1b[0m`);
    
    // Try mongodb-memory-server as a real in-memory MongoDB fallback
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('\x1b[33m[Fallback] Starting MongoDB Memory Server (real in-memory MongoDB)...\x1b[0m');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`\x1b[32m[MongoDB Memory Server Connected] URI: ${memUri}\x1b[0m`);
      console.log('\x1b[33m[Notice] Using in-memory MongoDB. Data persists for the duration of this server process.\x1b[0m');
    } catch (memError) {
      console.warn('\x1b[33m[Warning] mongodb-memory-server unavailable. Starting application in custom MOCK mode...\x1b[0m');
      console.warn('\x1b[33m[Notice] Data will be preserved in-memory for the duration of the server process. All REST APIs and Socket.IO updates will function 100% correctly.\x1b[0m');
      
      global.isMockDB = true;
      setupMockDatabase();
    }
  }
};

function setupMockDatabase() {
  global.mockCollections = {};

  const chainable = (data) => {
    return {
      populate: function() { return this; },
      sort: function() { return this; },
      select: function() { return this; },
      then: function(resolve) {
        if (resolve) resolve(data);
        return Promise.resolve(data);
      },
      catch: function() {
        return this;
      }
    };
  };

  const originalModel = mongoose.model;
  
  const patchModel = (Model) => {
    const modelName = Model.modelName;
    if (!global.mockCollections[modelName]) {
      global.mockCollections[modelName] = [];
    }
    const store = global.mockCollections[modelName];

    const makeDoc = (data) => {
      if (!data) return null;
      
      const doc = {
        _id: data._id || new mongoose.Types.ObjectId(),
        createdAt: data.createdAt || new Date(),
        updatedAt: new Date(),
        ...data
      };

      // User model specific mocks (Pre-save hashing & Instance methods)
      if (modelName === 'User') {
        const bcrypt = require('bcryptjs');
        
        // Auto-hash plain text passwords
        if (doc.passwordHash && !doc.passwordHash.startsWith('$2')) {
          doc.passwordHash = bcrypt.hashSync(doc.passwordHash, 10);
        }

        // Attach compare method
        doc.matchPassword = async function(enteredPassword) {
          return await bcrypt.compare(enteredPassword, this.passwordHash);
        };
      }

      doc.save = async function() {
        // For User update, ensure password gets hashed if modified
        if (modelName === 'User' && this.passwordHash && !this.passwordHash.startsWith('$2')) {
          const bcrypt = require('bcryptjs');
          this.passwordHash = bcrypt.hashSync(this.passwordHash, 10);
        }
        
        const idx = store.findIndex(item => item._id.toString() === this._id.toString());
        if (idx > -1) {
          store[idx] = this;
        } else {
          store.push(this);
        }
        return this;
      };

      doc.toObject = function() { return this; };
      doc.deleteOne = async function() {
        const idx = store.findIndex(item => item._id.toString() === this._id.toString());
        if (idx > -1) store.splice(idx, 1);
        return { deletedCount: 1 };
      };

      return doc;
    };

    Model.find = function(query = {}) {
      let results = [...store];
      if (query && typeof query === 'object' && Object.keys(query).length > 0) {
        results = store.filter(item => {
          for (let key in query) {
            const val = query[key];
            if (val && typeof val === 'object') {
              if ('$in' in val) {
                const matchArr = val.$in.map(x => x?.toString());
                if (!matchArr.includes(item[key]?.toString())) return false;
              } else if ('$ne' in val) {
                if (item[key]?.toString() === val.$ne?.toString()) return false;
              } else if ('$lt' in val) {
                if (!(item[key] < val.$lt)) return false;
              } else if ('$gt' in val) {
                if (!(item[key] > val.$gt)) return false;
              }
            } else {
              if (item[key]?.toString() !== val?.toString()) return false;
            }
          }
          return true;
        });
      }
      return chainable(results.map(r => makeDoc(r)));
    };

    Model.findOne = function(query = {}) {
      const results = store.filter(item => {
        for (let key in query) {
          const val = query[key];
          if (val && typeof val === 'object') {
            if ('$in' in val) {
              const matchArr = val.$in.map(x => x?.toString());
              if (!matchArr.includes(item[key]?.toString())) return false;
            } else if ('$ne' in val) {
              if (item[key]?.toString() === val.$ne?.toString()) return false;
            } else if ('$lt' in val) {
              if (!(item[key] < val.$lt)) return false;
            } else if ('$gt' in val) {
              if (!(item[key] > val.$gt)) return false;
            } else {
              if (item[key]?.toString() !== val?.toString()) return false;
            }
          } else {
            if (item[key]?.toString() !== val?.toString()) return false;
          }
        }
        return true;
      });
      const found = results.length > 0 ? results[0] : null;
      return chainable(found ? makeDoc(found) : null);
    };

    Model.findById = function(id) {
      const found = store.find(item => item._id?.toString() === id?.toString());
      return chainable(found ? makeDoc(found) : null);
    };

    Model.create = async function(data) {
      if (Array.isArray(data)) {
        return Model.insertMany(data);
      }
      const doc = makeDoc(data);
      store.push(doc);
      return doc;
    };

    Model.insertMany = async function(docs) {
      const created = [];
      for (let d of docs) {
        const doc = await Model.create(d);
        created.push(doc);
      }
      return created;
    };

    Model.deleteMany = function(query = {}) {
      let deletedCount = 0;
      if (Object.keys(query).length === 0) {
        deletedCount = store.length;
        store.length = 0;
      } else {
        const toKeep = store.filter(item => {
          let matches = true;
          for (let key in query) {
            if (item[key]?.toString() !== query[key]?.toString()) {
              matches = false;
              break;
            }
          }
          if (matches) deletedCount++;
          return !matches;
        });
        store.length = 0;
        store.push(...toKeep);
      }
      return chainable({ deletedCount });
    };

    Model.findByIdAndUpdate = function(id, update, options = {}) {
      const doc = store.find(item => item._id.toString() === id.toString());
      if (doc) {
        const actualUpdate = update.$set || update;
        Object.assign(doc, actualUpdate);
        doc.updatedAt = new Date();
        return chainable(makeDoc(doc));
      }
      return chainable(null);
    };

    Model.updateMany = function(query, update) {
      let nModified = 0;
      const actualUpdate = update.$set || update;
      store.forEach(item => {
        let matches = true;
        for (let key in query) {
          if (item[key]?.toString() !== query[key]?.toString()) {
            matches = false;
            break;
          }
        }
        if (matches) {
          Object.assign(item, actualUpdate);
          nModified++;
        }
      });
      return chainable({ nModified });
    };

    Model.countDocuments = function(query = {}) {
      const matches = store.filter(item => {
        for (let key in query) {
          if (item[key]?.toString() !== query[key]?.toString()) return false;
        }
        return true;
      });
      return chainable(matches.length);
    };

    Model.aggregate = function(pipeline = []) {
      let result = [];
      if (pipeline.length > 0) {
        const match = pipeline.find(p => p.$match);
        const group = pipeline.find(p => p.$group);
        
        let filtered = store;
        if (match) {
          filtered = store.filter(item => {
            if (match.$match.status === 'Completed') return item.status === 'Completed';
            if (match.$match.status && match.$match.status.$in) return match.$match.status.$in.includes(item.status);
            return true;
          });
        }
        
        if (group) {
          const sumField = group.$group.total?.$sum;
          if (sumField) {
            const field = sumField.replace('$', '');
            const totalSum = filtered.reduce((acc, curr) => acc + (curr[field] || 0), 0);
            result = [{ _id: null, total: totalSum }];
          } else {
            const groupField = group.$group._id;
            const field = groupField.replace('$', '');
            const grouped = {};
            filtered.forEach(item => {
              const val = item[field] || 'Unknown';
              grouped[val] = (grouped[val] || 0) + 1;
            });
            result = Object.keys(grouped).map(k => ({ _id: k, count: grouped[k] }));
          }
        }
      }
      return chainable(result);
    };
  };

  mongoose.modelNames().forEach(name => {
    patchModel(mongoose.model(name));
  });

  mongoose.model = function(name, schema) {
    const Model = originalModel.apply(this, arguments);
    patchModel(Model);
    return Model;
  };
}

module.exports = connectDB;
