 
/**
 * Utility dependencies
 */
var _ = require('lodash');

/**
 * Expose adapter utility functions
 */

var utils = {
	normalize: function(methodCalling,grabConnection, criteria, runQuery){

		var thisQuery = {};
		var queryOptions = criteria;
		var queryKeys = _.keys(queryOptions);

		console.log(methodCalling,' has included these criteria keys ',queryOptions);

		var returnNormalizedQuery = function(){
			console.log('Normalized to ',thisQuery);
			return runQuery(thisQuery)
		}

		queryKeys.forEach(function(keyname,index){

			switch (keyname){
				case 'query':
					thisQuery['q'] = queryOptions.query;
				break;
				case 'limit':
					thisQuery['count'] = queryOptions.limit;
				break;
				case '_id':
					if (methodCalling !== 'destroyTweet')
						thisQuery['id'] = queryOptions._id;
					else
						thisQuery = {'id':queryOptions._id};
				break;
				case 'status':
					thisQuery = {status:queryOptions.status};
				break;
/*				case 'limit':
					thisQuery['count'] = queryOptions.limit;
				break;
				case 'limit':
					thisQuery['count'] = queryOptions.limit;
				break;
				case 'limit':
					thisQuery['count'] = queryOptions.limit;
				break;
*/				case 'user_id':
					thisQuery['user_id'] = queryOptions.user_id;
				break;

				default:break
			}
		});

		return returnNormalizedQuery(thisQuery);


		}
};
module.exports = utils;
