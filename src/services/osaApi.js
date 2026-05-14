// src/services/osaApi.js
// Utility module for communicating with OpenSongApp (OSA) Web Server API

export function buildBaseUrl(endpoint) {
  // Ensure no trailing slash
  return endpoint.replace(/\/+$/, "");
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
  if (!response.ok) throw new Error(`Failed to send remote command: ${response.status}`);
  return await response.json();
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
  if (!response.ok) throw new Error(`Failed to save song to OSA: ${response.status}`);
  return await response.json();
}
