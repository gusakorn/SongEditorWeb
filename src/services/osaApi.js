// src/services/osaApi.js
// Utility module for communicating with OpenSongApp (OSA) Web Server API

export function buildBaseUrl(endpoint) {
  // Ensure no trailing slash
  return endpoint.replace(/\/+$/, "");
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

function responseDetail(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    return data.error || data.message || JSON.stringify(data);
  }
  return String(data);
}

export async function fetchSongLibrary(endpoint) {
  const url = `http://${buildBaseUrl(endpoint)}/api/list`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch song list: ${response.status}`);
  const data = await response.json();
  // Handle both direct array or object with 'songs'/'list' property
  if (Array.isArray(data)) return data;
  if (data.songs && Array.isArray(data.songs)) return data.songs;
  if (data.list && Array.isArray(data.list)) return data.list;
  return [];
}

export async function fetchSongData(endpoint, folder = "", filename = "") {
  const params = new URLSearchParams({ folder, filename });
  const url = `http://${buildBaseUrl(endpoint)}/api/song?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch song: ${response.status}`);
  return await response.json();
}

export async function sendRemoteCommand(endpoint, folder, filename) {
  const url = `http://${buildBaseUrl(endpoint)}/api/remote`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ folder, filename })
  });

  const body = await readResponseBody(response);
  if (!response.ok) {
    const detail = responseDetail(body);
    const suffix = detail ? ` - ${detail}` : '';
    throw new Error(`Failed to send remote command: ${response.status}${suffix}`);
  }

  return body ?? { ok: true };
}
export function createWebSocket(endpoint, onMessage, onOpen, onClose, onError) {
  const wsUrl = `ws://${buildBaseUrl(endpoint)}/updates`;
  const socket = new WebSocket(wsUrl);
  socket.onopen = () => {
    if (onOpen) onOpen();
  };
  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (onMessage) onMessage(payload);
    } catch (e) {
      // Fallback for plain text messages like "REFRESH"
      if (onMessage) onMessage(event.data);
    }
  };
  socket.onclose = () => {
    if (onClose) onClose();
  };
  socket.onerror = (err) => {
    if (onError) onError(err);
  };
  return socket;
}
export async function saveSongToOsa(endpoint, songData) {
  const url = `http://${buildBaseUrl(endpoint)}/api/save`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(songData)
  });

  const body = await readResponseBody(response);
  if (!response.ok) {
    const detail = responseDetail(body);
    const suffix = detail ? ` - ${detail}` : '';
    throw new Error(`Failed to save song to OSA: ${response.status}${suffix}`);
  }

  return body ?? { ok: true };
}
