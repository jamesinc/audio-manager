(function ( ) {

	/**
	 * AudioManager is a simple wrapper for managing the HTML5 API.
	 * Currently it works for browsers that support webkitAudioContext.
	 * This includes, Chrome, Safari, and iOS 6 devices.
	 * Unknown support: Chrome Mobile
	 * Not supported: Virtually everything else, including Firefox, Opera,
	 * IE. I'm sure FF support is not hard to implement.
	 */
	AudioManager = function ( ) {

		if ( !(this instanceof AudioManager) ) {

			throw "AudioManager must be instantiated (e.g. var audio = new AudioManager(); )";

		}

		this.files = { };
		this.context = new webkitAudioContext();

	};

	/**
	 * Initialise the AudioManager with some sound clips to play
	 * 
	 * Format is:
	 * clip: {
	 *    file: "path/to/file.mp3",
	 *    loop: true
	 * }
	 * [clip1, clip2, ..., clipN]
	 * 
	 * @param  {[type]}   files    an array of sound clips
	 * @param  {Function} callback (optional) a function to execute once clips are loaded
	 */
	AudioManager.prototype.load = function ( files, callback ) {

		var that = this;
		var loadFile = function ( url, ns ) {

			var request = new XMLHttpRequest();
			
			request.open("GET", url, true);
			request.responseType = "arraybuffer";

			request.onload = function ( ) {

				var source = that.context.createBufferSource();
				that.context.decodeAudioData(request.response, function ( buffer ) {

					that.files[ns] = {
						buffer: buffer,
						position: 0,
						volume: 1,
						playing: false,
						interrupt: files[ns].interrupt || false
					};

					that.files[ns].gain = that.context.createGainNode();
					that.files[ns].source = that.context.createBufferSource();
					that.files[ns].source.buffer = that.files[ns].buffer;
					that.files[ns].source.connect(that.files[ns].gain);
					that.files[ns].gain.connect(that.context.destination);

					for ( var prop in files ) {

						if ( !that.files.hasOwnProperty(prop) )
							return;

					}

					if ( typeof callback === "function" ) {

						callback();

					}

				});

			}

			request.send();

		};

		if ( typeof files !== "object" ) {

			return;

		}

		for ( var file in files ) {

			loadFile(files[file].file, file);

		}

	};

	/**
	 * Play a sound clip
	 * @param  String   track The key name of the sound clip to play
	 * @param  Boolean  loop  If set to true, this clip will loop infinitely
	 */
	AudioManager.prototype.play = function ( track, loop ) {

		var media = this.files[track];

		if ( media.source.playbackState === 3 || media.interrupt ) {

			this.stop(track);

			media.source = this.context.createBufferSource();
			media.source.buffer = media.buffer;
			media.source.connect(this.context.destination);
			media.gain = this.context.createGainNode();
			media.gain.gain.value = media.volume;

		}

		if ( !media.playing ) {

			media.source.loop = !!loop;

			media.source.connect(this.context.destination);
			media.source.noteOn(media.position);
			media.source.context.oncomplete = function ( ) {
				media.playing = false;
			};

			media.playing = true;

		}

	};

	/**
	 * Pause a sound clip. When you next call play this track will resume
	 * from the same point.
	 * @param  String   track The key name of the sound clip to play
	 */
	AudioManager.prototype.pause = function ( track ) {

		var media = this.files[track];

		if ( media.playing ) {

			media.position = media.source.context.currentTime;
			media.playing = false;

			media.source.disconnect();

		}

	};

	/**
	 * Stop a sound clip. When you next call play this track will begin
	 * at its beginning.
	 * @param  String   track The key name of the sound clip to play
	 */
	AudioManager.prototype.stop = function ( track ) {

		var media = this.files[track];

		this.pause(track);

		media.position = 0;

	};

	/**
	 * Set volume of a sound clip
	 * @param  String   track The key name of the sound clip to play
	 * @param  Number   level The gain level (from -1 to infinity, apparently)
	 */
	AudioManager.prototype.volume = function ( track, level ) {

		var media = this.files[track];

		media.gain.gain.value = level;
		media.volume = level;

		console.log("set volume: %s", level);

	};

}());
