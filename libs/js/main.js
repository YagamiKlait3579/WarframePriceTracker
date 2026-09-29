import { createState } from "./state.js";
import { createTranslator } from "./i18n.js";
import { loadData, saveData, buildExport, validateImport, importData } from "./store.js";
import { createApi } from "./api.js";
import { buildAutoName, normalizeItemInfo, parseMarketUrl } from "./data.js";
import { createPriceService } from "./prices.js";
import { createUI } from "./ui.js";

const app = createState();
const stored = loadData();
Object.assign(app, stored);
const t = createTranslator(() => app.settings.language);

const setStatus = text => { app.statusText = text; document.getElementById("statusText").textContent = text; };
const save = () => saveData(app);
const api = createApi({ getSettings: () => app.settings });

async function getItemInfo(item, force = false) {
  if (!force && Number.isInteger(item.maxRank) && item.marketNameRu !== undefined && item.marketNameEn !== undefined && item.rarity !== undefined) {
    return { maxRank: item.maxRank, nameRu: item.marketNameRu, nameEn: item.marketNameEn, rarity: item.rarity };
  }
  const info = normalizeItemInfo(await api.getItem(item.slug));
  if (item.slug) {
    item.maxRank = info.maxRank;
    item.marketNameRu = info.nameRu;
    item.marketNameEn = info.nameEn;
    item.rarity = info.rarity;
  }
  save();
  return info;
}

const prices = createPriceService({ api, app, save, render: () => ui?.render(), setStatus, t });

function buildName(info, slug) { return buildAutoName(info, slug, app.settings.language); }
function openSettings() { document.getElementById("settingsDialog").showModal(); ui.renderCategoryEditor(); ui.refreshParentSelect(); ui.populateCategorySelect(); }

let ui;
ui = createUI({
  app, t, save, prices, getItemInfo, buildName, setStatus, openSettings,
  onExport: () => {
    const data = JSON.stringify(buildExport(app), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    link.href = url;
    link.download = `WarframePriceTracker_backup_${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus(t("exported"));
  },
  onImport: async data => {
    validateImport(data);
    importData(app, data);
    save();
  }
});

ui.bind();
ui.applyLanguage();
ui.renderCategoryEditor();
ui.refreshParentSelect();
ui.populateCategorySelect();
ui.render();
setStatus(t("ready"));

// Keep category/item counts and relative timestamps visually current without touching the API.
setInterval(() => ui.render(), 30_000);
