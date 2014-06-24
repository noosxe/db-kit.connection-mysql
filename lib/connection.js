"use strict";

var mysql   = require('mysql2');
var Promise = require('bluebird');

var Connection = function(options) {
	this.options = options;
	this.pool = mysql.createPool({
		host: options.host,
		port: options.port,
		user: options.user,
		password: options.password,
		database: options.database,
		charset: options.charset,
		debug: options.debug
	});
};

Connection.prototype.getConnection = function() {
	var defer = Promise.defer();

	this.pool.getConnection(function(err, connection) {
		if (err) {
			return defer.reject(err);
		}

		defer.resolve(connection);
	});

	return defer.promise;
};

Connection.prototype.execute = function(connection, query, values) {
	var defer = Promise.defer();
	connection.execute(query, values, function(err, results) {
		if (err) {
			return defer.reject(err);
		}

		defer.resolve({ results: results, connection: connection });
	});

	return defer.promise;
};

Connection.prototype.beginTransaction = function(connection) {
	var defer = Promise.defer();

	connection.beginTransaction(function(err) {
		if (err) {
			return defer.reject(err);
		}

		defer.resolve(connection);
	});

	return defer.promise;
};

Connection.prototype.commit = function(connection) {
	var defer = Promise.defer();

	connection.commit(function(err) {
		if (err) {
			return defer.reject(err);
		}

		connection.release();
		defer.resolve(connection);
	});

	return defer.promise;
};

Connection.prototype.rollback = function(connection) {
	var defer = Promise.defer();

	connection.rollback(function() {
		connection.release();
		defer.resolve(connection);
	});

	return defer.promise;
};

Connection.prototype.query = function(query, params) {
	return this.getConnection().then(function(connection) {
		return this.execute(connection, query, params);
	}.bind(this)).then(function(res) {
		res.connection.release();
		return res.results;
	});
};

Connection.prototype.querySerial = function(queries) {
	return this.getConnection().bind({})
		.then(function(connection) {
			this.connection = connection;
			return connection;
		})
		.then(this.beginTransaction)
		.then(function(connection) {
				return Promise.reduce(queries, function(values, query) {
					return this.execute(connection, query.text, query.values).then(function() {
						values.push(arguments[0].results);
					}).return(values);
				}.bind(this), []);
			}.bind(this))
		.then(function(results) {
			this.results = results;
			return this.connection;
		})
		.then(this.commit, this.rollback)
		.then(function() {
			return this.results;
		});
};

Connection.prototype.queryParallel = function(queries) {
	return this.getConnection().bind({})
		.then(function(connection) {
			this.connection = connection;
			return connection;
		})
		.then(function(connection) {
			return Promise.map(queries, function(query) {
				return this.execute(connection, query.text, query.values).then(function() {
					return arguments[0].results;
				})
			}.bind(this))
		}.bind(this))
		.then(function(results) {
			this.connection.release();
			return results;
		});
};

Connection.instance = function() {
	var my = Object.create(Connection.prototype);
	return Connection.apply(my, arguments) || my;
};

module.exports = Connection;