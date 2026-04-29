import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import * as Slider from "@radix-ui/react-slider";
import { Check, ChevronDown, Play } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

const templates = [
  {
    title: "Minecraft Obby",
    description: "Fast jumps and clean contrast",
    videoId: "u7kdVe8q5zs",
    params: "si=hupChMPSgELPU0zj&mute=1"
  },
  {
    title: "Subway Surfers",
    description: "Classic endless-run pacing",
    videoId: "vTfD20dbxho",
    params: "si=toqjWDQ8z60gVynz&mute=1"
  },
  {
    title: "Survival Chance",
    description: "High tension and sharp motion",
    videoId: "F3dKWgNu1FY",
    params: "si=I9yfs-C9C4jZWiou&mute=1"
  },
  {
    title: "Steel Coil vs Bus",
    description: "Heavy impact visual payoff",
    videoId: "2N_R5f5jEeQ",
    params: "si=OMhKFvyzSHU0iNMl&mute=1"
  },
  {
    title: "CS:GO Surfing",
    description: "Fast-paced action and precise movements",
    videoId: "kuPPZCtLX4w",
    params: "si=mvwLucHKxetWMhnD&mute=1&start=5"
  },
  {
    title: "GTA Mega Ramp",
    description: "A massive ramp in Grand Theft Auto",
    videoId: "ZtLrNBdXT7M",
    params: "si=fuO-USm5uUp157uy&mute=1&start=5"
  },
  {
    title: "Jetpack Joyride",
    description: "Jetpack Joyride gameplay",
    videoId: "49weG3guCLA",
    params: "si=LR3v5F0cmIJqFUrV&mute=1"
  }
];

function buildEmbedUrl(template, autoplay = false, loop = false) {
  const autoplayParam = autoplay ? "&autoplay=1" : "";
  const loopParam = loop ? `&loop=1&playlist=${template.videoId}` : "";
  return `https://www.youtube.com/embed/${template.videoId}?${template.params}&enablejsapi=1&playsinline=1${autoplayParam}${loopParam}`;
}

function getWordPositions(input) {
  const words = input.split(/\s+/);
  const wordPositions = [];
  let searchStart = 0;

  for (const word of words) {
    const start = input.indexOf(word, searchStart);
    const end = start + word.length;
    wordPositions.push({ word, start, end });
    searchStart = end;
  }

  return { words, wordPositions };
}

