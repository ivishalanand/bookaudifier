/*
* This is a reference to the new speechSynthesis object, 
* which is the entry point into using Web Speech API speech synthesis functionality.
* More info here: https://developer.mozilla.org/de/docs/Web/API/Window/speechSynthesis
*/
var synth = window.speechSynthesis;
var utterance = undefined;

var queries = new URLSearchParams(window.location.search);
var autoplay = queries.has("m");

/*
* When getVoices() is called for the first time it fires an async request to retrieve the voices.
* The onvoiceschanged event indicates that voices have been successfully retrieved.
* After the onvoiceschanged event fired getVoices() returns an array of SpeechSynthesisVoice
* https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice
*/
synth.onvoiceschanged = function() {
  voices = synth.getVoices();
  var select = document.getElementById("voiceSelect")
  for (i = 0; i < voices.length; i++) {
    var voice = voices[i];
    var option = document.createElement("option");
    var textnode = document.createTextNode(voice.name);
    option.appendChild(textnode);
    select.appendChild(option);
  }
};
var voices = synth.getVoices();

/*
* @function
* This function is called when the read/stop button is pressed.
*/
function play() {
  if(synth.paused) {
   document.getElementById("play-pause").className = "fas fa-play";
   document.getElementById("album-art-image").className = "";

   synth.resume();

  }

  //Check if we need to stop or start a utterance
  if (synth.speaking & !synth.paused) {
    synth.pause();
    document.getElementById("play-pause").className = "fas fa-play";
    document.getElementById("album-art-image").className = "";

  }
  else {

    document.getElementById("play-pause").className = "fas fa-pause";
    document.getElementById("album-art-image").className = "rotate";


    textChanged();

    //Initialize a new SpeechSynthesisUtterance object
    //All data provided below could also be passed via this constructor.
    utterance = new SpeechSynthesisUtterance();

    /*
    * Providing the text that shall be read.
    * The regex replaces any html tags,
    * which may not be necesary,
    * assuming you are providing a sanitized text.
    */
    var rawText = document.getElementById("text").innerHTML;
    var text = rawText.replace(/<[^>]*>/g, "");
    utterance.text = text;

    /*
    * Providing the voice that was chosen to read the text.
    * This can also be chosen via a language and the lang property.
    * The language should be passed as a BCP 47 language tag.
    * eg. utterance.lang = "en-US".
    *
    * Make sure to provide a fallback if voice is chosen via language,
    * as the number of supported languages is extremely limited as of right now.
    */
    var voice = document.getElementById("voiceSelect");
    var index = voice.selectedIndex;
    utterance.voice = voices[index];

    /*
    * Just passing the volume.
    * Nothing special here.
    */
    var volume = document.getElementById("volumeSlider");
    utterance.volume = volume.value;

    /*
    * Just passing the pitch.
    * Nothing special here.
    */
    utterance.pitch = 1

    /*
    * Just passing the speed.
    * Nothing special here.
    */
    var rate = document.getElementById("rateSlider");
    utterance.rate = rate.value;

    /*
    * This event fires whenever the TTS engine reaches a new boundary.
    * Usually that means the beginning of a word or sentence.
    * The event arguments contain the charIndex property,
    * which is equal to the index of the first letter of the current word.
    */
    var tag = document.getElementById('text');
    var doucumentLength = tag.innerText.length
    utterance.onboundary = function(event) {
      clearHighlight();
      var current = document.querySelectorAll("span[data-count='" + event.charIndex + "']")[0];
      if (current) {
        var percentage_finished = (event.charIndex + 1)/ doucumentLength * 100
        var width = Math.min(percentage_finished, 100) + '%';
        document.getElementById("seek-bar").style.width = width;
        if (percentage_finished >= 100 ) {
             document.getElementById("album-art-image").className = "";
        }

        current.classList.add("active");
      }
      // var voice = document.getElementById("voiceSelect");
      // var index = voice.selectedIndex;
      // utterance.voice = voices[index];
      // utterance = new SpeechSynthesisUtterance();
      // utterance.text = tag.innerText.substring(event.charIndex)
      // synth.speak(utterance);
    }

    utterance.onend = reset;

    /*
    * Be wary.
    * The speak method behaves differently in comparison to the Web Audio APIs play method,
    * The Synthesis object allows only one speech to be active at a time.
    * If you call the speak method, while another speech is active,
    * the new utterance will be queued and play once the active speech is finished.
    */
    synth.speak(utterance);
  }
}

function reset() {
  document.getElementById("play-pause").className = "fas fa-play";
  synth.cancel();
  clearHighlight();
}

/*
* @function
* Removes the .active CSS class from all spans.
* The active class, is a visual indication for
* which word is currently being spoken by the TTS engine.
*/
function clearHighlight() {
  var elems = document.querySelectorAll("span[data-count]");
  elems.forEach(function(element) {
    element.classList.remove("active");
  });
}

