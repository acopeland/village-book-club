var _ = require('lodash');
var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'village-book-club'
    },
    port: 3000,
    db: 'mongodb://localhost/village-book-club-development',
    ip: 'localhost'
  },

  test: {
    root: rootPath,
    app: {
      name: 'village-book-club'
    },
    port: 3000,
    db: 'mongodb://localhost/village-book-club-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'village-book-club'
    },
    port: process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000,
    db: process.env.MONGOLAB_URI ||
        process.env.MONGOHQ_URL ||
        process.env.OPENSHIFT_MONGODB_DB_URL+process.env.OPENSHIFT_APP_NAME ||
        'mongodb://localhost/village-book-club-production',
    ip:       process.env.OPENSHIFT_NODEJS_IP ||
              process.env.IP ||
              undefined,
  }
};


module.exports = config[env];
