var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express.createServer();
var request = require('request');
var argv = require('optimist').argv;

var defaults = {
	port: 8000,
	cache: true
};

var override = function(defaults, overrides){
	var newObj = Object.create(defaults);
	Object.keys(overrides).forEach(function(key){
		newObj[key] = overrides[key];
	});
	return newObj;
};

var settings = override(defaults, argv);
var cache = settings.cache;

console.log(settings);

if(cache){
	var db = require('dirty')('apiCache.db');
	var dbReadyToRead = false;
	db.on('load', function() {
		console.log('db loaded');
		dbReadyToRead = true;
	});
}


app.use(express['static'](__dirname));

app.use(function(req, res, next) {
	if(! /^\/vbcrest\//.test(req.url)) return next();

	var sendApiResponse = function(body){
		res.writeHead(200, {
			'content-type': 'application/json'
		});
		res.write(body);
		return res.end();
	};

	if(cache){
		var cached = dbReadyToRead && db.get(req.url);
		if(cached){
			return sendApiResponse(cached);
		}
	}

	return request.get({
		url: "https://www.websaldo.se" + req.url,
		method: req.method,
		headers: {
			'accept': 'application/json',
			'authorization': req.headers['authorization']
		}
	}, function(err, resp, body) {
		if(err){
			console.log(err);
			res.writeHead(400, {});
			res.end(err.toString());
			return;
		}
		
		if(cache) db.set(req.url, body);

		sendApiResponse(body);
	});
});

app.use(function(req, res){
	res.sendfile('index.html');
});

app.listen(settings.port);
console.log('Listening on port ' + settings.port);