/*
* @function
* Parses the text and wraps all words in spans, with the additional dataset property data-index.
* Data-index contains the words first letters charIndex relative to the beginning of the entire text.
* This allows us to highlight the currently spoken word, by refering to the respective span via
* The onboundary events charIndex property.
*
* This function should be called once on the initial pageload
* and whenever the text changes.
*/

function textChanged() {
  var counter = 0;
  var editor = document.getElementById("text");
  var text = editor.innerHTML.replace(/<[^>]*>/g, "");
  text = text.split(" ");
  var wrappedText = [];
  for (i = 0; i < text.length; i++) {
    var word = text[i];
    var inc = word.length + 1;
    word = "<span data-count='" + counter + "'>" + word + "</span>";
    counter += inc;
    wrappedText.push(word);
  }
  wrappedText = wrappedText.join(" ");
  editor.innerHTML = wrappedText;
}
textChanged();



/*
* Finally we make sure to dequeue all utterances if the user leaves the site.
* If we dont the buffered TTS Speech will continue even if the user presses the back button.
*/
window.onbeforeunload = function (e) {
  synth.cancel();
};

if (autoplay) {
  var text = document.getElementById("text");
  text.innerHTML = decodeURIComponent(queries.get("m"));
  play();
}

function createLink() {
  document.getElementById("overlay").style.display = "flex";
  var editor = document.getElementById("text");
  var text = editor.innerHTML.replace(/<[^>]*>/g, "");
  var urlEncoded = encodeURIComponent(text);;
  document.getElementById("shareLink").value = "https://codepen.io/Viket/pen/yPNaXg?m=" + urlEncoded;
}

function closeOverlay() {
  document.getElementById("overlay").style.display = "none";
}


document.getElementById('voiceSelect').addEventListener('change', function() {
  var voice = document.getElementById("voiceSelect");
  var index = voice.selectedIndex;
  synth.pause()
  utterance.voice = voices[index];
  synth.resume()
});




// $(function()
// {
//     var playerTrack = $("#player-track"), bgArtwork = $('#bg-artwork'), bgArtworkUrl, albumName = $('#album-name'), trackName = $('#track-name'), albumArt = $('#album-art'), sArea = $('#s-area'), seekBar = $('#seek-bar'), trackTime = $('#track-time'), insTime = $('#ins-time'), sHover = $('#s-hover'), playPauseButton = $("#play-pause-button"),  i = playPauseButton.find('i'), tProgress = $('#current-time'), tTime = $('#track-length'), seekT, seekLoc, seekBarPos, cM, ctMinutes, ctSeconds, curMinutes, curSeconds, durMinutes, durSeconds, playProgress, bTime, nTime = 0, buffInterval = null, tFlag = false, albums = ['Dawn','Me & You','Electro Boy','Home','Proxy (Original Mix)'], trackNames = ['Skylike - Dawn','Alex Skrindo - Me & You','Kaaze - Electro Boy','Jordan Schor - Home','Martin Garrix - Proxy'], albumArtworks = ['_1','_2','_3','_4','_5'], trackUrl = ['https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/2.mp3','https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/1.mp3','https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/3.mp3','https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/4.mp3','https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/5.mp3'], playPreviousTrackButton = $('#play-previous'), playNextTrackButton = $('#play-next'), currIndex = -1;

//     function playPause()
//     {
//         setTimeout(function()
//         {
//             if(audio.paused)
//             {
//                 albumArt.addClass('active');
//                 checkBuffering();
//                 i.attr('class','fas fa-pause');
//                 audio.play();
//             }
//             else
//             {
//                 albumArt.removeClass('active');
//                 clearInterval(buffInterval);
//                 albumArt.removeClass('buffering');
//                 i.attr('class','fas fa-play');
//                 audio.pause();
//             }
//         },300);
//     }


//     function showHover(event)
//     {
//         seekBarPos = sArea.offset();
//         seekT = event.clientX - seekBarPos.left;
//         seekLoc = audio.duration * (seekT / sArea.outerWidth());

//         sHover.width(seekT);

//         cM = seekLoc / 60;

//         ctMinutes = Math.floor(cM);
//         ctSeconds = Math.floor(seekLoc - ctMinutes * 60);

//         if( (ctMinutes < 0) || (ctSeconds < 0) )
//             return;

//         if( (ctMinutes < 0) || (ctSeconds < 0) )
//             return;

//         if(ctMinutes < 10)
//             ctMinutes = '0'+ctMinutes;
//         if(ctSeconds < 10)
//             ctSeconds = '0'+ctSeconds;

//         if( isNaN(ctMinutes) || isNaN(ctSeconds) )
//             insTime.text('--:--');
//         else
//             insTime.text(ctMinutes+':'+ctSeconds);

