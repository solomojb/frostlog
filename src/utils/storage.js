/**
 * Storage abstraction layer.
 * Web: wraps localStorage.
 * Tauri: reads/writes frostlog-data.json via tauri-plugin-fs.
 *
 * All app code uses this module — never calls localStorage directly.
 *
 * Tauri note: file I/O is async but the app reads state only at init (useState
 * lazy initializer). We keep an in-memory cache synced at startup, then write
 * through on every setItem/removeItem. Reads after init hit the cache only.
 */

import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

const FILE_NAME = "frostlog-data.json";
const BASE_DIR  = BaseDirectory.AppData;

const isTauri = typeof window !== "undefined" && !!window.__TAURI__;

// ── In-memory cache (Tauri only) ──────────────────────────────────────────────
let _cache = null;        // null = not loaded yet
let _ready = false;       // true once initStorage() resolved
let _readyCallbacks = []; // queued writes waiting for init

async function _loadCache() {
    try {
        const text = await readTextFile(FILE_NAME, { baseDir: BASE_DIR });
        _cache = JSON.parse(text);
    } catch {
        // File doesn't exist yet — start fresh
        _cache = {};
    }
    _ready = true;
    _readyCallbacks.forEach(fn => fn());
    _readyCallbacks = [];
}

async function _persist() {
    await writeTextFile(FILE_NAME, JSON.stringify(_cache), { baseDir: BASE_DIR });
}

function _whenReady(fn) {
    if (_ready) fn();
    else _readyCallbacks.push(fn);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Must be called once at app startup (before React renders) when running in
 * Tauri. Resolves when the data file is loaded into the in-memory cache so
 * that synchronous getItem() calls in useState initializers work correctly.
 */
export async function initStorage() {
    if (!isTauri) return;
    await _loadCache();
}

const storage = {
    getItem(key) {
        if (isTauri) {
            if (!_ready) {
                // Fallback during the tiny window before initStorage resolves
                console.warn(`[storage] getItem("${key}") called before init`);
                return null;
            }
            const v = _cache[key];
            return v === undefined ? null : v;
        }
        return localStorage.getItem(key);
    },

    setItem(key, value) {
        if (isTauri) {
            _whenReady(() => {
                _cache[key] = value;
                _persist();
            });
            return;
        }
        localStorage.setItem(key, value);
    },

    removeItem(key) {
        if (isTauri) {
            _whenReady(() => {
                delete _cache[key];
                _persist();
            });
            return;
        }
        localStorage.removeItem(key);
    },
};

export default storage;