function App() {
  const [scriptText, setScriptText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState("0");
  const [speed, setSpeed] = useState(1);
  const [caption, setCaption] = useState("Overlay Text");
  const [embedUrl, setEmbedUrl] = useState(() => buildEmbedUrl(templates[0]));
  const narrationRunIdRef = useRef(0);
  const reelIsPlayingRef = useRef(false);
  const inputRef = useRef(null);

  const selectedTemplate = templates[Number(selectedIndex)];
  const duplicatedTemplates = useMemo(() => [...templates, ...templates], []);
  const trimmedScript = scriptText.trim();
  const wordCount = trimmedScript ? trimmedScript.split(/\s+/).length : 0;
  const charCount = trimmedScript.length;

  const guidance = useMemo(() => {
    if (!trimmedScript) {
      return {
        text: "Add a short voiceover script to preview word-by-word captions.",
        tone: ""
      };
    }

    if (wordCount < 8 || charCount < 40) {
      return {
        text: "A little short. Add more context so the reel feels complete.",
        tone: "is-warn"
      };
    }

    if (wordCount <= 40) {
      return {
        text: "Looks good for a short reel voiceover.",
        tone: "is-good"
      };
    }

    if (wordCount <= 80) {
      return {
        text: "Longer, but usable. The video will stay active until the narration ends.",
        tone: "is-warn"
      };
    }

    return {
      text: "Long script detected. The reel will run for the full narration.",
      tone: "is-warn"
    };
  }, [charCount, trimmedScript, wordCount]);

  function setVideo(template, autoplay = false) {
    setEmbedUrl(buildEmbedUrl(template, autoplay, autoplay));
  }

  useEffect(() => {
    window.speechSynthesis?.cancel();
    reelIsPlayingRef.current = false;
    setVideo(selectedTemplate, false);
  }, [selectedTemplate]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function startWords() {
    const input = scriptText.trim();

    if (!input) {
      setCaption("Overlay Text");
      inputRef.current?.focus();
      return;
    }

    narrationRunIdRef.current += 1;
    const currentRunId = narrationRunIdRef.current;
    reelIsPlayingRef.current = true;
    window.speechSynthesis.cancel();
    setVideo(selectedTemplate, true);

    const { words, wordPositions } = getWordPositions(input);
    setCaption(words[0]);

    const utterance = new SpeechSynthesisUtterance(input);
    utterance.rate = speed;

    utterance.onboundary = (event) => {
      if (event.name !== "word") return;

      const current = wordPositions.find(
        (item) => event.charIndex >= item.start && event.charIndex < item.end
      );

      if (current) setCaption(current.word);
    };

    utterance.onend = () => {
      if (currentRunId !== narrationRunIdRef.current) return;

      reelIsPlayingRef.current = false;
      setVideo(selectedTemplate, false);
      setCaption(words[words.length - 1]);
    };

    utterance.onerror = () => {
      if (currentRunId !== narrationRunIdRef.current) return;

      reelIsPlayingRef.current = false;
      setVideo(selectedTemplate, false);
    };

    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="page-shell">
      <section className="composer-card" aria-label="Reel generator">
        <div className="field-group">
          <div className="field-heading">
            <Label.Root className="field-label" htmlFor="overlayInput">
              Text
            </Label.Root>
          </div>

          <div className="textarea-wrap">
            <textarea
              id="overlayInput"
              ref={inputRef}
              className="script-input"
              rows="6"
              placeholder="Enter your reading here..."
              value={scriptText}
              onChange={(event) => setScriptText(event.target.value)}
            />
          </div>

          <div className="guidance-row" aria-live="polite">
            <p className={`guidance-text ${guidance.tone}`}>{guidance.text}</p>
            <p className="guidance-count">
              {wordCount} words / {charCount} characters
            </p>
          </div>
        </div>

        <div className="control-grid">
          <div className="field-group">
            <Label.Root className="field-label" htmlFor="videoSelect">
              Video
            </Label.Root>
            <Select.Root value={selectedIndex} onValueChange={setSelectedIndex}>
              <Select.Trigger id="videoSelect" className="control-select" aria-label="Choose a video template">
                <Select.Value />
                <Select.Icon className="select-icon">
                  <ChevronDown size={18} strokeWidth={2.4} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="select-content" position="popper" sideOffset={8}>
                  <Select.Viewport className="select-viewport">
                    {templates.map((template, index) => (
                      <Select.Item className="select-item" key={template.videoId} value={String(index)}>
                        <Select.ItemText>{template.title}</Select.ItemText>
                        <Select.ItemIndicator className="select-item-indicator">
                          <Check size={16} strokeWidth={2.6} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div className="field-group">
            <div className="speed-label-row">
              <Label.Root className="field-label" htmlFor="speedRange">
                Playback Speed
              </Label.Root>
              <span className="speed-value">{speed.toFixed(1)}x</span>
            </div>
            <div className="slider-wrap">
              <Slider.Root
                id="speedRange"
                className="speed-slider"
                min={0.5}
                max={2}
                step={0.25}
                value={[speed]}
                onValueChange={([value]) => setSpeed(value)}
                style={{ "--fill-percent": `${((speed - 0.5) / 1.5) * 100}%` }}
              >
                <Slider.Track className="speed-slider-track">
                  <Slider.Range className="speed-slider-range" />
                </Slider.Track>
                <Slider.Thumb className="speed-slider-thumb" aria-label="Playback speed" />
              </Slider.Root>
              <div className="slider-scale" aria-hidden="true">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>1.5x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>
        </div>

        <button className="generate-button" type="button" onClick={startWords}>
          <Play size={19} fill="currentColor" aria-hidden="true" />
          <span>Generate Reel</span>
        </button>

        <section className="template-rail" aria-label="Video options">
          <div className="template-rail-head">
            <h2>Video Options</h2>
          </div>
          <div className="rail-window">
            <div className="thumbnail-track">
              {duplicatedTemplates.map((template, duplicateIndex) => {
                const actualIndex = duplicateIndex % templates.length;

                return (
                  <button
                    className={`thumb-card ${Number(selectedIndex) === actualIndex ? "is-active" : ""}`}
                    key={`${template.videoId}-${duplicateIndex}`}
                    type="button"
                    aria-label={`Select ${template.title}`}
                    onClick={() => setSelectedIndex(String(actualIndex))}
                  >
                    <span
                      className="thumb-media"
                      style={{
                        backgroundImage: `url("https://img.youtube.com/vi/${template.videoId}/hqdefault.jpg")`
                      }}
                    />
                    <span className="thumb-meta">
                      <span className="thumb-title">{template.title}</span>
                      <span className="thumb-copy">{template.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </section>

      <section className="preview-card" aria-label="Reel preview">
        <AspectRatio.Root className="video-wrapper" ratio={9 / 16}>
          <iframe
            key={embedUrl}
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <div className="caption-text">{caption}</div>
        </AspectRatio.Root>
      </section>
    </main>
  );
}

export default App;