//         insTime.css(-).fadeIn(0);

//     }

//     function hideHover()
//     {
//         sHover.width(0);
//         insTime.text('00:00').css({'left':'0px','margin-left':'0px'}).fadeOut(0);
//     }

//     function playFromClickedPos()
//     {
//         audio.currentTime = seekLoc;
//         seekBar.width(seekT);
//         hideHover();
//     }

//     function updateCurrTime()
//     {
//         nTime = new Date();
//         nTime = nTime.getTime();

//         if( !tFlag )
//         {
//             tFlag = true;
//             trackTime.addClass('active');
//         }

//         curMinutes = Math.floor(audio.currentTime / 60);
//         curSeconds = Math.floor(audio.currentTime - curMinutes * 60);

//         durMinutes = Math.floor(audio.duration / 60);
//         durSeconds = Math.floor(audio.duration - durMinutes * 60);

//         playProgress = (audio.currentTime / audio.duration) * 100;

//         if(curMinutes < 10)
//             curMinutes = '0'+curMinutes;
//         if(curSeconds < 10)
//             curSeconds = '0'+curSeconds;

//         if(durMinutes < 10)
//             durMinutes = '0'+durMinutes;
//         if(durSeconds < 10)
//             durSeconds = '0'+durSeconds;

//         if( isNaN(curMinutes) || isNaN(curSeconds) )
//             tProgress.text('00:00');
//         else
//             tProgress.text(curMinutes+':'+curSeconds);

//         if( isNaN(durMinutes) || isNaN(durSeconds) )
//             tTime.text('00:00');
//         else
//             tTime.text(durMinutes+':'+durSeconds);

//         if( isNaN(curMinutes) || isNaN(curSeconds) || isNaN(durMinutes) || isNaN(durSeconds) )
//             trackTime.removeClass('active');
//         else
//             trackTime.addClass('active');


//         seekBar.width(playProgress+'%');

//         if( playProgress == 100 )
//         {
//             i.attr('class','fa fa-play');
//             seekBar.width(0);
//             tProgress.text('00:00');
//             albumArt.removeClass('buffering').removeClass('active');
//             clearInterval(buffInterval);
//         }
//     }

//     function checkBuffering()
//     {
//         clearInterval(buffInterval);
//         buffInterval = setInterval(function()
//         {
//             if( (nTime == 0) || (bTime - nTime) > 1000  )
//                 albumArt.addClass('buffering');
//             else
//                 albumArt.removeClass('buffering');

//             bTime = new Date();
//             bTime = bTime.getTime();

//         },100);
//     }

//     function selectTrack(flag)
//     {
//         if( flag == 0 || flag == 1 )
//             ++currIndex;
//         else
//             --currIndex;

//         if( (currIndex > -1) && (currIndex < albumArtworks.length) )
//         {
//             if( flag == 0 )
//                 i.attr('class','fa fa-play');
//             else
//             {
//                 albumArt.removeClass('buffering');
//                 i.attr('class','fa fa-pause');
//             }

//             seekBar.width(0);
//             trackTime.removeClass('active');
//             tProgress.text('00:00');
//             tTime.text('00:00');

//             currAlbum = albums[currIndex];
//             currTrackName = trackNames[currIndex];
//             currArtwork = albumArtworks[currIndex];

//             audio.src = trackUrl[currIndex];

//             nTime = 0;
//             bTime = new Date();
//             bTime = bTime.getTime();

//             if(flag != 0)
//             {
//                 audio.play();
//                 playerTrack.addClass('active');
//                 albumArt.addClass('active');

//                 clearInterval(buffInterval);
//                 checkBuffering();
//             }

//             albumName.text(currAlbum);
//             trackName.text(currTrackName);
//             albumArt.find('img.active').removeClass('active');
//             $('#'+currArtwork).addClass('active');

//             bgArtworkUrl = $('#'+currArtwork).attr('src');

//             bgArtwork.css({'background-image':'url('+bgArtworkUrl+')'});
//         }
//         else
//         {
//             if( flag == 0 || flag == 1 )
//                 --currIndex;
//             else
//                 ++currIndex;
//         }
//     }

//     function initPlayer()
//     {
//         audio = new Audio();

//         selectTrack(0);

//         audio.loop = false;

//         playPauseButton.on('click',playPause);

//         sArea.mousemove(function(event){ showHover(event); });

//         sArea.mouseout(hideHover);

//         sArea.on('click',playFromClickedPos);

//         $(audio).on('timeupdate',updateCurrTime);

//         playPreviousTrackButton.on('click',function(){ selectTrack(-1);} );
//         playNextTrackButton.on('click',function(){ selectTrack(1);});
//     }

//     initPlayer();
// })
