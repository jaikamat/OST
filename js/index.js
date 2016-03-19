// ### This program uses experimental technology for getUserMedia
// ### Be sure to set chrome flags to enable experimental web technology including
// enabling programmatic audio api playback and
// also serve this page securely over https using ngrok

function init () {
  var videoSource = null;
  var devicesArray = null;
  var constraints = {};

  navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;


  // ### IMPORTANT: this assumes that the device has only two camera inputs -
  // [0], the user-facing camera and [1], the environment camera
  // IMPORTANT: This only works with my android tablet
  // if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
  //     navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
  // }
  // if (!navigator.enumerateDevices && navigator.mediaDevices.enumerateDevices) {
  //     navigator.enumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator);
  // }
  // if (!navigator.enumerateDevices) {
  //     failureCallback(null, 'Neither navigator.mediaDevices.enumerateDevices NOR MediaStreamTrack.getSources are available.');
  //     return;
  // }

  if (window.matchMedia('(min-width: 800px)').matches) {
  /* the viewport is at least 800 pixels wide */
    navigator.mediaDevices.enumerateDevices()
    .then(function (devices) {
      devicesArray = devices.filter(function (element) {
        return element.kind === 'videoinput';
      })
      // constraints.video = { exact: devicesArray[0].deviceId };
      devicesArray.forEach(function (element) {
        text += element.kind + ": " + element.deviceId + "  " 
      })
      videosrctext.textContent = text;

      // constraints.video = { optional: [{ sourceId: devicesArray[0].deviceId }] };
      constraints.video = { mandatory: { sourceId: devicesArray[0].deviceId } };

      console.log("VIDEO CONSTRAINTS", constraints.video);
      return navigator.mediaDevices.getUserMedia(constraints)
    })
    .then(function(stream) {
      console.log("STREAM", stream)
      window.stream = stream; // make stream available to console
      video.src = window.URL.createObjectURL(stream);
      video.onloadedmetadata = function(e) {
        video.play();
      };
    })
    .catch(function (error) {
      console.log('ERROR WITH GETUSERMEDIA', error)
    });

  } else {

    MediaStreamTrack.getSources(function (devices) {

      var filteredDevices = devices.filter(function (element) {
        return element.kind === 'video';
      })
      filteredDevices.forEach(function (element) {
        text += element.kind + ": " + element.id + "  " 
      })
      videosrctext.textContent = text;
      console.log('FROM MEDIASTREAMTRACK',filteredDevices);

      constraints.audio = false;
      constraints.video = { mandatory: { sourceId : filteredDevices[1].id } }

      function successCallback(stream) {
        window.stream = stream; // stream available to console
        if (window.URL) {
          video.src = window.URL.createObjectURL(stream);
          video.play();
        } else {
          video.src = stream;
          video.play();
        }
      }

      function errorCallback(error) {
        console.log('navigator.getUserMedia error: ', error);
      }

      navigator.getUserMedia(constraints, successCallback, errorCallback);

    });
  }
};


function getFromEchoNest (genre, min_energy, max_energy, numSongs) {
  console.log('MAKING ECHO NEST CALL');
  return new Promise(function (resolve, reject) {
    $.ajax('https://developer.echonest.com/api/v4/song/search?api_key=3VXYUTNRMXWHHYCMZ&format=json&style=' + genre + '&min_energy=' + min_energy + '&max_energy=' + max_energy + '&results=' + numSongs + '&bucket=id:spotify&bucket=tracks&limit=true', {
      success: function (data) {
        resolve(data.response);
      },
      error: function (error) {
        reject(error);
      }
    })
  });
}

function getFromSpotify (songId) {
  console.log('MAKING SPOTIFY CALL');
  return new Promise(function (resolve, reject) {
    $.ajax('https://api.spotify.com/v1/tracks/' + songId, {
      success: function (data) {
        resolve(data);
      },
      error: function (error) {
        reject(error);
      }
    })
  });
}

function timerCallback () {
  if (!this.video.playing && this.makeCall) {
    console.log('waiting')
  }
  setInterval(function () {
    // var sourceImage = this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    var colorThief = new ColorThief();
    var rgb = colorThief.getColor(this.video);

    var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

    if (this.HSLdata.length < 3) this.HSLdata.push(hsl);
    else if (this.HSLdata.length >= 3) {
      this.HSLdata.shift();
      this.HSLdata.push(hsl); 
    }

    var avgHSL = averageHSL(this.HSLdata);

    if (this.audio.paused && this.makeCall) {
      this.makeCall = false;
      console.log('music is not playing!');

      getFromEchoNest('techno', avgHSL[1]/100, (avgHSL[1] + 10)/100, 25) // use sat value here, divide by 100?
      .then(function (response) {
        // get random song
        var index = ~~(Math.random() * response.songs.length);

        console.log(response.songs[index].tracks[0].foreign_id);
        return response.songs[index].tracks[0].foreign_id;
      })
      .then(function (songString) {
        var songId = songString.slice(14);
        console.log(songId);
        return getFromSpotify(songId)
      })
      .then(function (spotifyResponse) {
        console.log("SPOTIFY RESPONSE >>>>>>>>>>>>>>>>",spotifyResponse);
        this.audio.src = spotifyResponse.preview_url;
        if (spotifyResponse.preview_url !== null) {
          this.audio.play(); 
        }
        this.makeCall = true;   
      })
      .then(null, function (error) {
        console.error(error);
      })
    }

    // console.log("AVERAGE HSL", averageHSL(this.HSLdata));
    this.swatch.style.backgroundColor = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    // this.HSLtext.textContent = 'H: ' + hsl[0] + ', S: ' + hsl[1] + ', L: ' + hsl[2];

  }, 20);
}

function averageHSL (array) {
  var len = array.length;
  var h = 0;
  var s = 0;
  var l = 0;

  array.forEach(function (element) {
    h += element[0];
    s += element[1];
    l += element[2];
  })

  return [~~(h/len), ~~(s/len), ~~(l/len)]
}

function rgbToHsl (r, g, b) {
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  }else{
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }
  var data = [Math.floor(h*360), Math.floor(s*100), Math.floor(l*100)];
  return data;
}

function setup () {
  this.audio = document.getElementById('audio');
  this.canvas = document.getElementById('inputCanvas');
  this.video = document.getElementById('inputVideo');
  this.canvasContext = this.canvas.getContext('2d');
  this.swatch = document.getElementById('swatch');
  this.HSLtext = document.getElementById('HSLtext');
  this.videosrctext = document.getElementById('videosrctext');
  this.HSLdata = [];
  this.testArray = [];
  this.previousHSL = null;
  this.timeCount = 0;
  this.makeCall = true;
}

window.onload = function () {
  setup();
  init();
  // add an event listener for PLAYING that calls this callback function!
  timerCallback();

  // JQuery Mobile detects if the window supports tap or click
  var tapOrClick = $.support.touch ? "tap" : "click";
}

