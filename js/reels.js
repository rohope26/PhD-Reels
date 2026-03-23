let intervalId;

function startWords() {
  clearInterval(intervalId);

  const input = document.getElementById("overlayInput").value.trim();
  const textEl = document.getElementById("text");

  const words = input.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += 1) {
    chunks.push(words.slice(i, i + 1).join(" "));
  }

  let index = 0;
  function speakWord(word) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      window.speechSynthesis.speak(utter);
    }
  }

  textEl.textContent = chunks[index];
  speakWord(chunks[index]);

  intervalId = setInterval(() => {
    index++;
    if (index < chunks.length) {
      textEl.textContent = chunks[index];
      speakWord(chunks[index]);
    } else {
      clearInterval(intervalId);
    }
  }, 1000);
}