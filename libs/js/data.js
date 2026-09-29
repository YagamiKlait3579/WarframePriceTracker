export const RARITY_ORDER = {
  very_common: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
  peculiar: 5
};

export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function priceKey(slug, rank) {
  return `${slug}|${rank == null ? "none" : rank}`;
}

export function childrenOf(categories, parentId = null) {
  return categories.filter(c => (c.parentId ?? null) === parentId);
}

export function categoryById(categories, id) {
  return categories.find(c => c.id === id);
}

export function collectCategoryTreeIds(categories, categoryId) {
  const result = [categoryId];
  for (const child of childrenOf(categories, categoryId)) result.push(...collectCategoryTreeIds(categories, child.id));
  return result;
}

export function itemName(item, language) {
  if (!item.autoName) return item.name || item.slug;
  if (language === "en") return item.marketNameEn || item.marketNameRu || item.slug;
  if (item.marketNameRu && item.marketNameEn) return `${item.marketNameRu} (${item.marketNameEn})`;
  return item.marketNameRu || item.marketNameEn || item.slug;
}

export function buildAutoName(info, slug, language) {
  if (language === "en") return info.nameEn || info.nameRu || slug;
  if (info.nameRu && info.nameEn) return `${info.nameRu} (${info.nameEn})`;
  return info.nameRu || info.nameEn || slug;
}

export function parseMarketUrl(value) {
  let url = value.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error("invalidUrl"); }
  if (!/^(www\.)?warframe\.market$/i.test(parsed.hostname)) throw new Error("hostError");
  const parts = parsed.pathname.split("/").filter(Boolean);
  const index = parts.findIndex(x => x.toLowerCase() === "items");
  if (index < 0 || !parts[index + 1]) throw new Error("itemsPathError");
  const slug = decodeURIComponent(parts[index + 1]).trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) throw new Error("slugError");
  return { slug };
}

export function marketUrl(slug, language) {
  return `https://warframe.market/${language === "en" ? "en" : "ru"}/items/${encodeURIComponent(slug)}?type=sell`;
}

export function normalizeItemInfo(data) {
  const names = data?.i18n || {};
  return {
    maxRank: Number.isInteger(data?.maxRank) ? data.maxRank : 0,
    nameRu: String(names?.ru?.name || "").trim(),
    nameEn: String(names?.en?.name || "").trim(),
    rarity: String(data?.rarity || "").trim().toLowerCase()
  };
}

export function formatRarity(rarity, t) {
  const key = String(rarity || "").toLowerCase();
  const map = {
    common: "rarityCommon",
    uncommon: "rarityUncommon",
    rare: "rarityRare",
    legendary: "rarityLegendary",
    very_common: "rarityVeryCommon",
    peculiar: "rarityPeculiar"
  };
  return map[key] ? t(map[key]) : (key ? key.replace(/_/g, " ") : "");
}

export function compareItems(a, b, { sortKey, sortDir, language }, getPrice) {
  // Favorites always stay above non-favorites, regardless of the selected sort.
  if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1;

  let result = 0;
  if (sortKey === "name") {
    result = itemName(a, language).localeCompare(itemName(b, language), language === "en" ? "en" : "ru", { sensitivity: "base" });
  } else if (sortKey === "rarity") {
    result = (RARITY_ORDER[a.rarity] ?? 999) - (RARITY_ORDER[b.rarity] ?? 999);
    if (result === 0) result = itemName(a, language).localeCompare(itemName(b, language), language === "en" ? "en" : "ru", { sensitivity: "base" });
  } else {
    const aRank = sortKey === "minRankPrice" ? 0 : (a.maxRank > 0 ? a.maxRank : null);
    const bRank = sortKey === "minRankPrice" ? 0 : (b.maxRank > 0 ? b.maxRank : null);
    const av = getPrice(a, aRank);
    const bv = getPrice(b, bRank);
    if (av == null && bv != null) result = 1;
    else if (av != null && bv == null) result = -1;
    else result = (av ?? 0) - (bv ?? 0);
    if (result === 0) result = itemName(a, language).localeCompare(itemName(b, language), language === "en" ? "en" : "ru", { sensitivity: "base" });
  }
  return sortDir === "desc" ? -result : result;
}

export function moveCategory(categories, categoryId, newParentId, positionIndex) {
  const moving = categoryById(categories, categoryId);
  if (!moving) throw new Error("categoryNotFound");

  const subtreeIds = new Set(collectCategoryTreeIds(categories, categoryId));
  if (newParentId && subtreeIds.has(newParentId)) throw new Error("categoryMoveIntoChild");

  const siblings = childrenOf(categories, newParentId ?? null).filter(category => !subtreeIds.has(category.id));
  const index = Math.max(0, Math.min(Number(positionIndex) || 0, siblings.length));
  moving.parentId = newParentId ?? null;
  siblings.splice(index, 0, moving);

  const siblingOrder = new Map(siblings.map((category, i) => [category.id, i]));
  const result = [];

  function appendTree(parentId) {
    let nodes = childrenOf(categories, parentId);
    if (parentId === (newParentId ?? null)) {
      nodes = siblings;
    } else if (parentId !== categoryId) {
      nodes = nodes.filter(node => !subtreeIds.has(node.id));
    }

    for (const node of nodes) {
      result.push(node);
      appendTree(node.id);
    }
  }

  appendTree(null);
  categories.splice(0, categories.length, ...result);
}
