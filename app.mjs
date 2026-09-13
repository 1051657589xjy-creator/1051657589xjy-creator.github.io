import { searchResume } from './search.mjs';
import { resume } from './resume.mjs';

const form = document.querySelector('#question-form');
const input = document.querySelector('#question');
const send = document.querySelector('#send');
const conversation = document.querySelector('#conversation');
const welcome = document.querySelector('#welcome');
const initialWelcome = welcome.cloneNode(true);
let count = 0;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fitInput() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 128) + 'px';
  send.disabled = !input.value.trim();
}

function evidence(record) {
  const article = el('article', 'evidence');
  article.append(el('h4', 'evidence-title', record.title));
  article.append(el('p', 'evidence-text', record.text));
  article.append(el('p', 'source-line', `来源：${resume.fileName} · 第 ${record.page} 页 · ${record.section}`));
  return article;
}

function ask(question) {
  const text = question.trim();
  if (!text || text.length > 500) return;
  const oldWelcome = document.querySelector('#welcome');
  if (oldWelcome) oldWelcome.remove();
  const user = el('div', 'message user');
  user.append(el('div', 'message-label', '你'));
  user.append(el('div', 'message-content', text));
  conversation.append(user);

  const reply = searchResume(text);
  const answer = el('div', 'message assistant');
  const label = el('div', 'message-label');
  label.append(el('span','tiny-mark','怡'), document.createTextNode('佳怡 · 简历检索'));
  answer.append(label);
  const content = el('div', 'message-content');
  if (reply.kind === 'found') {
    content.append(el('p', 'answer-intro', reply.text));
    const list = el('div', 'evidence-list');
    reply.records.slice(0, 2).forEach(record => list.append(evidence(record)));
    content.append(list);
    if (reply.records.length > 2) {
      const more = el('details', 'more-evidence');
      more.append(el('summary', '', `展开其余 ${reply.records.length - 2} 条相关记录`));
      reply.records.slice(2).forEach(record => more.append(evidence(record)));
      content.append(more);
    }
  } else {
    const note = el('div', 'no-match');
    note.append(el('p', '', reply.text));
    note.append(el('small', '', '这表示没有找到对应记录，不代表我一定没有这项经历。也可以换成简历里的具体关键词再问。'));
    content.append(note);
    const alternatives = el('div', 'related-questions');
    ['你的教育背景是什么？', '介绍一下你的翻译经历', '你有哪些证书？'].forEach(question => {
      const button = el('button', '', question);
      button.type = 'button';
      button.dataset.question = question;
      alternatives.append(button);
    });
    content.append(alternatives);
  }
  answer.append(content);
  conversation.append(answer);
  count += 1;
  // Keep DOM bounded during long sessions without storing conversation data.
  if (count > 30) {
    conversation.querySelectorAll('.message').forEach((node, index) => { if (index < 2) node.remove(); });
    count = 30;
  }
  input.value = '';
  fitInput();
  requestAnimationFrame(() => { conversation.scrollTop = Math.max(0, user.offsetTop - conversation.offsetTop - 12); });
}

form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); input.focus(); });
input.addEventListener('input', fitInput);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    ask(input.value);
  }
});
conversation.addEventListener('click', event => {
  const button = event.target.closest('button[data-question]');
  if (button) ask(button.dataset.question);
});
document.querySelector('#reset').addEventListener('click', () => {
  conversation.replaceChildren(initialWelcome.cloneNode(true));
  count = 0;
  input.value = '';
  fitInput();
  conversation.scrollTop = 0;
  input.focus();
});
fitInput();
