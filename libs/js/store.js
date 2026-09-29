import { DEFAULT_SETTINGS, STORAGE_KEY } from "./state.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSettings(input = {}) {
  return {
    language: input.language === "en" ? "en" : "ru",
    crossplay: input.crossplay !== false,
    playerStatus: ["all", "online", "ingame"].includes(input.playerStatus) ? input.playerStatus : "all",
    sortKey: ["name", "rarity", "minRankPrice", "maxRankPrice"].includes(input.sortKey) ? input.sortKey : "name",
    sortDir: input.sortDir === "desc" ? "desc" : "asc",
    collapsedCategories: input.collapsedCategories && typeof input.collapsedCategories === "object" ? { ...input.collapsedCategories } : {}
  };
}

function emptyData() {
  return {
    schema: 1,
    categories: [],
    items: [],
    prices: {},
    settings: clone(DEFAULT_SETTINGS)
  };
}

export function loadData() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw || raw.schema !== 1) return emptyData();
    return {
      schema: 1,
      categories: Array.isArray(raw.categories) ? raw.categories : [],
      items: Array.isArray(raw.items) ? raw.items.map(item => ({
        ...item,
        favorite: item?.favorite === true
      })) : [],
      prices: raw.prices && typeof raw.prices === "object" && !Array.isArray(raw.prices) ? raw.prices : {},
      settings: normalizeSettings(raw.settings)
    };
  } catch {
    return emptyData();
  }
}

export function saveData(app) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    schema: 1,
    categories: app.categories,
    items: app.items,
    prices: app.prices,
    settings: app.settings
  }));
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildExport(app) {
  return {
    format: "WarframePriceTracker",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    schema: 1,
    categories: app.categories,
    items: app.items,
    prices: app.prices,
    settings: app.settings
  };
}

export function validateImport(data) {
  if (!data || typeof data !== "object") throw new Error("invalidFile");
  if (data.format !== "WarframePriceTracker" || data.version !== "1.0" || data.schema !== 1) throw new Error("wrongFile");
  if (!Array.isArray(data.categories) || !Array.isArray(data.items) || !data.prices || typeof data.prices !== "object" || Array.isArray(data.prices)) throw new Error("invalidFile");

  const ids = new Set();
  for (const cat of data.categories) {
    if (!cat || typeof cat.id !== "string" || typeof cat.name !== "string" || (cat.parentId !== null && typeof cat.parentId !== "string")) throw new Error("invalidCategory");
    if (ids.has(cat.id)) throw new Error("duplicateCategoryId");
    ids.add(cat.id);
  }

  for (const item of data.items) {
    if (!item || typeof item.id !== "string" || typeof item.slug !== "string" || typeof item.name !== "string" || !Array.isArray(item.categoryIds)) throw new Error("invalidItem");
    if (!item.categoryIds.every(id => ids.has(id))) throw new Error("invalidItemCategories:" + item.name);
  }
}

export function importData(app, data) {
  app.categories = data.categories.map(c => ({ id: c.id, name: c.name, parentId: c.parentId ?? null }));
  app.items = data.items.map(item => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    autoName: item.autoName === true,
    categoryIds: [...item.categoryIds],
    favorite: item.favorite === true,
    maxRank: Number.isInteger(item.maxRank) ? item.maxRank : 0,
    marketNameRu: String(item.marketNameRu || ""),
    marketNameEn: String(item.marketNameEn || ""),
    rarity: String(item.rarity || "").toLowerCase()
  }));
  app.prices = structuredClone(data.prices);
  app.settings = normalizeSettings(data.settings);
  app.expandedItems.clear();
}
