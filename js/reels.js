let utterance = null;

function startWords() {
  const input = document.getElementById("overlayInput").value.trim();
  const textEl = document.getElementById("text");
  const videoSelect = document.getElementById("videoSelect");
  const videoFrame = document.getElementById("videoFrame");

  if (!input) {
    textEl.textContent = "Overlay Text";
    return;
  }

  const selectedVideo = videoSelect.value;
  videoFrame.src = selectedVideo + "&autoplay=1";

  window.speechSynthesis.cancel();

  const words = input.split(/\s+/);
  const wordPositions = [];
  let searchStart = 0;

  for (const word of words) {
    const start = input.indexOf(word, searchStart);
    const end = start + word.length;
    wordPositions.push({ word, start, end });
    searchStart = end;
  }

  textEl.textContent = words[0];

  utterance = new SpeechSynthesisUtterance(input);

  utterance.onboundary = (event) => {
    if (event.name !== "word") return;

    const charIndex = event.charIndex;

    const current = wordPositions.find(
      (item) => charIndex >= item.start && charIndex < item.end
    );

    if (current) {
      textEl.textContent = current.word;
    }
  };

  window.speechSynthesis.speak(utterance);
}