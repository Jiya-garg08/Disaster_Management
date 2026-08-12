/* ============================================================
   storage.js — localStorage wrapper (stand-in for MongoDB)
   Keys:
     "drr_requests"      -> array of shelter requests
     "drr_dispatch_log"  -> array of completed dispatch records
   ============================================================ */

const STORE_KEYS = {
  REQUESTS: "drr_requests",
  DISPATCH_LOG: "drr_dispatch_log",
};

function getRequests() {
  return JSON.parse(localStorage.getItem(STORE_KEYS.REQUESTS) || "[]");
}

function saveRequests(requests) {
  localStorage.setItem(STORE_KEYS.REQUESTS, JSON.stringify(requests));
}

function addRequest(request) {
  const requests = getRequests();
  requests.push(request);
  saveRequests(requests);
}

function updateRequestStatus(id, status) {
  const requests = getRequests();
  const target = requests.find((r) => r.id === id);
  if (target) target.status = status;
  saveRequests(requests);
}

function getDispatchLog() {
  return JSON.parse(localStorage.getItem(STORE_KEYS.DISPATCH_LOG) || "[]");
}

function addDispatchLogEntry(entry) {
  const log = getDispatchLog();
  log.push(entry);
  localStorage.setItem(STORE_KEYS.DISPATCH_LOG, JSON.stringify(log));
}

// Seeds sample data once, so a fresh browser isn't empty.
function seedIfEmpty() {
  if (getRequests().length === 0) {
    saveRequests(SEED_REQUESTS);
  }
}

function generateRequestId() {
  const requests = getRequests();
  const nextNum = 1001 + requests.length;
  return `REQ-${nextNum}`;
}