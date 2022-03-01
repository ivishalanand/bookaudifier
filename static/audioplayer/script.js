function qs(s) { return document.querySelector(s) }

var MASTERTEXT;
var texttospeak;
var textbeingspoken;
var countWords;
var lengthText;
var marker;
var range;
var speechtext;
var firstBoundary;
var chapterMemory;

function initialise() {
MASTERTEXT = document.getElementById('mastertext').textContent;
document.getElementById('texttospeak').textContent = MASTERTEXT
texttospeak = document.getElementById('texttospeak');
lengthText = MASTERTEXT.trim().split(/\s+/g).length;
textbeingspoken = document.getElementById('textbeingspoken');
marker = document.getElementById('marker');
range = document.createRange();
speechtext;
firstBoundary;
countWords = 0;
}

initialise();


var voices = [];
var englishVoices = []
var j = 0
function populateVoiceList() {
  voices = window.speechSynthesis.getVoices();
  var selectElm = document.querySelector('#voice');
  selectElm.innerHTML = '';
  for (var i=0;i < voices.length;i++) {
    if (voices[i].lang.slice(0,2) == 'en') {
      englishVoices[j] = voices[i];
      j++;
      var option = document.createElement('option');
      option.innerHTML = voices[i].name;
      // selecting default nice voice
      if (voices[i].name == "Alex") {
        option.setAttribute('selected', true);
      }
      option.setAttribute('value', voices[i].voiceURI);
      option.voice = voices[i];
      if (voices[i].default)
        option.selected = true;
      selectElm.appendChild(option);
    }
  }
}

populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined)
  speechSynthesis.onvoiceschanged = populateVoiceList;

function stop() {
  speechSynthesis.cancel();
}

function playpause() {
  if (speechSynthesis.paused)
    speechSynthesis.resume();
  if (speechSynthesis.speaking & !speechSynthesis.paused) {
    speechSynthesis.pause();
  }
  else
    speak();
}

function speak() {
  speechtext = texttospeak.value;
  firstBoundary = true;
  textbeingspoken.textContent = speechtext;

  utterance = new SpeechSynthesisUtterance(
    document.getElementById('texttospeak').value);
  utterance.voice = englishVoices[document.getElementById('voice').selectedIndex];
  utterance.volume = 1;
  utterance.pitch = 1;
  var rate = parseFloat(document.getElementById("rate").value);
  utterance.rate = rate;
  utterance.addEventListener('start', function () {
    marker.classList.remove('animate');
    document.body.classList.add('speaking');
  });
  utterance.addEventListener('start', handleSpeechEvent);
  utterance.addEventListener('end', handleSpeechEvent);
  utterance.addEventListener('error', handleSpeechEvent);
  utterance.addEventListener('boundary', handleSpeechEvent);
  utterance.addEventListener('pause', handleSpeechEvent);
  utterance.addEventListener('resume', handleSpeechEvent);

  speechSynthesis.speak(utterance);
}

function handleSpeechEvent(e) {
  switch (e.type) {
    case 'start':
    marker.classList.remove('animate');
    document.body.classList.add('speaking');
    break;
    case 'end':
    case 'endEvent':
    case 'error':
    document.body.classList.remove('speaking');
    marker.classList.remove('moved');
    break;
    case 'boundary':
    {
      if (countWords < lengthText) {
        countWords = countWords + 1
        percentage = (countWords*100)/lengthText
        progressbar.style.width = percentage + '%';
        progressbar.setAttribute('aria-valuenow', percentage);
        // document.getElementById("audio").value=percentage
      }
      if (e.name != 'word')
        break;
      var substr = speechtext.slice(e.charIndex);
      var rex = /\S+/g;
      var res = rex.exec(substr);
      if (!res) return;
      var startOffset = res.index + e.charIndex;
      var endOffset = rex.lastIndex + e.charIndex;
      range.setStart(textbeingspoken.firstChild, startOffset);
      range.setEnd(textbeingspoken.firstChild, endOffset);
      var rect = range.getBoundingClientRect();
      var delta = 0;
      // do I need to scroll?
      var parentRect = textbeingspoken.getBoundingClientRect();
      if (rect.bottom > parentRect.bottom) {
        delta = rect.bottom - parentRect.bottom;
      }
      if (rect.top < parentRect.top) {
        delta = rect.top - parentRect.top;
      }

      textbeingspoken.scrollTop += delta;
      texttospeak.scrollTop = textbeingspoken.scrollTop;

      marker.style.top = rect.top - delta - 1;
      marker.style.left = rect.left - 1;
      marker.style.width = rect.width + 1;
      marker.style.height = rect.height + 1;
      marker.classList.add('moved');
      if (firstBoundary) {
        firstBoundary = false;
        marker.classList.add('animate');
      }
      break;
      utterance.onend = reset;
    }
    default:
    break;
  }
}

