import React, { useState } from "react";

const hiragana = [
  { kana: "あ", romaji: "a" },
  { kana: "い", romaji: "i" },
  { kana: "う", romaji: "u" },
  { kana: "え", romaji: "e" },
  { kana: "お", romaji: "o" },
  // ...add more
];

const katakana = [
  { kana: "ア", romaji: "a" },
  { kana: "イ", romaji: "i" },
  { kana: "ウ", romaji: "u" },
  { kana: "エ", romaji: "e" },
  { kana: "オ", romaji: "o" },
  // ...add more
];

export default function App() {
  const [mode, setMode] = useState("hiragana");
  const [range, setRange] = useState(5);
  const [step, setStep] = useState("select");
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [wrongCount, setWrongCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const data = mode === "hiragana" ? hiragana : katakana;
  const quizData = data.slice(0, range);

  function startQuiz() {
    setStep("quiz");
    setCurrent(0);
    setWrongCount(0);
    setShowAnswer(false);
    setInput("");
  }

  function checkAnswer(e) {
    e.preventDefault();
    if (input.trim().toLowerCase() === quizData[current].romaji) {
      setShowAnswer(false);
      setInput("");
      if (current < quizData.length - 1) {
        setCurrent(current + 1);
      } else {
        alert("Quiz finished! Wrong answers: " + wrongCount);
        setStep("select");
      }
    } else {
      setWrongCount(wrongCount + 1);
      setShowAnswer(true);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 16 }}>
      {step === "select" && (
        <div>
          <h2>Kana Quiz</h2>
          <div>
            <label>
              <input
                type="radio"
                checked={mode === "hiragana"}
                onChange={() => setMode("hiragana")}
              />
              Hiragana
            </label>
            <label style={{ marginLeft: 16 }}>
              <input
                type="radio"
                checked={mode === "katakana"}
                onChange={() => setMode("katakana")}
              />
              Katakana
            </label>
          </div>
          <div style={{ marginTop: 16 }}>
            <label>
              Range:
              <select
                value={range}
                onChange={e => setRange(Number(e.target.value))}
              >
                <option value={5}>First 5</option>
                <option value={10}>First 10</option>
                <option value={data.length}>All</option>
              </select>
            </label>
          </div>
          <button style={{ marginTop: 24 }} onClick={startQuiz}>
            Start
          </button>
        </div>
      )}

      {step === "quiz" && (
        <div>
          <h3>
            {current + 1} / {quizData.length}
          </h3>
          <div style={{ fontSize: 48, margin: 24 }}>{quizData[current].kana}</div>
          <form onSubmit={checkAnswer}>
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter romaji"
              style={{ fontSize: 24, width: "100%" }}
            />
            <button type="submit" style={{ marginTop: 16, width: "100%" }}>
              Submit
            </button>
          </form>
          {showAnswer && (
            <div style={{ color: "red", marginTop: 16 }}>
              Answer: {quizData[current].romaji}
            </div>
          )}
          <div style={{ marginTop: 16 }}>Wrong: {wrongCount}</div>
        </div>
      )}
    </div>
  );
} 