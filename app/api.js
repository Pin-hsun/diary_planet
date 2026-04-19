const BASE = "https://diary-planet.onrender.com";

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

export function createSession() {
  return request("/sessions", { method: "POST" });
}

export function sendCbt(sid, input, initialMood) {
  const body = { input };
  if (initialMood) body.initial_mood = initialMood;
  return request(`/sessions/${sid}/cbt`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function reframe(sid) {
  return request(`/sessions/${sid}/reframe`, { method: "POST" });
}

export function startNarrative(sid) {
  return request(`/sessions/${sid}/narrative/start`, { method: "POST" });
}

export function sendNarrative(sid, input) {
  return request(`/sessions/${sid}/narrative`, {
    method: "POST",
    body: JSON.stringify({ input }),
  });
}

export function summarize(sid) {
  return request(`/sessions/${sid}/summarize`, { method: "POST" });
}

export function finalize(sid) {
  return request(`/sessions/${sid}/finalize`, { method: "POST" });
}

export function finalizeChat(sid, input) {
  return request(`/sessions/${sid}/finalize/chat`, {
    method: "POST",
    body: JSON.stringify({ input }),
  });
}

export function setFinalMood(sid, mood) {
  return request(`/sessions/${sid}/mood/final`, {
    method: "POST",
    body: JSON.stringify({ mood }),
  });
}

export function deleteSession(sid) {
  return request(`/sessions/${sid}`, { method: "DELETE" });
}
