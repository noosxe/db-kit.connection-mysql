"use strict";

var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var Connection = require('../lib/connection.js');

describe('Connection', function() {

	describe('#instance()', function() {

		it('should return an instance of Connection', function() {

			expect(Connection.instance({}))
				.to.be.an.instanceof(Connection);

		});

		it('should pass options to created instance', function() {

			expect(Connection.instance({
				host: 'localhost',
				port: '3306',
				user: 'root',
				password: '',
				database: 'test',
				charset: 'UTF8_UNICODE_CI',
				string: 'mysql://root:@localhost:3306/test?&charset=UTF8_UNICODE_CI',
				debug: false
			}).options)
				.to.be.deep.equal({
					host: 'localhost',
					port: '3306',
					user: 'root',
					password: '',
					database: 'test',
					charset: 'UTF8_UNICODE_CI',
					string: 'mysql://root:@localhost:3306/test?&charset=UTF8_UNICODE_CI',
					debug: false
				});

		});

	});

	describe('instance', function() {

		describe('#query()', function() {

			it('should make query and return results', function() {

				return expect(Connection.instance({
					host: 'localhost',
					port: '3306',
					user: 'root',
					password: '',
					database: 'test',
					charset: 'UTF8_UNICODE_CI',
					string: 'mysql://root:@localhost:3306/test?&charset=UTF8_UNICODE_CI',
					debug: false
				}).query('select 1 + ? as result', [1]))
					.to.eventually.be.deep.equal([{ result: 2 }]);

			});

		});

		describe('#querySerial', function() {

			it('should execute given queries serially in a single transaction', function() {

				return expect(Connection.instance({
					host: 'localhost',
					port: '3306',
					user: 'root',
					password: '',
					database: 'test',
					charset: 'UTF8_UNICODE_CI',
					string: 'mysql://root:@localhost:3306/test?&charset=UTF8_UNICODE_CI',
					debug: false
				}).querySerial([
					{ text: 'select 1 + ? as result', values: [1] },
					{ text: 'select 1 + ? as result', values: [2] },
					{ text: 'select 1 + ? as result', values: [3] }
				]))
					.to.eventually.be.deep.equal([
						[{ result: 2 }],
						[{ result: 3 }],
						[{ result: 4 }]
					]);

			});

		});

		describe('#queryParallel', function() {

			it('should execute given queries in parallel', function() {

				return expect(Connection.instance({
					host: 'localhost',
					port: '3306',
					user: 'root',
					password: '',
					database: 'test',
					charset: 'UTF8_UNICODE_CI',
					string: 'mysql://root:@localhost:3306/test?&charset=UTF8_UNICODE_CI',
					debug: false
				}).queryParallel([
					{ text: 'select 1 + ? as result', values: [1] },
					{ text: 'select 1 + ? as result', values: [2] },
					{ text: 'select 1 + ? as result', values: [3] }
				]))
					.to.eventually.be.deep.equal([
						[{ result: 2 }],
						[{ result: 3 }],
						[{ result: 4 }]
					]);

			});

		});

	});

});