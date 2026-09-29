export const STORAGE_KEY = "wf-price-tracker-v1";

export const DEFAULT_SETTINGS = Object.freeze({
  language: "ru",
  crossplay: true,
  playerStatus: "all",
  sortKey: "name",
  sortDir: "asc",
  collapsedCategories: {}
});

export function createState() {
  return {
    categories: [],
    items: [],
    prices: {},
    settings: structuredClone(DEFAULT_SETTINGS),
    filter: "",
    expandedItems: new Set(),
    refreshing: false,
    statusText: ""
  };
}
