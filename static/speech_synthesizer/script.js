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
    var textnode = document.createTextNode(voice.name + ' [' + voice.lang + ']');
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
   document.getElementById("play-pause").className = "fas fa-pause";
   document.getElementById("album-art-image").className = "rotate";

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
    var wordCount = document.getElementsByClassName("words").length
    var documentLength = parseInt(document.getElementsByClassName("words")[wordCount-1].dataset["count"])
    utterance.onboundary = function(event) {
      clearHighlight();
      var current = document.querySelectorAll("span[data-count='" + event.charIndex + "']")[0];
      var percentage_finished = (event.charIndex + 1)/ documentLength * 100
      var width = Math.min(percentage_finished, 100) + '%';
      document.getElementById("seek-bar").style.width = width;
      if (percentage_finished >= 100 ) {
           document.getElementById("album-art-image").className = "";
      }

      current.classList.add("active");

      // var voice = document.getElementById("voiceSelect");
      // var index = voice.selectedIndex;
      // utterance.voice = voices[index];
      // utterance = new SpeechSynthesisUtterance();
      // utterance.text = tag.innerText.substring(event.charIndex)
      // synth.speak(utterance);
    }

//    utterance.onend = reset;

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
  document.getElementById("album-art-image").className = "";
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
  var raw_text = editor.innerHTML.replace(/<[^>]*>/g, " ");
  var tab_removed = raw_text.replace(/\t/g," "); // removed \t
  var new_line_removed = tab_removed.replace(/\n/g," "); // removed \n
  var removed_special_char = new_line_removed.replace(/[^a-zA-Z0-9.,-: ]/g, "");

  var text = removed_special_char.replace(/ +(?= )/g,''); //remove multiple spaces with single space

  var text =  text.concat(" .");
  text = text.split(" ");
  var wrappedText = [];
  for (i = 0; i < text.length; i++) {
    var word = text[i];
    var inc = word.length + 1;
    word = "<span data-count='" + counter + "' class='words'>" + word + "</span>";
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

function changeReadingText(el) {
  var text = el.textContent;
  document.getElementById("text").innerText = text;
  reset()
  play()
}