'use strict';

const elements = {
  statusBadge: document.getElementById('statusBadge'),
  endpoint: document.getElementById('endpoint'),
  saveEndpoint: document.getElementById('saveEndpoint'),
  checkStatus: document.getElementById('checkStatus'),
  beginPair: document.getElementById('beginPair'),
  autoFill: document.getElementById('autoFill'),
  listClients: document.getElementById('listClients'),
  clientsPanel: document.getElementById('clientsPanel'),
  pairingPanel: document.getElementById('pairingPanel'),
  pairingSession: document.getElementById('pairingSession'),
  pairingCode: document.getElementById('pairingCode'),
  completePair: document.getElementById('completePair'),
  queryLogins: document.getElementById('queryLogins'),
  currentUrl: document.getElementById('currentUrl'),
  results: document.getElementById('results'),
  message: document.getElementById('message')
};

let currentEntries = [];

document.addEventListener('DOMContentLoaded', init);

function init() {
  elements.saveEndpoint.addEventListener('click', () => runAction(saveEndpoint));
  elements.checkStatus.addEventListener('click', () => runAction(checkStatus));
  elements.beginPair.addEventListener('click', () => runAction(beginPair));
  elements.autoFill.addEventListener('change', () => runAction(setAutoFill));
  elements.listClients.addEventListener('click', () => runAction(listClients));
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

async function setAutoFill() {
  const state = await send({
    type: 'KBB_SET_AUTO_FILL',
    enabled: elements.autoFill.checked
  });
  renderState(state);
  setMessage(state.autoFillEnabled
    ? 'Auto-fill enabled for single matching logins.'
    : 'Auto-fill disabled.');
}

async function listClients() {
  const result = await send({ type: 'KBB_LIST_CLIENTS' });
  renderClients(result.Clients || []);
  elements.clientsPanel.classList.remove('hidden');
  setMessage(result.Clients && result.Clients.length
    ? `${result.Clients.length} trusted browser(s).`
    : 'No trusted browsers found.');
}

async function revokeClient(client) {
  const result = await send({ type: 'KBB_REVOKE_CLIENT', clientId: client.ClientId });
  if (!result || !result.Revoked) {
    throw new Error('Browser was not revoked.');
  }

  if (client.Current) {
    renderState(await send({ type: 'KBB_GET_STATE' }));
    elements.clientsPanel.classList.add('hidden');
    elements.clientsPanel.textContent = '';
    setMessage('This browser was revoked. Pair again to use KeePass.');
    return;
  }

  await listClients();
  setMessage('Browser revoked.');
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
  currentEntries = result.entries || [];
  renderResults(currentEntries);
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

async function updateLogin(entry, form) {
  const login = {
    entryId: entry.EntryId,
    title: form.querySelector('[name="title"]').value,
    url: form.querySelector('[name="url"]').value,
    userName: form.querySelector('[name="userName"]').value,
    password: form.querySelector('[name="password"]').value
  };

  const result = await send({ type: 'KBB_UPDATE_LOGIN', login });
  if (!result || !result.Success) {
    throw new Error(result && result.Error ? result.Error : 'KeePass entry could not be updated.');
  }

  Object.assign(entry, result.Entry || {}, {
    Title: login.title,
    Url: login.url,
    UserName: login.userName,
    Password: login.password
  });
  renderResults(currentEntries);
  setMessage('Entry updated.');
}

async function refreshState() {
  const state = await send({ type: 'KBB_GET_STATE' });
  renderState(state);
  setMessage(state.paired ? 'Ready to query KeePass.' : 'Pair this browser with KeePass.');
}

function renderState(state) {
  elements.endpoint.value = state.endpoint || '';
  elements.autoFill.checked = Boolean(state.autoFillEnabled);
  elements.pairingSession.textContent = state.pairingSessionId || '';
  elements.pairingPanel.classList.toggle('hidden', !state.pairingSessionId);
  setStatus(state.paired ? 'Paired' : 'Unpaired', state.paired ? 'paired' : '');
}

function renderResults(entries) {
  elements.results.textContent = '';
  currentEntries = entries;

  for (const entry of entries) {
    const item = document.createElement('article');
    item.className = 'login';

    const title = document.createElement('div');
    title.className = 'login-title';
    title.textContent = entry.Title || '(Untitled)';

    const meta = document.createElement('div');
    meta.className = 'login-meta';
    meta.textContent = [entry.UserName, entry.Url].filter(Boolean).join(' - ');

    const actions = document.createElement('div');
    actions.className = 'login-actions';

    const fill = document.createElement('button');
    fill.type = 'button';
    fill.textContent = 'Fill';
    fill.addEventListener('click', () => runAction(() => fillLogin(entry)));

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'secondary';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => showEditForm(item, entry));

    actions.append(fill, edit);

    item.append(title, meta, actions);
    elements.results.append(item);
  }
}

function renderClients(clients) {
  elements.clientsPanel.textContent = '';

  for (const client of clients) {
    const item = document.createElement('article');
    item.className = 'client';

    const name = document.createElement('div');
    name.className = 'client-title';
    name.textContent = client.ClientName || 'Browser';

    const meta = document.createElement('div');
    meta.className = 'client-meta';
    meta.textContent = `${client.Current ? 'This browser - ' : ''}${formatDate(client.CreatedUtcMs)}`;

    const revoke = document.createElement('button');
    revoke.type = 'button';
    revoke.className = 'secondary';
    revoke.textContent = client.Current ? 'Revoke This Browser' : 'Revoke';
    revoke.addEventListener('click', () => runAction(() => revokeClient(client)));

    item.append(name, meta, revoke);
    elements.clientsPanel.append(item);
  }

  if (!clients.length) {
    const empty = document.createElement('div');
    empty.className = 'client-meta';
    empty.textContent = 'No trusted browsers.';
    elements.clientsPanel.append(empty);
  }
}

function formatDate(ms) {
  const value = Number(ms || 0);
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleString();
}

function showEditForm(item, entry) {
  const existing = item.querySelector('.edit-form');
  if (existing) {
    existing.remove();
    return;
  }

  const form = document.createElement('form');
  form.className = 'edit-form';
  form.innerHTML = `
    <label>Title<input name="title" type="text"></label>
    <label>Username<input name="userName" type="text" autocomplete="username"></label>
    <label>URL<input name="url" type="url" spellcheck="false"></label>
    <label>Password<input name="password" type="password" autocomplete="current-password"></label>
    <div class="login-actions">
      <button type="submit">Save</button>
      <button type="button" class="secondary" data-action="cancel">Cancel</button>
    </div>
  `;

  form.querySelector('[name="title"]').value = entry.Title || '';
  form.querySelector('[name="userName"]').value = entry.UserName || '';
  form.querySelector('[name="url"]').value = entry.Url || '';
  form.querySelector('[name="password"]').value = entry.Password || '';
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runAction(() => updateLogin(entry, form));
  });
  form.querySelector('[data-action="cancel"]').addEventListener('click', () => form.remove());
  item.append(form);
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
