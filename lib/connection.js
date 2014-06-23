"use strict";

var mysql = require('mysql2');
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

Connection.prototype.query = function(query, params) {
	var defer = Promise.defer();
	params = params || {};

	this.pool.getConnection(function(err, con) {
		if (err) {
			return defer.reject(err);
		}

		con.config.queryFormat = function (query, values) {
			if (!values) return query;
			return query.replace(/\$(\d+)/g, function (txt, key) {
				if (values.hasOwnProperty(key)) {
					return this.escape(values[key]);
				}
				return txt;
			}.bind(this));
		};

		con.query(query, params, function (err, result) {
			if (err) {
				return defer.reject(err);
			}
			defer.resolve(result);
			con.release();
		});
	});

	return defer.promise;
};

Connection.instance = function() {
	var my = Object.create(Connection.prototype);
	return Connection.apply(my, arguments) || my;
};

module.exports = Connection;