'use strict';

if (!window.__keepassBrowserBridgeContentScriptLoaded) {
  window.__keepassBrowserBridgeContentScriptLoaded = true;
  window.__keepassBrowserBridgeInlineTargets = new WeakSet();
  window.__keepassBrowserBridgeActivePicker = null;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== 'KBB_FILL') {
      return;
    }

    try {
      const result = fillLogin(message.credential || {});
      sendResponse({ filled: true, result });
    } catch (error) {
      sendResponse({
        filled: false,
        error: error && error.message ? error.message : String(error)
      });
    }
  });

  installInlineFillButtons();
  const observer = new MutationObserver(() => installInlineFillButtons());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('mousedown', (event) => {
    const picker = window.__keepassBrowserBridgeActivePicker;
    if (picker && !picker.contains(event.target) && !event.target.classList.contains('kbb-inline-button')) {
      closeInlinePicker();
    }
  }, true);
}

function fillLogin(credential) {
  const passwordInput = findPasswordInput();
  const usernameInput = findUsernameInput(passwordInput);
  if (!passwordInput && !usernameInput) {
    throw new Error('No login field found on this page.');
  }

  if (usernameInput && credential.UserName) {
    setInputValue(usernameInput, credential.UserName);
  }

  if (passwordInput && credential.Password) {
    setInputValue(passwordInput, credential.Password);
  }

  return {
    usernameFilled: Boolean(usernameInput && credential.UserName),
    passwordFilled: Boolean(passwordInput && credential.Password)
  };
}

function findPasswordInput() {
  return visibleInputs('input[type="password"]').find((input) => !input.disabled && !input.readOnly) || null;
}

function findUsernameInput(passwordInput) {
  const candidates = visibleInputs('input')
    .filter((input) => {
      const type = (input.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'email', 'tel', 'url', 'search', ''].includes(type)
        && !input.disabled
        && !input.readOnly;
    });

  const scoped = passwordInput
    ? candidates.filter((input) => input.compareDocumentPosition(passwordInput) & Node.DOCUMENT_POSITION_FOLLOWING)
    : candidates;

  if (!scoped.length) {
    return candidates[0] || null;
  }

  const ranked = scoped
    .map((input, index) => ({ input, index, score: scoreUsernameCandidate(input) }))
    .sort((a, b) => (b.score - a.score) || (b.index - a.index));

  return ranked[0].input;
}

function visibleInputs(selector) {
  return Array.from(document.querySelectorAll(selector)).filter(isVisible);
}

function isVisible(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.visibility !== 'hidden'
    && style.display !== 'none'
    && rect.width > 0
    && rect.height > 0;
}

function setInputValue(input, value) {
  input.focus();
  const descriptor = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function installInlineFillButtons() {
  const passwordInputs = visibleInputs('input[type="password"]')
    .filter((input) => !input.disabled && !input.readOnly);

  for (const passwordInput of passwordInputs) {
    if (window.__keepassBrowserBridgeInlineTargets.has(passwordInput)) {
      continue;
    }

    const targetInput = findUsernameInput(passwordInput) || passwordInput;
    attachInlineButton(targetInput);
    window.__keepassBrowserBridgeInlineTargets.add(passwordInput);
    window.__keepassBrowserBridgeInlineTargets.add(targetInput);
  }

  if (passwordInputs.length === 0) {
    const usernameInput = findUsernameInput(null);
    if (usernameInput && !window.__keepassBrowserBridgeInlineTargets.has(usernameInput)) {
      attachInlineButton(usernameInput);
      window.__keepassBrowserBridgeInlineTargets.add(usernameInput);
    }
  }
}

function attachInlineButton(input) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'kbb-inline-button';
  button.setAttribute('aria-label', 'Fill from KeePass');
  button.title = 'Fill from KeePass';
  button.textContent = 'K';
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    fillFromInlineButton(button);
  });

  placeInlineButton(input, button);
}

