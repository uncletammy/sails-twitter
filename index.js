/*---------------------
	:: TwitterAdapter 
	-> adapter
---------------------*/

// var request = require('request');
var Twit = require('twit');
var _ = require('lodash');

module.exports = (function() {

	var _modelConfigs = {};

	var Adapter = {
		defaults:{},
		registerCollection: function (collection, cb) {
			console.log('Twitter Adapter Loaded');
            var twitterConfig = _.cloneDeep(collection.config);

			_modelConfigs[collection.identity] = new Twit({
					consumer_key: collection.config.consumer_key,
					consumer_secret: collection.config.consumer_secret,
					access_token: collection.config.access_token,
					access_token_secret: collection.config.access_token_secret
				});

			cb();
		},
						//ModelName?
		find: function (collectionName, options, cb) {
			// for now, only use the "where" part of the criteria set
			var criteria = options.where || {};

			switch (collectionName) {
				case 'location'	: return this.trendingPlaces(collectionName, criteria, afterwards);
				case 'trend'	: return this.trends(collectionName, criteria, afterwards);
				case 'tweet'	: return this.searchTweets(collectionName, criteria, afterwards);
				default: return afterwards('Unknown usage of find() with model ('+collectionName+') ');
			}

			function afterwards (err, results) {
				if (err) return cb(err);
				if (options.limit) return cb(null, _.first(results,options.limit));
				
				return cb(err,results);
			}
		},

		searchTweets: function (collectionName, criteria, cb) {
			var grabConnection = _modelConfigs[collectionName];
			grabConnection.get('search/tweets', criteria, function (err, result) {
				if (err) return cb(err);
				if (!(result && result.statuses) ) return cb(result);
				cb(err, result.statuses);
			});
		},

		trends: function (collectionName, criteria, cb) {
			var grabConnection = _modelConfigs[collectionName];
			grabConnection.get('trends/place', {
				id: criteria.id || 1
			}, function (err, result) {
				if (err) return cb(err);
				if (!(result[0] && result[0].trends) ) return cb(result);
				cb(err, result[0].trends);
			});
		},

		trendingPlaces: function (collectionName, criteria, cb) {
			var grabConnection = _modelConfigs[collectionName];
			grabConnection.get('trends/closest', {
				lat: criteria.lat || 0,
				long: criteria.long || 0
			}, cb);
		},
// Usage 
// Tweet.startStream({endpoint:'statuses/filter',filter:{track:'twitter'}},console.log)

		startTweetStream: function(collectionName, criteria){
			var grabConnection = _modelConfigs[collectionName];
//			console.log(JSON.stringify(criteria));
			var newStream = grabConnection.stream(criteria.endpoint,criteria.filter);
			newStream.on('tweet', criteria.streamLogic);
//			console.log(typeof criteria.streamLogic);
			var logTheseEvents = ['warning','connect','disconnect','limit'];
			logTheseEvents.forEach(function(v){
//				newStream.on(v,console.log);
			});

	//		console.log('cName:'+JSON.stringify(collectionName)+'\n\nCriterea:'+JSON.stringify(criteria));
	//		console.log(JSON.stringify(grabConnection));
		}
	}
	return Adapter;		
})();

