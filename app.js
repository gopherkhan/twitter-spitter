/**************************
 * Streamlined Twitter S#!tter
 **************************/

function TweetBlaster(selector) {
	let content = [];
	let username =  '';
	let lastData = [];
	let preppedSVG = false;
	const container = document.querySelector(selector);
	if (!container) { throw `Element ${selector} not found`; }

	const nameLabel = container.querySelector('.spitting-name');
	const tweetList = container.querySelector('.tweet-list');
	const form = container.querySelector('#frm');
	const field = form.querySelector('#user-field');
	const statsBlock = container.querySelector('.stats-block');
	const hoveredWordBlock = statsBlock.querySelector('.word');
	const hoveredWordCount = statsBlock.querySelector('.count');
	let wordColors = {};
	let statsColors = {};


	const ARTSY = 1;
	const STATSY = 2;
	let mode = ARTSY;
	var colors = ['#44B3C2', '#F1A94E', '#E45641', '#7B8D8E', 'gold',
						'#32B92D',	'#FF6EB0',	'#FFCB00',	'#93228D',
						'#B84B9E', '#F20075'];

	var wordCount = 0;
	var maxWordLength = 0;
	var graphWidth = 700;
	var graphHeight = 500;

	var xScale = d3.scale.linear().range([0, graphWidth]);
	var yScale = d3.scale.linear().range([0, graphHeight]);

	let numRows = 0; // for statsy mode

	const modeSelector = container.querySelector('.mode-select');
	modeSelector.addEventListener('click', (e) => {
		// TODO: Make something better than this
		if (!e.target.classList.contains('mode')) {
			return;
		}
		modeSelector.querySelector('.mode[selected]').removeAttribute('selected');
		
		if (e.target.classList.contains('artsy')) {
			mode = ARTSY;
			modeSelector.querySelector('.artsy').setAttribute('selected', '');
		} else {
			mode = STATSY;
			modeSelector.querySelector('.statsy').setAttribute('selected', '');
		}

		graphData(lastData);
	});

	modeSelector.innerHTML = `<span class="mode-label">Mode:</span><br><div class="mode statsy">Statsy</div>
                              <div class="mode artsy" selected>Artsy</div>`;

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		e.stopPropagation();
		nameLabel.innerText = field.value;
		fetchData(field.value);
	});

	function calcXPosition(d, i) {
		if (mode === ARTSY) {
			return ~~(((i * 50) / d.occurrences) % graphWidth);
		}
		// STATSY
		return xScale(i % 20 + 1);
	}

	function calcYPosition(d, i) {
		if (mode === ARTSY) {
			return ~~(((d.text.length * 37 )/ d.occurrences) % graphHeight);
		} 
		// STATSY
		return yScale(Math.floor(i / 20) + 1);
	}

	function calcRadius(d, i) {
		if (mode === ARTSY) {
			return 10 * d.text.length;
		} 
		return 10;
	}

	function toggleMode(toSet) {
		if (toSet === ARTSY || toSet === STATSY) {
			mode = toSet;
		} else {
			mode = ARTSY;
		}
	}

	function calcFill(d, i) {
		if (mode === ARTSY) {
			return wordColors[d.text];
		}
		return statsColors[d.occurrences];
	}

	function calcOpacity(d, i) {
		if (mode === ARTSY) {
			return (d.occurrences / wordCount) + 0.3;
		}
		return 0.3 + (d.text.length / maxWordLength) * .6;
	}


	function convertData(tweets) {
		var rawData = [];
		var wordHash = {};
		wordCount = 0; // side effect
		var maxLength = 0;
		// var stripper = /[^a-z\ ]/gi;

		tweets.forEach(function(elem) {
			var stripped = elem.text.trim();
			var elems = stripped.split(/\W+/gi);
			wordCount += elems.length;
			elems.forEach(function(elem) {
				if (!wordHash[elem]) {
					wordHash[elem] = 1;
				} else {
					(wordHash[elem])++;
				}
			});
			rawData.push({date: elem.date, text: elem.text});
		});

		var wordsArr = [];
		wordColors = {};
		statsColors = {};

		let maxOccurrences = 0;
		const uniqueWords = Object.keys(wordHash);

		uniqueWords.forEach(function(key, i) {
			wordsArr.push({
				text: key,
				occurrences: wordHash[key]
			});
			wordColors[key] = colors[i % colors.length];
			maxOccurrences = Math.max(wordHash[key], maxOccurrences);
			maxLength = Math.max(maxLength, key.length); 
		});

		if (mode === STATSY) {
			wordsArr.sort((a, b) => {
				if (a.occurrences < b.occurrences) {
					return -1;
				}
				if (a.occurrences > b.occurrences) {
					return 1;
				}
				
				if (a.text.length < b.text.length) {
					return -1;
				}

				if (a.text.length > b.text.length) {
					return 1;
				}

				if (a.text < b.text) {
					return -1;
				}

				if (a.text > b.text) {
					return 1;
				}
				return 0;
			});

			for (const word of wordsArr) {
				if (!statsColors[word.occurrences]) {
					statsColors[word.occurrences] = true;
				}
			}
			Object.keys(wordColors).forEach((key, i) => {
				statsColors[key] = colors[i % colors.length];
			});

			xScale.domain([0, 21]);
			yScale.domain([0, Math.ceil(wordsArr.length / 20) + 1])
		} else {
			xScale.domain([0, maxOccurrences + 1]);
			yScale.domain([0, maxLength + 1]);
		}
		maxWordLength = maxLength;
		return wordsArr;
	}

	function getSvg() {
		if (preppedSVG) {
			return d3.select('#graphy-graph').select('svg');
		} 
		var svg = d3.select('#graphy-graph').append("svg").attr("width", graphWidth).attr('height',graphHeight);
		preppedSVG = true;
		return svg;
	}


	function graphData(tweets) {
		lastData = tweets;

		var selection = getSvg();
		var wordsArr = convertData(tweets);
		var circles = selection.selectAll('circle').data(wordsArr);

		circles.enter().append('circle').
								attr('cx', 0).
								attr('cy', 0).
								attr('r', 0).
								style('fill', '#999999')
								.on('mouseover', function(d,i) { 
									hoveredWordBlock.innerText = d.text;
									hoveredWordCount.innerText = `${d.occurrences}/${wordCount}`;
								});

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
				attr('data-name', function(d, i) {
					return d.text;
				}).attr('data-count', function(d, i) {
					return d.occurrences;
				})
				.attr('cx', calcXPosition)
				.attr('cy', calcYPosition)
				.attr('r', calcRadius)
				.style('fill', calcFill)
				.style('opacity', calcOpacity);
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
			// do second, so colors are tracked
			// TODO factor this out
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
		/*
		const coloredWords = dat.text.split(/\W+/gi).map((word) => {
			const color = wordColors[word] || '#333';
		 	return `<span style="color:${color};">${word}</span>`; 
		}).join(' '); */
		
		return `<li>
					<img src="${dat.avatar}" class="person-image" >
					<span class="date">${dat.date}</span>
					<h3>${dat.screen_name}</h3>
					<p class="tweet-text">${dat.text}</p>
				</li>`;
	}

	return {
		// nothing to expose yet
	};
}
