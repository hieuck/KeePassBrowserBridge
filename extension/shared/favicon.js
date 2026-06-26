let faviconSource = 'duckduckgo';

export function setFaviconSource(source) {
  if (['duckduckgo', 'google', 'direct'].includes(source)) {
    faviconSource = source;
  }
}

export function getFaviconUrl(domain) {
  if (!domain) return null;
  try {
    const u = new URL(domain);
    const hostname = u.hostname;
    if (faviconSource === 'duckduckgo') {
      return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    }
    if (faviconSource === 'google') {
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    }
    if (faviconSource === 'direct') {
      return `https://${hostname}/favicon.ico`;
    }
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return null;
  }
}
