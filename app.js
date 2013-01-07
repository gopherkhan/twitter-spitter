// Base code following ember tutorial here:
// https://www.adobe.com/devnet/html5/articles/flame-on-a-beginners-guide-to-emberjs.html
// will be tweaking this to make moar inneresting

/**************************
 * Application
 **************************/
App = Em.Application.create();

/**************************
 * Models
 **************************/
App.Tweet = Em.Object.extend({
	avatar: null,
	screen_name: null,
	text: null,
	date: null
});

/**************************
 * Views
 **************************/
App.SearchTextField = Em.TextField.extend({
	insertNewline: function(){
		App.tweetsController.loadTweets();
	}
});

/**************************
 * Controllers
 **************************/

App.tweetsController = Em.ArrayController.create({
	content: [],
	username: '',
	preppedSVG: false,
	loadTweets: function() {
		var me = this;
		var username = me.get("username");
		if ( username ) {
			var url = 'http://api.twitter.com/1/statuses/user_timeline.json'
			url += '?screen_name=%@&callback=?'.fmt(me.get("username"));
			// push username to recent user array
			App.recentUsersController.addUser(username);
			$.getJSON(url,function(data){
				me.set('content', []);
				$(data).each(function(index,value){
					var t = App.Tweet.create({
						avatar: value.user.profile_image_url,
						screen_name: value.user.screen_name,
						text: value.text,
						date: value.created_at
					});
					me.pushObject(t);
				});
				me.graphData();
			});
		}
	},

	graphData: function() {
		// nonsense for now....
		var rawData = [];
		this.content.forEach(function(elem) {
			rawData.push({date: elem.date, text: elem.text});
		});

		var colors = ["aquamarine", "burlywood", "coral", "darkseagreen"]; // add some that make sense
		var selection = this.preppedSVG ? d3.select('#graphy-graph').select('svg') :  d3.select('#graphy-graph').append("svg").attr("width", 300).attr('height',300);


		var circles = selection.selectAll('circle').data(rawData);
		circles.enter().append('circle');
		var baseColor = '137';
		circles.attr('cx', function(d, i) {
			return ~~((i * 100) % 300);
		}).attr('cy', function(d, i) {
				return ~~((Math.sqrt(d.text.length) * 100) % 300);
			}).attr('r', function(d, i) {
				return 5 * ~~Math.sqrt(d.text.length);
			}).style('fill', function(d, i) {
				return colors[d.text.length % colors.length];
			} );
		circles.exit().remove();

		this.set('preppedSVG', true);
	}
});

App.recentUsersController = Em.ArrayController.create({
	content: [],
	addUser: function(name) {
		if ( this.contains(name) ) this.removeObject(name);
		this.pushObject(name);
	},
	// functions called by an {{action}} in a view have the corresponding view passed as the first argument
	removeUser: function(view){
		this.removeObject(view.context);
	},
	searchAgain: function(view){
		App.tweetsController.set('username', view.context);
		App.tweetsController.loadTweets();
	},
	reverse: function(){
		return this.toArray().reverse();
	}.property('@each')
});