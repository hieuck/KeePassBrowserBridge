'use strict';

const elements = {
  statusBadge: document.getElementById('statusBadge'),
  endpoint: document.getElementById('endpoint'),
  saveEndpoint: document.getElementById('saveEndpoint'),
  checkStatus: document.getElementById('checkStatus'),
  beginPair: document.getElementById('beginPair'),
  pairingPanel: document.getElementById('pairingPanel'),
  pairingSession: document.getElementById('pairingSession'),
  pairingCode: document.getElementById('pairingCode'),
  completePair: document.getElementById('completePair'),
  queryLogins: document.getElementById('queryLogins'),
  currentUrl: document.getElementById('currentUrl'),
  results: document.getElementById('results'),
  message: document.getElementById('message')
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  elements.saveEndpoint.addEventListener('click', () => runAction(saveEndpoint));
  elements.checkStatus.addEventListener('click', () => runAction(checkStatus));
  elements.beginPair.addEventListener('click', () => runAction(beginPair));
  elements.completePair.addEventListener('click', () => runAction(completePair));
  elements.queryLogins.addEventListener('click', () => runAction(queryLogins));

  runAction(refreshState);
}

async function saveEndpoint() {
  const state = await send({ type: 'KBB_SAVE_ENDPOINT', endpoint: elements.endpoint.value });
  renderState(state);
  setMessage('Endpoint saved.');
}

async function checkStatus() {
  await send({ type: 'KBB_HELLO' });
  const state = await send({ type: 'KBB_GET_STATE' });
  renderState(state);

  if (state.paired) {
    await send({ type: 'KBB_STATUS' });
    setStatus('Paired', 'paired');
    setMessage('KeePass bridge is reachable.');
  } else {
    setStatus('Ready', '');
    setMessage('KeePass bridge is reachable. Pair this browser to query logins.');
  }
}

async function beginPair() {
  const state = await send({ type: 'KBB_PAIR_BEGIN' });
  renderState(state);
  setMessage('Enter the pairing code shown in KeePass.');
}

async function completePair() {
  const state = await send({
    type: 'KBB_PAIR_COMPLETE',
    pairingCode: elements.pairingCode.value
  });
  renderState(state);
  elements.pairingCode.value = '';
  setMessage('Browser paired with KeePass.');
}

async function queryLogins() {
  const result = await send({ type: 'KBB_QUERY_LOGINS' });
  elements.currentUrl.textContent = result.url || '';
  renderResults(result.entries || []);
  setMessage(result.entries && result.entries.length
    ? `${result.entries.length} login(s) found.`
    : 'No matching logins found.');
}

async function fillLogin(credential) {
  const result = await send({ type: 'KBB_FILL_LOGIN', credential });
  if (result && result.filled === false) {
    throw new Error(result.error || 'The page could not be filled.');
  }

  setMessage('Login filled.');
}

async function refreshState() {
  const state = await send({ type: 'KBB_GET_STATE' });
  renderState(state);
  setMessage(state.paired ? 'Ready to query KeePass.' : 'Pair this browser with KeePass.');
}

function renderState(state) {
  elements.endpoint.value = state.endpoint || '';
  elements.pairingSession.textContent = state.pairingSessionId || '';
  elements.pairingPanel.classList.toggle('hidden', !state.pairingSessionId);
  setStatus(state.paired ? 'Paired' : 'Unpaired', state.paired ? 'paired' : '');
}

function renderResults(entries) {
  elements.results.textContent = '';

  for (const entry of entries) {
    const item = document.createElement('article');
    item.className = 'login';

    const title = document.createElement('div');
    title.className = 'login-title';
    title.textContent = entry.Title || '(Untitled)';

    const meta = document.createElement('div');
    meta.className = 'login-meta';
    meta.textContent = [entry.UserName, entry.Url].filter(Boolean).join(' - ');

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Fill';
    button.addEventListener('click', () => runAction(() => fillLogin(entry)));

    item.append(title, meta, button);
    elements.results.append(item);
  }
}

async function runAction(action) {
  setBusy(true);
  clearMessage();

  try {
    await action();
  } catch (error) {
    setStatus('Error', 'error');
    setMessage(error && error.message ? error.message : String(error), true);
  } finally {
    setBusy(false);
  }
}

function setBusy(isBusy) {
  for (const button of document.querySelectorAll('button')) {
    button.disabled = isBusy;
  }
}

function setStatus(text, kind) {
  elements.statusBadge.textContent = text;
  elements.statusBadge.classList.toggle('paired', kind === 'paired');
  elements.statusBadge.classList.toggle('error', kind === 'error');
}

function setMessage(text, isError) {
  elements.message.textContent = text;
  elements.message.classList.toggle('error', Boolean(isError));
}

function clearMessage() {
  setMessage('', false);
}

function send(message) {
  return chrome.runtime.sendMessage(message).then((result) => {
    if (!result || !result.ok) {
      throw new Error(result && result.error ? result.error : 'Extension request failed.');
    }

    return result.response;
  });
}
