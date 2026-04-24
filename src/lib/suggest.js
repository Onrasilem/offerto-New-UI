// src/lib/suggest.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'offerto.suggest.';
const MAX_BUCKET_SIZE = 100;

/**
 * Normaliseert voor matching (case-insensitive) maar bewaart de originele waarde.
 */
function norm(s) {
  return String(s || '').trim().replace(/\s+/g, ' ');
}

/**
 * Haalt de lijst uit storage.
 */
async function getBucket(bucket) {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + bucket);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Schrijft de lijst naar storage.
 */
async function setBucket(bucket, arr) {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + bucket, JSON.stringify(arr.slice(0, MAX_BUCKET_SIZE)));
  } catch {
    // silent
  }
}

/**
 * Voegt een waarde toe aan een bucket (recentheid eerst), zonder duplicaten (case-insensitive).
 */
export async function addSuggest(bucket, value) {
  const v = norm(value);
  if (!v) return;
  const list = await getBucket(bucket);
  const existsIdx = list.findIndex((x) => norm(x) === v);
  if (existsIdx >= 0) {
    const [item] = list.splice(existsIdx, 1);
    list.unshift(item); // promote to front
  } else {
    list.unshift(value);
  }
  await setBucket(bucket, list);
}

/**
 * Haalt suggesties op o.b.v. query (prefix/substring, case-insensitive).
 */
export async function getSuggestions(bucket, query, limit = 6) {
  const q = norm(query);
  if (!q || q.length < 2) return [];
  const list = await getBucket(bucket);
  const lc = q.toLowerCase();
  // eerst prefix-hits, dan substring-hits
  const prefix = [];
  const rest = [];
  list.forEach((item) => {
    const s = norm(item);
    const sl = s.toLowerCase();
    if (sl.startsWith(lc)) prefix.push(item);
    else if (sl.includes(lc)) rest.push(item);
  });
  return [...prefix, ...rest].slice(0, limit);
}
