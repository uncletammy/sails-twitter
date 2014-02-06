/*
TODO
	Write code for dealing with multiple pages of returned stack items
	CRUD Stack Questions/Answers
	OAUTH

*/



/**
 * Module dependencies
 */
var _ = require('lodash');
var utils = require('./utils');
/**
 * @type {Adapter}
 */
module.exports = (function() {

	// model configurations
	var _modelConfigs = {};

	var Adapter = {

		defaults: {
			sendTo:{
				reqMethod:'POST',
				url:'http://localhost:1337/stack'
			}
		},
		apiCallManager : {
				activePolls:{},
				// Create new interval which calls Stack with the given options (url,method,frequency).  Put that interval in activePolls
				newURL: function(options,cb){
//					console.log('Loading new stackCall interval of '+options.url+'\n'+options.requestMethod+'\n'+options.frequency+'\n');

					Adapter.apiCallManager.activePolls[options.url] = {
						requestMethod:options.requestMethod.toLowerCase(),
						callFrequency: options.frequency,
						stackItemCB:cb,
//						lastCalled:1388448000,
						lastCalled:utils.getStackDateString()-utils.getStackDateString(options.frequency),
						intervalID: setInterval(function(){
			    			this.url = options.url;
							var thisPoll = Adapter.apiCallManager.activePolls[this.url];

							// Add time params to query string so only new items are returned. 
			    			var currentTime = utils.getStackDateString();
			    			var addDateRange = 'https://api.stackexchange.com'+this.url+
			    					'&fromdate='+thisPoll.lastCalled+
			    					'&todate='+currentTime;

			    			thisPoll.lastCalled = currentTime;

			    			// Make call to Stack.  Run the Poll Callback on the returned items.
							utils.callStack(thisPoll,addDateRange, function afterStackCall(whichPoll,stackItemArray){
									var getPoll = whichPoll;
									getPoll.stackItemCB(null,stackItemArray);
//									getPoll.lastCalled = utils.getStackDateString();
							});
			    		},options.frequency)
			    	}
				}
			},

		// This method runs when a model is initially registered at lift-time.
		registerCollection: function(model, cb) {

            // Clone the configuration just in case (to avoid mutating it on accident)
            var stackConfig = _.cloneDeep(model.config);

            // Store each model config for later.
            _modelConfigs[model.identity] = stackConfig;

			// Absorb adapter defaults into model configuration
            _.defaults(model.config, Adapter.defaults);

			// Done registering this model.
			cb();
		},

		pollStack: function(model,options,cb){

			var apiCallManager = Adapter.apiCallManager;

			var newInterval = apiCallManager.newURL(options,cb);
//			console.log('Pollstack apiCallManager:'+JSON.stringify(Adapter.apiCallManager));

		},


		// This method is fired when a model is unregistered, typically at server halt
		// useful for tearing down remaining open connections, etc.
		teardown: function(cb) {
			console.log('tearing down a model..');


			cb();
		}
	};


	return Adapter;



	/**
	 * Extend usage options with model configuration
	 * (which also includes adapter defaults)
	 * @api private
	 */
	// function _extendOptions(modelIdentity, options) {

	// 	// Ignore unexpected options, use {} instead
	// 	options = _.isPlainObject(options) ? options : {};

	// 	// Apply model defaults, if relevant
	// 	if (modelIdentity) {
	// 		return _.extend({}, _modelConfigs[modelIdentity], options);
	// 	}
	// 	return _.extend({}, options);
	// }

})();