const voiceElement = document.getElementById('voice');
voiceElement.addEventListener('change', (event) => {
  texttospeak.textContent = MASTERTEXT.trim().split(/\s+/g).slice(countWords-1).join(' ');
  speechSynthesis.cancel()
  if (!document.getElementById('pause-btn').classList.contains("inactive")) {
    speak();
  }

});

const rateElement = document.getElementById('rate');
rateElement.addEventListener('change', (event) => {
  // added so that on changing the speed the first time the text to speak does not change
  countWords = Math.max(countWords, 1)
  texttospeak.textContent = MASTERTEXT.trim().split(/\s+/g).slice(countWords-1).join(' ');
  speechSynthesis.cancel()
  if (!document.getElementById('pause-btn').classList.contains("inactive")) {
    speak();
  }
});

const playElement = document.getElementById('play-btn');
playElement.addEventListener('click', (event) => {
  document.getElementById('play-btn').classList = "play inactive";
  document.getElementById('pause-btn').classList = "pause";
  if (speechSynthesis.speaking == false) {
    speechSynthesis.cancel();
    speak();
  }
  else {
    playpause();
  }
});

const pauseElement = document.getElementById('pause-btn');
pauseElement.addEventListener('click', (event) => {
  document.getElementById('pause-btn').classList = "pause inactive";
  document.getElementById('play-btn').classList = "play";
  playpause();
});

document.getElementById('play-btn').addEventListener('click', (event) => {
  document.getElementById('play-btn').classList = "play inactive"
  document.getElementById('pause-btn').classList = "pause"
});

var handle = qs('.seekbar input[type="range"]');
var progressbar = qs('.seekbar div[role="progressbar"]');

handle.addEventListener('input', function(){
  progressbar.style.width = this.value + '%';
  progressbar.setAttribute('aria-valuenow', this.value);
  speakfromindex = this.value*lengthText/100;
  countWords = parseInt(speakfromindex);
  texttospeak.textContent = MASTERTEXT.trim().split(/\s+/g).slice(speakfromindex).join(' ');
  speechSynthesis.cancel();
  if (!document.getElementById('pause-btn').classList.contains("inactive")) {
    speak();
  }
});

/*
* Finally we make sure to dequeue all utterances if the user leaves the site.
* If we dont the buffered TTS Speech will continue even if the user presses the back button.
*/
window.onbeforeunload = function (e) {
  synth.cancel();
};

function removeChapterHighlight(memory) {
    previouslyClickedChapterId = "list-" + memory;
    document.getElementById(previouslyClickedChapterId).style =  "cursor: pointer; display: block; margin: 0; padding: 5px 0;";
}

function changeReadingText(el) {
  if (chapterMemory != 0) {
      previouslyClickedChapterId = "list-" + chapterMemory;
      document.getElementById(previouslyClickedChapterId).style =  "cursor: pointer; display: block; margin: 0; padding: 5px 0;";
  }
  var text = el.querySelectorAll("div")[3].textContent;
  chapterMemory = parseInt(el.getAttribute("id").split("-")[1]);
  document.getElementById("mastertext").innerText = text;
  document.getElementById('play-btn').classList = "play inactive";
  document.getElementById('pause-btn').classList = "pause";
  initialise();
  speechSynthesis.cancel();
  speak();
//  highlighting the current chapter
  el.style = "background-color: #d5bdec; border-radius: 10px; box-shadow: 5px 5px 10px rgb(0 0 0 / 20%); padding: 6px 2px;"
  }

const forwardElement = document.getElementById('forward-btn');
forwardElement.addEventListener('click', (event) => {
  removeChapterHighlight(chapterMemory);
  totalChapter = document.getElementById("plList").getElementsByTagName("li").length;
  if (chapterMemory < totalChapter) {
    chapterMemory = chapterMemory + 1;
  }
  nextChapterId = "list-" + String(chapterMemory);
  nextChapter = document.getElementById(nextChapterId);
  changeReadingText(nextChapter);
});


const backwardElement = document.getElementById('backward-btn');
backwardElement.addEventListener('click', (event) => {
  removeChapterHighlight(chapterMemory);
  if (chapterMemory >1 ){
    chapterMemory = chapterMemory - 1;
  }
  nextChapterId = "list-" + String(chapterMemory);
  nextChapter = document.getElementById(nextChapterId);
  changeReadingText(nextChapter);
});

function startFirstChapter() {
    chapterMemory =1;
    document.getElementById("list-1").style = "background-color: #d5bdec; border-radius: 10px; box-shadow: 5px 5px 10px rgb(0 0 0 / 20%); padding: 6px 2px;";
}

startFirstChapter();









