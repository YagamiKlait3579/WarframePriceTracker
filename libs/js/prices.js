import { priceKey } from "./data.js";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export function createPriceService({ api, app, save, render, setStatus, t }) {
  function loadedRanks(item) {
    const ranks = [];
    const prefix = `${item.slug}|`;
    for (const key of Object.keys(app.prices)) {
      if (!key.startsWith(prefix)) continue;
      const suffix = key.slice(prefix.length);
      if (/^\d+$/.test(suffix)) ranks.push(Number(suffix));
    }
    return ranks;
  }

  function validOrders(orders) {
    return (Array.isArray(orders) ? orders : [])
      .filter(order => order?.visible !== false)
      .filter(order => Number.isFinite(Number(order?.platinum)))
      .filter(order => {
        const status = order?.user?.status;
        if (app.settings.playerStatus === "online") return status === "online";
        if (app.settings.playerStatus === "ingame") return status === "ingame";
        return status === "online" || status === "ingame";
      })
      .sort((a, b) => Number(a.platinum) - Number(b.platinum));
  }

  async function fetchRank(item, rank) {
    const data = await api.getTopOrders(item.slug, rank);
    const orders = validOrders(data?.sell);
    const first = orders[0];
    const last = orders[orders.length - 1];
    app.prices[priceKey(item.slug, rank)] = {
      minPrice: first ? Number(first.platinum) : null,
      maxPrice: last ? Number(last.platinum) : null,
      time: Date.now()
    };
  }

  async function updateItems(items, { full = false, label = "" } = {}) {
    if (app.refreshing || !items.length) return;
    app.refreshing = true;
    render();
    let errors = 0;
    let requests = [];

    for (const item of items) {
      const ranks = new Set();
      if (item.maxRank > 0) {
        ranks.add(0);
        ranks.add(item.maxRank);
        if (full) for (const rank of loadedRanks(item)) ranks.add(rank);
      } else {
        ranks.add(null);
      }
      for (const rank of [...ranks].sort((a, b) => (a ?? -1) - (b ?? -1))) requests.push({ item, rank });
    }

    try {
      for (let index = 0; index < requests.length; index++) {
        const { item, rank } = requests[index];
        setStatus(`${label || (full ? t("fullUpdated") : t("refresh"))}: ${index + 1}/${requests.length} — ${item.name || item.slug}${rank == null ? "" : `, ${t("rank")} ${rank}`}`);
        try {
          await fetchRank(item, rank);
          save();
          render();
        } catch (error) {
          errors++;
          console.error("Price update failed", item.slug, rank, error);
        }
        if (index + 1 < requests.length) await delay(400);
      }
      const base = label ? t("categoryUpdated") : (full ? t("fullUpdated") : t("updatedShort"));
      setStatus(`${base}${errors ? ` — ${errors}` : ""}`);
    } finally {
      app.refreshing = false;
      save();
      render();
    }
  }

  async function loadAllRanks(item) {
    if (app.refreshing || item.maxRank <= 0) return;
    const missing = [];
    for (let rank = 0; rank <= item.maxRank; rank++) {
      if (!app.prices[priceKey(item.slug, rank)]) missing.push(rank);
    }
    for (let index = 0; index < missing.length; index++) {
      const rank = missing[index];
      setStatus(`${t("loading")} ${item.name}: ${t("rank")} ${rank}/${item.maxRank}`);
      try {
        await fetchRank(item, rank);
        save();
        render();
      } catch (error) {
        console.error("Rank load failed", item.slug, rank, error);
      }
      if (index + 1 < missing.length) await delay(400);
    }
    setStatus(t("ready"));
    render();
  }

  function getPrice(item, rank) {
    return app.prices[priceKey(item.slug, rank)]?.minPrice ?? null;
  }

  function resetPrices() {
    if (!Object.keys(app.prices).length) {
      setStatus(t("noSavedPrices"));
      return;
    }
    if (!confirm(t("resetPriceConfirm", Object.keys(app.prices).length))) return;
    app.prices = {};
    app.expandedItems.clear();
    save();
    render();
    setStatus(t("pricesReset"));
  }

  return { updateItems, loadAllRanks, getPrice, resetPrices, loadedRanks };
}