function placeInlineButton(input, button) {
  const parent = input.parentElement;
  if (!parent) {
    return;
  }

  const parentStyle = window.getComputedStyle(parent);
  if (parentStyle.position === 'static') {
    parent.style.position = 'relative';
  }

  button.style.position = 'absolute';
  button.style.zIndex = '2147483647';
  button.style.width = '24px';
  button.style.height = '24px';
  button.style.minWidth = '24px';
  button.style.minHeight = '24px';
  button.style.maxWidth = '24px';
  button.style.maxHeight = '24px';
  button.style.margin = '0';
  button.style.padding = '0';
  button.style.boxSizing = 'border-box';
  button.style.border = '1px solid #176b87';
  button.style.borderRadius = '6px';
  button.style.background = '#ffffff';
  button.style.color = '#176b87';
  button.style.appearance = 'none';
  button.style.font = '700 12px/22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 1px 4px rgba(15, 23, 42, 0.18)';

  parent.appendChild(button);
  positionInlineButton(input, button);
  window.addEventListener('resize', () => positionInlineButton(input, button));
  input.addEventListener('focus', () => positionInlineButton(input, button));
}

function positionInlineButton(input, button) {
  const parent = input.parentElement;
  if (!parent || !document.documentElement.contains(input)) {
    button.remove();
    return;
  }

  const inputRect = input.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  button.style.left = `${inputRect.right - parentRect.left - 30}px`;
  button.style.top = `${inputRect.top - parentRect.top + Math.max(4, (inputRect.height - 24) / 2)}px`;
}

async function fillFromInlineButton(button) {
  setInlineButtonState(button, '...');

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'KBB_QUERY_FOR_URL',
      url: window.location.href
    });

    if (!result || !result.ok) {
      throw new Error(result && result.error ? result.error : 'KeePass query failed.');
    }

    const entries = result.response && Array.isArray(result.response.entries)
      ? result.response.entries
      : [];

    if (entries.length === 0) {
      setInlineButtonState(button, '0');
      return;
    }

    if (entries.length > 1) {
      showInlinePicker(button, entries);
      setInlineButtonState(button, String(entries.length));
      return;
    }

    fillLogin(entries[0]);
    setInlineButtonState(button, 'ok');
  } catch (error) {
    setInlineButtonState(button, '!');
  }
}

function showInlinePicker(button, entries) {
  closeInlinePicker();

  const picker = document.createElement('div');
  picker.className = 'kbb-inline-picker';
  picker.setAttribute('role', 'menu');
  applyPickerStyle(picker);

  const header = document.createElement('div');
  header.textContent = `${entries.length} KeePass logins`;
  header.style.padding = '8px 10px';
  header.style.borderBottom = '1px solid #d7dde5';
  header.style.color = '#667085';
  header.style.font = '600 12px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  picker.appendChild(header);

  for (const entry of entries.slice(0, 8)) {
    const item = document.createElement('button');
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    item.title = 'Fill from KeePass';
    applyPickerItemStyle(item);

    const title = document.createElement('div');
    title.textContent = entry.Title || '(Untitled)';
    title.style.fontWeight = '700';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.whiteSpace = 'nowrap';

    const detail = document.createElement('div');
    detail.textContent = entry.UserName || entry.Url || '';
    detail.style.color = '#667085';
    detail.style.fontSize = '12px';
    detail.style.overflow = 'hidden';
    detail.style.textOverflow = 'ellipsis';
    detail.style.whiteSpace = 'nowrap';

    item.appendChild(title);
    item.appendChild(detail);
    item.addEventListener('mousedown', (event) => event.preventDefault());
    item.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      fillLogin(entry);
      closeInlinePicker();
      setInlineButtonState(button, 'ok');
    });

    picker.appendChild(item);
  }

  if (entries.length > 8) {
    const footer = document.createElement('div');
    footer.textContent = `${entries.length - 8} more hidden`;
    footer.style.padding = '7px 10px';
    footer.style.color = '#667085';
    footer.style.font = '12px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    footer.style.borderTop = '1px solid #d7dde5';
    picker.appendChild(footer);
  }

  document.documentElement.appendChild(picker);
  positionInlinePicker(button, picker);
  window.__keepassBrowserBridgeActivePicker = picker;
}

