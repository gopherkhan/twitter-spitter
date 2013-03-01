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
		var words = {};
		var wordCount = 0;
		var stripper = /[^a-z\ ]/gi;
		this.content.forEach(function(elem) {
			var stripped = elem.text.replace(stripper, "").trim();
			var elems = stripped.split(" ");
			wordCount += elems.length;
			elems.forEach(function(elem) {
				if (!words[elem]) {
					words[elem] = 1;
				} else {
					(words[elem])++;
				}
			});
			rawData.push({date: elem.date, text: elem.text});
		});

		var graphWidth = 700;
		var graphHeight = 500;
		var colors = ["aquamarine", "burlywood", "coral", "darkseagreen", "#666666", "#BADA55", "cornflowerblue", "crimson"]; // add some that make sense
		var selection = this.preppedSVG ? d3.select('#graphy-graph').select('svg') :  d3.select('#graphy-graph').append("svg").attr("width", graphWidth).attr('height',graphHeight);

		var wordsArr = [];
		Object.keys(words).forEach(function(key) {
			wordsArr.push({
				text: key,
				freq: words[key]
			});
		});

		var opacitizer = function(d, i) {
			return (d.freq / wordCount) + 0.3;
		};

		var circles = selection.selectAll('circle').data(wordsArr);
		circles.enter().append('circle');

		circles.exit().remove();

		circles.transition().
			delay(function(d,i) {
				// a sort of wave pattern.
				// each item transitions 200 millis after the previous one starts
				return (i+1) * 50;
			}).duration(2000).
				attr('cx', function(d, i) {
					return ~~(((i * 50) / d.freq) % graphWidth);
				}).attr('cy', function(d, i) {
					return ~~(((d.text.length * 37 )/ d.freq) % graphHeight);
				}).attr('r', function(d, i) {
					return 10 * d.text.length;
				}).style('fill', function(d, i) {
					return colors[d.text.length % colors.length];
				}).style('opacity', opacitizer);

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