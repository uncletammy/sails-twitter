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
	//			console.log(collection)
            var loadTwitterIdentity = function(twitIdentObject){
            	var twitIdentity = {};
            	twitIdentity[collection.identity] = {};
            	twitIdentity[collection.identity][twitIdentObject.ident_name] = {
					ident_name: twitIdentObject.ident_name,
					twit_object: new Twit({
							consumer_key: twitIdentObject.consumer_key,
							consumer_secret: twitIdentObject.consumer_secret,
							access_token: twitIdentObject.access_token,
							access_token_secret: twitIdentObject.access_token_secret
						}),
					tweetStreams:{}
				};

				_.defaults(_twitterIdentities,twitIdentity);


            };

            twitterConfig.identities.forEach(loadTwitterIdentity);
	//		console.log('Twitter Identities Loaded:',_twitterIdentities)

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
		// Find, Create, Update, and Destroy are intentionally missing as to not overwrite
		// those methods in the event that a model has multiple adapters in addition to this one 




/*		postTweet: function (collectionName, criteria, cb) {
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			var queryCB = function (err, result) {
				var methodCB = cb;
				if (err) return methodCB(err);
				if (!(result && result.statuses) ) return methodCB(result);
				return methodCB(err, result.statuses);
			};

			var runQuery = function(normalizedQuery){
					return grabConnection.twit_object.post('statuses/update', normalizedQuery, queryCB);
			}

			utils.normalize(grabConnection, criteria.query, runQuery);

		},
*/

//https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=twitterapi&count=2

		findUserTweets: function (collectionName, criteria, cb) {
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			var queryCB = function (err, result) {
				var methodCB = cb;
				if (err){
					return methodCB(err);
				} else {
					return methodCB(null,result);
				}
			};

			var runQuery = function(normalizedQuery){
					return grabConnection.twit_object.get('statuses/user_timeline', normalizedQuery, queryCB);
			}

			utils.normalize('findUserTweets',grabConnection, criteria.query, runQuery);

		},
		postTweet: function (collectionName, criteria, cb) {
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			var queryCB = function (err, result) {
				console.log(err,result);
				var methodCB = cb;
				if (err){
					return methodCB(err);
				} else {
					return methodCB(null,result);
				}
			};

			var runQuery = function(normalizedQuery){
					return grabConnection.twit_object.post('statuses/update', normalizedQuery, queryCB);
			}

			utils.normalize('postTweet',grabConnection, criteria.query, runQuery);

		},
		destroyTweet: function (collectionName, criteria, cb) {
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			var queryCB = function (err, result) {
				console.log(err,result);
				var methodCB = cb;
				if (err){
					return methodCB(err);
				} else {
					return methodCB(null,result);
				}
			};

			var runQuery = function(normalizedQuery){
					return grabConnection.twit_object.post('statuses/destroy/'+normalizedQuery.id, queryCB);
			}

			utils.normalize('destroyTweet',grabConnection, criteria.query, runQuery);

		},
		searchTweets: function (collectionName, criteria, cb) {
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			var queryCB = function (err, result) {
				var methodCB = cb;
				if (err){
					return methodCB(err);
				} else {
					return methodCB(null,result);
				}
			};

			var runQuery = function(normalizedQuery){
					return grabConnection.twit_object.get('search/tweets', normalizedQuery, queryCB);
			}

			utils.normalize('searchTweet',grabConnection, criteria.query, runQuery);

		},

		findTrend: function (collectionName, criteria, cb) {
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];

			var queryCB = function (err, result) {
				var methodCB = cb;
				if (err) return methodCB(err);
				if (!(result[0] && result[0].trends) ) return methodCB(result);
				return methodCB(err, result[0].trends);
			};

			var runQuery = function(normalizedQuery){
					return grabConnection.twit_object.get('trends/place', normalizedQuery, queryCB);

			}

			utils.normalize('findTrend',grabConnection, criteria.query, runQuery);

		},

		startTweetStream: function(collectionName, criteria, cb){
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];
			var socketObject = criteria.socketObject;

			var makeDate = new Date();
			var getNewDate = makeDate.getTime();

			var filteredQuery = criteria.query.filter.split(' ');

			console.log('Looking for statuses containing any of these words:',filteredQuery);

			var eatTweets = function(tweet){
				console.log('Tweet!',tweet);
				var saveDate = getNewDate;
				var saveConnection = grabConnection;
				var thisConnection = saveConnection.tweetStreams[saveDate];
				tweet['forStream'] = saveDate;
				thisConnection.socket.emit('streamTweet',tweet)
			};

			var newStream = {
				streamID: getNewDate,
				socket:socketObject,
				streamObject: grabConnection.twit_object.stream('statuses/filter', { filter:filteredQuery })
			}

			newStream[doThisOnTweet] = eatTweets;
			console.log('fuck',newStream.streamID);

			newStream.streamObject.on('tweet',this.doThisOnTweet);

//			newStream.streamObject.on.apply(newStream)

			grabConnection.tweetStreams[getNewDate] = newStream;

			return cb(null,makeDate.toUTCString());


/*			var logTheseEvents = ['warning','connect','disconnect','limit'];
			logTheseEvents.forEach(function(v){
			});
*/		}			

		// Usage 
		// Tweet.startStream({endpoint:'statuses/filter',filter:{track:'twitter'}},console.log)
/*		startTweetStream: function(collectionName, criteria){
			var grabConnection = _twitterIdentities[collectionName][criteria.twit_ident];

			var newStream = grabConnection.twit_object.stream(criteria.endpoint,criteria.filter);
			newStream.on('tweet', criteria.streamLogic);

			var logTheseEvents = ['warning','connect','disconnect','limit'];
			logTheseEvents.forEach(function(v){
			});


		}*/
	}
	return Adapter;		
})();