function closeInlinePicker() {
  const picker = window.__keepassBrowserBridgeActivePicker;
  if (picker && picker.parentElement) {
    picker.parentElement.removeChild(picker);
  }
  window.__keepassBrowserBridgeActivePicker = null;
}

function applyPickerStyle(picker) {
  picker.style.position = 'fixed';
  picker.style.zIndex = '2147483647';
  picker.style.width = '280px';
  picker.style.maxWidth = 'calc(100vw - 16px)';
  picker.style.maxHeight = '320px';
  picker.style.overflowY = 'auto';
  picker.style.background = '#ffffff';
  picker.style.color = '#1f2933';
  picker.style.border = '1px solid #d7dde5';
  picker.style.borderRadius = '8px';
  picker.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.22)';
  picker.style.font = '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}

function applyPickerItemStyle(item) {
  item.style.display = 'block';
  item.style.width = '100%';
  item.style.margin = '0';
  item.style.padding = '9px 10px';
  item.style.border = '0';
  item.style.borderBottom = '1px solid #edf0f3';
  item.style.borderRadius = '0';
  item.style.background = '#ffffff';
  item.style.color = '#1f2933';
  item.style.textAlign = 'left';
  item.style.cursor = 'pointer';
  item.style.appearance = 'none';
  item.style.font = '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  item.addEventListener('mouseenter', () => {
    item.style.background = '#f3f7fa';
  });
  item.addEventListener('mouseleave', () => {
    item.style.background = '#ffffff';
  });
}

function positionInlinePicker(button, picker) {
  const rect = button.getBoundingClientRect();
  const width = Math.min(280, window.innerWidth - 16);
  const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width));
  const below = rect.bottom + 8;
  const top = below + 320 < window.innerHeight
    ? below
    : Math.max(8, rect.top - Math.min(320, picker.scrollHeight || 320) - 8);

  picker.style.width = `${width}px`;
  picker.style.left = `${left}px`;
  picker.style.top = `${top}px`;
}

function setInlineButtonState(button, state) {
  if (state === 'ok') {
    button.textContent = 'OK';
    button.style.borderColor = '#067647';
    button.style.color = '#067647';
  } else if (state === '!') {
    button.textContent = '!';
    button.style.borderColor = '#b42318';
    button.style.color = '#b42318';
  } else {
    button.textContent = state;
    button.style.borderColor = '#176b87';
    button.style.color = '#176b87';
  }

  window.setTimeout(() => {
    if (document.documentElement.contains(button)) {
      button.textContent = 'K';
      button.style.borderColor = '#176b87';
      button.style.color = '#176b87';
    }
  }, 1600);
}

function scoreUsernameCandidate(input) {
  const type = (input.getAttribute('type') || 'text').toLowerCase();
  const text = [
    input.getAttribute('autocomplete') || '',
    input.getAttribute('name') || '',
    input.id || '',
    input.getAttribute('placeholder') || '',
    input.getAttribute('aria-label') || ''
  ].join(' ').toLowerCase();

  let score = 0;
  if (type === 'email') score += 50;
  if (/\busername\b/.test(text)) score += 80;
  if (/\bemail\b|e-mail|mail/.test(text)) score += 70;
  if (/\blogin\b|\buser\b|account/.test(text)) score += 45;
  if (/\bcurrent-password\b|\bnew-password\b/.test(text)) score -= 100;
  if (/\bfname\b|\blname\b|first|last|family|given|surname/.test(text)) score -= 120;
  if (/\bsearch\b/.test(text)) score -= 60;
  return score;
}
