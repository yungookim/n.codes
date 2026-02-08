/**
 * Floating "Build with AI" trigger button.
 */

function createTriggerIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M7 4h-3v16h3');
  path1.setAttribute('stroke-linecap', 'round');
  path1.setAttribute('stroke-linejoin', 'round');

  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M17 4h3v16h-3');
  path2.setAttribute('stroke-linecap', 'round');
  path2.setAttribute('stroke-linejoin', 'round');

  svg.appendChild(path1);
  svg.appendChild(path2);
  return svg;
}

function createTrigger(config, onClickHandler) {
  const btn = document.createElement('button');
  btn.className = `ncodes-trigger ${config.position}`;
  btn.title = 'Open n.codes';

  btn.appendChild(createTriggerIcon());

  const label = document.createElement('span');
  label.textContent = config.triggerLabel;
  btn.appendChild(label);

  btn.addEventListener('click', onClickHandler);
  return btn;
}

function showTrigger(trigger) {
  trigger.classList.remove('hidden');
}

function hideTrigger(trigger) {
  trigger.classList.add('hidden');
}

module.exports = { createTrigger, showTrigger, hideTrigger };
