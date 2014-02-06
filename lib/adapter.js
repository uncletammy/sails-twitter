/*---------------------
	:: TwitterAdapter 
	-> adapter
---------------------*/

// var request = require('request');
var Twit = require('twit');
var _ = require('lodash');
var utils = require('./utils');


module.exports = (function() {

	var _twitterIdentities = {};

	var Adapter = {
		defaults:{},


		registerCollection: function (collection, cb) {
            var twitterConfig = _.cloneDeep(collection.config);

            var loadTwitterIdentity = function(twitIdentObject){
            	var twitIde = {};
            	twitIdentity[collection.identity] = {};
            	twitIdentity[collection.identity][twitIdentObject.ident_name] = {
					ident_name: twitIdentObject.ident_name,
					twit_object: new Twit({
							consumer_key: twitIdentObject.consumer_key,
							consumer_secret: twitIdentObject.consumer_secret,
							access_token: twitIdentObject.access_token,
							access_token_secret: twitIdentObject.access_token_secret
						})
				};

				_.defaults(_twitterIdentities,twitIdentity);


            };

            twitterConfig.identities.forEach(loadTwitterIdentity);
			console.log('Twitter Identities Loaded:',_twitterIdentities)

			cb();
		},

/*
find
	trends
		GET trends/place
	closestTrend
		GET trends/closest
	trendingAt
		GET trends/available
	placeByGeocode
		GET geo/reverse_geocode
	placeByTweetLocation
		GET geo/search
	placeByPlaceID
		GET geo/id/:place_id
	myRetweets
		GET statuses/retweets_of_me
	myTimeline
		GET statuses/home_timeline
	timeline
		GET statuses/user_timeline
	myMentions
		GET statuses/mentions_timeline
	singleTweet
		GET statuses/show/:id
	retweets
		GET statuses/retweets/:id
	retweeters
		GET statuses/retweeters/ids
	tweets
		GET search/tweets
	myDirectMessages
		GET direct_messages/sent
	directMessage
		GET direct_messages/show
	sentDirectMessages (20)
		GET direct_messages/sent
	user (users)
		GET users/lookup
create
	tweet
	directMessage
		POST direct_messages/new
	retweet
		POST statuses/retweet/:id
update
	tweets - by id	
destroy
	tweet
		POST statuses/destroy/:id
	directMessage
		POST direct_messages/destroy
stream
	tweets
		POST statuses/filter
	usermessages ?
		GET user
	many_usermessages
		GET site



*/
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
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			console.log('Searching Twitter for "search/tweets" with ', criteria.query);
			grabConnection.twit_object.get('search/tweets', { q: criteria.query, count: 10 }, function (err, result) {
				if (err) return cb(err);
				if (!(result && result.statuses) ) return cb(result);
				cb(err, result.statuses);
			});
		},

		trends: function (collectionName, criteria, cb) {
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			grabConnection.twit_object.get('trends/place', {
				id: criteria.id || 1
			}, function (err, result) {
				if (err) return cb(err);
				if (!(result[0] && result[0].trends) ) return cb(result);
				cb(err, result[0].trends);
			});
		},

		trendingPlaces: function (collectionName, criteria, cb) {
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			grabConnection.twit_object.get('trends/closest', {
				lat: criteria.lat || 0,
				long: criteria.long || 0
			}, cb);
		},
// Usage 
// Tweet.startStream({endpoint:'statuses/filter',filter:{track:'twitter'}},console.log)

		startTweetStream: function(collectionName, criteria){
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
//			console.log(JSON.stringify(criteria));
			var newStream = grabConnection.twit_object.stream(criteria.endpoint,criteria.filter);
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

