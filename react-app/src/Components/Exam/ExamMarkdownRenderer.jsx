import React from "react";
import { marked } from "marked";
import "./ExamMarkdownRenderer.module.css"; // now plain CSS, not module

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Split markdown into normal vs question blocks
function splitBlocks(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  let buffer = [];
  let qBuffer = [];
  let inQuestion = false;

  const flushBuffer = () => {
    if (buffer.length) {
      blocks.push({ type: "markdown", text: buffer.join("\n") });
      buffer = [];
    }
  };
  const flushQuestion = () => {
    if (qBuffer.length) {
      blocks.push({ type: "question", lines: [...qBuffer] });
      qBuffer = [];
      inQuestion = false;
    }
  };

  for (const line of lines) {
    if (line.includes("[!num]")) {
      flushBuffer();
      if (inQuestion) flushQuestion();
      inQuestion = true;
      qBuffer = [line];
    } else if (inQuestion) {
      qBuffer.push(line);
    } else {
      buffer.push(line);
    }
  }
  if (inQuestion) flushQuestion();
  flushBuffer();
  return blocks;
}

// ✅ Allow single line breaks to render as <br/>
marked.setOptions({
  gfm: true,
  breaks: true,
  mangle: false,
  headerIds: false,
});

function processQuestionBlock(lines, qIndex, showAnswers) {
  let text = lines.join("\n");

  // Inline text input
  text = text.replace(/\[T\*([^\]]+)\]/g, (_, ans) =>
    showAnswers
      ? `<input type="text" value="${escapeHtml(ans)}" readonly class="inlineTextbox answerFilled" />`
      : `<input type="text" class="inlineTextbox" name="q${qIndex}_text" />`
  );
  text = text.replace(
    /\[T\]/g,
    `<input type="text" class="inlineTextbox" name="q${qIndex}_text" />`
  );

  // Dropdown inline
  const choiceRegex = /\[([* ])\]\s*([^\n\[]+)/g;
  const dropdownRegex = /\[D\]([\s\S]*?)\[\/D\]/g;
  text = text.replace(dropdownRegex, (_, inner) => {
    const options = [...inner.matchAll(choiceRegex)].map((m) => ({
      correct: m[1] === "*",
      text: m[2].trim(),
    }));
    const longest = Math.min(Math.max(...options.map((o) => o.text.length)) + 2, 30);
    const html =
      `<select name="q${qIndex}" class="dropdownInline" style="width:${longest}ch" ${
        showAnswers ? "disabled" : ""
      }>` +
      options
        .map(
          (o) =>
            `<option value="${escapeHtml(o.text)}"${
              showAnswers && o.correct ? " selected" : ""
            }>${escapeHtml(o.text)}</option>`
        )
        .join("") +
      "</select>";
    return html;
  });

  // Multiple choice
  text = text.replace(choiceRegex, (match, mark, label) => {
    const isMulti = (text.match(/\[\*\]/g) || []).length > 1;
    const type = isMulti ? "checkbox" : "radio";
    const checked = showAnswers && mark === "*" ? "checked" : "";
    return `<label class="choiceItem">
      <input type="${type}" name="q${qIndex}" ${checked} ${showAnswers ? "disabled" : ""}/>
      ${escapeHtml(label.trim())}
    </label>`;
  });

  // Question numbering
  text = text.replace(/\[!num\]/g, `<span class="numberIndex">Q${qIndex}.</span>`);

  return marked.parse(text);
}

export default function ExamMarkdownRenderer({ markdown = "", showAnswers = false }) {
  const blocks = splitBlocks(markdown);
  let qCounter = 0;

  const html = blocks
    .map((b) => {
      if (b.type === "markdown") return marked.parse(b.text);
      if (b.type === "question") {
        qCounter++;
        return processQuestionBlock(b.lines, qCounter, showAnswers);
      }
      return "";
    })
    .join("\n");

  return <div className="renderer" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ✅ Convert markdown to HTML + extract correct answers
export function renderMarkdownToHtmlAndAnswers(markdown) {
  const blocks = splitBlocks(markdown);
  let htmlOutput = "";
  let allAnswers = [];
  let qCounter = 0;

  blocks.forEach((b) => {
    if (b.type === "markdown") {
      htmlOutput += marked.parse(b.text);
      return;
    }

    qCounter++;
    const full = b.lines.join("\n");

    const textAnswers = [...full.matchAll(/\[T\*([^\]]+)\]/g)].map((m) => m[1].trim());
    const radioAnswers = [...full.matchAll(/\[\*\]\s*([^\n\[]+)/g)].map((m) => m[1].trim());
    const dropdownAnswers = [...full.matchAll(/\[D\]([\s\S]*?)\[\/D\]/g)].flatMap(([, inner]) =>
      [...inner.matchAll(/\[\*\]\s*([^\n\[]+)/g)].map((m) => m[1].trim())
    );

    allAnswers.push(...textAnswers, ...radioAnswers, ...dropdownAnswers);
    htmlOutput += processQuestionBlock(b.lines, qCounter, false);
  });

  return { html: htmlOutput, answers: allAnswers };
}
