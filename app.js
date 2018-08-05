/**************************
 * Streamlined Twitter S#!tter
 **************************/

function TweetBlaster(selector) {
	let content = [];
	let username =  '';
	let preppedSVG = false;
	const container = document.querySelector(selector);
	if (!container) { throw `Element ${selector} not found`; }

	const nameLabel = container.querySelector('.spitting-name');
	const tweetList = container.querySelector('.tweet-list');
	const form = container.querySelector('#frm');
	const field = form.querySelector('#user-field');
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		e.stopPropagation();
		nameLabel.innerText = field.value;
		fetchData(field.value);
	});

	function graphData(tweets) {
		// nonsense for now....
		var rawData = [];
		var words = {};
		var wordCount = 0;
		var stripper = /[^a-z\ ]/gi;

		tweets.forEach(function(elem) {
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
		var colors = ['#44B3C2', '#F1A94E', '#E45641', '#7B8D8E', 'gold',
						'#32B92D',	'#FF6EB0',	'#FFCB00',	'#93228D',
						'#B84B9E', '#F20075'];
		var selection = preppedSVG ? d3.select('#graphy-graph').select('svg') :  d3.select('#graphy-graph').append("svg").attr("width", graphWidth).attr('height',graphHeight);

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
		circles.enter().append('circle').
								attr('cx', 0).
								attr('cy', 0).
								attr('r', 0).
								style('fill', '#999999');

		var removeIdx = 0;
		circles.exit().transition().
			delay(function(d,i) {
				return (i+1) * 50;
			}).duration(2000).
				attr('cx', graphWidth).
				attr('cy', graphHeight).
				attr('r', 0).
				style('fill', '#999999').
				style('opacity', 1.0).
				remove();

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
					//d.text.length
					return colors[i % colors.length];
				}).style('opacity', opacitizer);

		preppedSVG = true;
	}


	function fetchData(name) {
		if (!name) { return; }
		name = window.encodeURIComponent(name);
		
		let url = `/twitter-spitter/twitter_talker.php?screen_name=${name}`;
		// push username to recent user array
		window.fetch(url).then((resp) => resp.json())
		.then(function(data) {
			const tweets = data.map(function(dat){
				return{
					avatar: dat.user.profile_image_url,
					screen_name: dat.user.screen_name,
					text: dat.text,
					date: dat.created_at
				};
			});

			graphData(tweets);
			listTweets(tweets);
			return tweets;
		});
	}

	function listTweets(toDisplay) {
		if (!Array.isArray(toDisplay) || !toDisplay.length) {
			tweetList.innerHTML = '<li>No Data</li>';
			return;
		}
		const html = toDisplay.map(tweetTemplate).join('');
		tweetList.innerHTML = html;
	}

	function tweetTemplate(dat) {
		return `<li>
					<img src="${dat.avatar}" class="person-image" >
					<span>${dat.date}</span>
					<h3>${dat.screen_name}</h3>
					<p>${dat.text}</p>
				</li>`;
	}

	return {
	};
}
