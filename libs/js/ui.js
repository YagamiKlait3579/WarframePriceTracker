import { categoryById, childrenOf, collectCategoryTreeIds, compareItems, formatRarity, itemName, marketUrl, priceKey, parseMarketUrl, moveCategory } from "./data.js";
import { STORAGE_KEY } from "./state.js";

export function createUI({ app, t, save, prices, getItemInfo, buildName, setStatus, openSettings, onExport, onImport }) {
  const $ = id => document.getElementById(id);

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  }

  function timeAgo(timestamp) {
    if (!timestamp) return "";
    const sec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (sec < 60) return app.settings.language === "en" ? "just now" : "только что";
    if (sec < 3600) return app.settings.language === "en" ? `${Math.floor(sec / 60)} min ago` : `${Math.floor(sec / 60)} мин назад`;
    if (sec < 86400) return app.settings.language === "en" ? `${Math.floor(sec / 3600)} hr ago` : `${Math.floor(sec / 3600)} ч назад`;
    return app.settings.language === "en" ? `${Math.floor(sec / 86400)} d ago` : `${Math.floor(sec / 86400)} дн назад`;
  }

  function formatPrice(value) { return value == null ? "—" : `${value} <span class="variant">pl</span>`; }

  function visibleContent(categoryId, filter) {
    const own = app.items.some(item => item.categoryIds.includes(categoryId) && itemName(item, app.settings.language).toLowerCase().includes(filter));
    return own || childrenOf(app.categories, categoryId).some(child => visibleContent(child.id, filter));
  }

  function sortHeader(label, key) {
    const active = app.settings.sortKey === key;
    const arrow = active ? (app.settings.sortDir === "asc" ? " ↑" : " ↓") : "";
    return `<button class="sort-header ${active ? "active" : ""}" data-action="sort" data-key="${key}" title="${esc(t("sort"))}">${esc(label)}${arrow}</button>`;
  }

  function priceHeader() {
    return `<div class="price-header">
      <div>${sortHeader(t("item"), "name")}</div>
      <div>${sortHeader(t("rarity"), "rarity")}</div>
      <div>${sortHeader(t("minRank"), "minRankPrice")}</div>
      <div>${sortHeader(t("maxRank"), "maxRankPrice")}</div>
      <div>${esc(t("updated"))}</div><div></div>
    </div>`;
  }

  function itemRow(item) {
    const expanded = app.expandedItems.has(item.id);
    const maxRank = item.maxRank || 0;
    const minRecord = app.prices[priceKey(item.slug, 0)];
    const maxRecord = app.prices[priceKey(item.slug, maxRank > 0 ? maxRank : null)];
    const minPrice = minRecord?.minPrice ?? null;
    const maxPrice = maxRecord?.minPrice ?? null;
    const updated = Math.max(minRecord?.time || 0, maxRecord?.time || 0);
    const rarity = item.rarity || "unknown";

    let html = `<div class="price-row item-main-row">
      <div class="item-title-cell">
        <button class="favorite-btn ${item.favorite ? "active" : ""}" data-action="favorite" data-id="${esc(item.id)}" title="${esc(t(item.favorite ? "favoriteRemove" : "favoriteAdd"))}" aria-label="${esc(t(item.favorite ? "favoriteRemove" : "favoriteAdd"))}">${item.favorite ? "★" : "☆"}</button>
        ${maxRank > 0 ? `<button class="expand-item" data-action="expand" data-id="${esc(item.id)}">${expanded ? "▼" : "▶"}</button>` : `<span class="expand-placeholder"></span>`}
        <div><a class="item-name" href="${esc(marketUrl(item.slug, app.settings.language))}" target="_blank" rel="noopener">${esc(itemName(item, app.settings.language))}</a>
        <div class="variant">${maxRank > 0 ? esc(t("rankRange", 0, maxRank)) : esc(t("noRankLoaded"))}</div></div>
      </div>
      <div class="rarity-cell"><span class="rarity rarity-${esc(rarity)}">${esc(formatRarity(rarity, t))}</span></div>
      <div class="price ${minPrice == null ? "none" : "good"}">${formatPrice(minPrice)}</div>
      <div class="price ${maxPrice == null ? "none" : "good"}">${formatPrice(maxPrice)}</div>
      <div class="updated">${esc(timeAgo(updated))}</div>
      <button class="more-btn" data-action="edit-item" data-id="${esc(item.id)}" title="${esc(t("edit"))}">⋮</button>
    </div>`;

    if (expanded && maxRank > 0) {
      html += `<div class="rank-list">`;
      for (let rank = 0; rank <= maxRank; rank++) {
        const record = app.prices[priceKey(item.slug, rank)];
        const min = record?.minPrice ?? null;
        const max = record?.maxPrice ?? null;
        html += `<div class="price-row rank-row">
          <div class="rank-name">${esc(t("rank"))} ${rank}</div><div></div>
          <div class="price ${min == null ? "none" : "good"}">${formatPrice(min)}</div>
          <div class="price ${max == null ? "none" : "good"}">${formatPrice(max)}</div>
          <div class="updated">${esc(timeAgo(record?.time))}</div><span></span>
        </div>`;
      }
      html += `</div>`;
    }
    return html;
  }

  function categoryHtml(category, depth, filter) {
    if (!visibleContent(category.id, filter)) return { html: "", count: 0 };
    const collapsed = !!app.settings.collapsedCategories[category.id];
    const direct = app.items.filter(item => item.categoryIds.includes(category.id) && itemName(item, app.settings.language).toLowerCase().includes(filter));
    direct.sort((a, b) => compareItems(a, b, app.settings, prices.getPrice));
    const children = childrenOf(app.categories, category.id).filter(child => visibleContent(child.id, filter));
    const totalDirect = app.items.filter(item => item.categoryIds.includes(category.id)).length;
    let body = "";
    let count = direct.length;
    if (!collapsed && direct.length) body += priceHeader() + direct.map(itemRow).join("");
    if (!collapsed) for (const child of children) {
      const result = categoryHtml(child, depth + 1, filter);
      body += result.html; count += result.count;
    }
    if (!body) body = `<div class="category-empty">${esc(t("categoryEmpty"))}</div>`;
    const countText = app.settings.language === "en" ? `${totalDirect} item${totalDirect === 1 ? "" : "s"}` : `${totalDirect} предмет${totalDirect === 1 ? "" : "ов"}`;
    return { count, html: `<section class="category" style="--depth:${depth}">
      <div class="category-head" data-action="toggle-category" data-id="${esc(category.id)}">
        <span class="chevron">${collapsed ? "▶" : "▼"}</span><span class="name">${esc(category.name)}</span>
        <button class="category-refresh-btn" data-action="refresh-category" data-id="${esc(category.id)}" title="${esc(t("categoryRefresh"))}">⟳</button>
        <span class="count">${esc(countText)}</span>
      </div><div class="category-body ${collapsed ? "hidden" : ""}">${body}</div>
    </section>` };
  }

  function render() {
    const root = $("categories");
    const filter = app.filter.trim().toLowerCase();
    let html = "";
    let visible = 0;
    for (const category of childrenOf(app.categories, null)) {
      const result = categoryHtml(category, 0, filter);
      html += result.html; visible += result.count;
    }
    root.innerHTML = html;
    $("emptyState").classList.toggle("hidden", visible > 0);
    if (!visible && app.categories.length && filter) $("emptyText").textContent = t("noResults");
    else $("emptyText").textContent = t("emptyText");
  }

  function applyLanguage() {
    document.documentElement.lang = app.settings.language;
    document.title = t("title");
    const textMap = {
      appTitle:"title", refreshBtn:"refresh", refreshAllBtn:"refreshAll", settingsBtn:"settings", crossplayLabel:"crossplay", playerFilterLabel:"playerFilter",
      emptyTitle:"emptyTitle", emptyText:"emptyText", emptySettingsBtn:"openSettings", settingsTitle:"settingsTitle", categoriesTabBtn:"categories", itemsTabBtn:"items", addCategoryBtn:"addCategory", addItemBtn:"addItem",
      languageLabel:"language", categoryParentHint:"parentHint", itemsHint:"multiCategoryHint", exportBtn:"export", importBtn:"import", resetPricesBtn:"resetPrices", resetBtn:"resetAll", settingsCloseBtn:"close",
      marketLinkLabel:"marketLink", nameLabel:"name", categoriesLabel:"categoriesLabel", itemCancelBtn:"cancel",
      moveCategoryTitle:"moveCategoryTitle", moveCategoryParentLabel:"moveCategoryParent", moveCategoryPositionLabel:"moveCategoryPosition", moveCategoryHint:"moveCategoryHint", moveCategorySaveBtn:"moveCategorySave", moveCategoryCancelBtn:"moveCategoryCancel"
    };
    for (const [id, key] of Object.entries(textMap)) $(id).textContent = t(key);
    $("filterInput").placeholder = t("search");
    $("categoryNameInput").placeholder = t("newCategory");
    $("itemNameInput").placeholder = t("optionalName");
    $("itemUrlInput").placeholder = "https://warframe.market/ru/items/arcane_energize?type=sell";
    $("playerStatusSelect").innerHTML = `<option value="all">${esc(t("playerAll"))}</option><option value="online">${esc(t("playerOnline"))}</option><option value="ingame">${esc(t("playerIngame"))}</option>`;
    $("languageSelect").value = app.settings.language;
    $("playerStatusSelect").value = app.settings.playerStatus;
    $("crossplayToggle").checked = app.settings.crossplay;
    render();
  }

  function renderCategoryEditor() {
    const root = $("categoryEditor");
    root.innerHTML = "";
    if (!app.categories.length) { root.innerHTML = `<div class="hint">${esc(t("noCategories"))}</div>`; return; }

    function node(target, cat, depth) {
      const children = childrenOf(app.categories, cat.id);
      const siblings = childrenOf(app.categories, cat.parentId ?? null);
      const index = siblings.findIndex(x => x.id === cat.id);
      const row = document.createElement("div");
      row.className = "category-editor-node";
      row.style.setProperty("--depth", depth);
      row.innerHTML = `<div class="editor-row category-editor-row"><span class="category-tree-marker">${children.length ? "▾" : "•"}</span><input class="grow" value="${esc(cat.name)}"><button class="small-btn" data-act="child">${esc(t("addSubcategory"))}</button><button class="small-btn" data-act="move">${esc(t("moveCategory"))}</button><button class="small-btn" data-act="up" ${index <= 0 ? "disabled" : ""}>↑</button><button class="small-btn" data-act="down" ${index >= siblings.length - 1 ? "disabled" : ""}>↓</button><button class="small-btn danger" data-act="delete">${esc(t("delete"))}</button></div><div class="category-editor-children"></div>`;
      row.querySelector("input").onchange = e => { const value = e.target.value.trim(); if (!value) return; cat.name = value; save(); renderCategoryEditor(); refreshParentSelect(); populateCategorySelect(); render(); };
      row.querySelector('[data-act="child"]').onclick = () => { const name = prompt(t("subcategoryName", cat.name)); if (!name?.trim()) return; app.categories.push({ id: crypto.randomUUID(), name: name.trim(), parentId: cat.id }); save(); renderCategoryEditor(); refreshParentSelect(); populateCategorySelect(); render(); };
      row.querySelector('[data-act="move"]').onclick = () => openMoveCategoryDialog(cat.id);
      row.querySelector('[data-act="up"]').onclick = () => { if (index > 0) moveCategory(app.categories, cat.id, cat.parentId ?? null, index - 1); save(); renderCategoryEditor(); refreshParentSelect(); populateCategorySelect(); render(); };
      row.querySelector('[data-act="down"]').onclick = () => { if (index < siblings.length - 1) moveCategory(app.categories, cat.id, cat.parentId ?? null, index + 1); save(); renderCategoryEditor(); refreshParentSelect(); populateCategorySelect(); render(); };
      row.querySelector('[data-act="delete"]').onclick = () => deleteCategoryTree(cat);
      target.appendChild(row);
      const childRoot = row.querySelector(".category-editor-children");
      children.forEach(child => node(childRoot, child, depth + 1));
    }

    childrenOf(app.categories, null).forEach(cat => node(root, cat, 0));
  }

  function moveCategoryOptions(excludedIds, selectedParent) {
    function build(parentId = null, depth = 0) {
      return childrenOf(app.categories, parentId)
        .filter(cat => !excludedIds.has(cat.id))
        .map(cat => `<option value="${esc(cat.id)}" ${cat.id === selectedParent ? "selected" : ""}>${esc(`${"　".repeat(depth)}${depth ? "└ " : ""}${cat.name}`)}</option>${build(cat.id, depth + 1)}`)
        .join("");
    }
    return build();
  }

  function refreshMovePositionSelect(categoryId, parentId, preferredIndex = 0) {
    const select = $("moveCategoryPositionSelect");
    const subtree = new Set(collectCategoryTreeIds(app.categories, categoryId));
    const siblings = childrenOf(app.categories, parentId).filter(cat => !subtree.has(cat.id));
    const options = [`<option value="0">${esc(t("moveCategoryFirst"))}</option>`];
    for (let index = 1; index < siblings.length; index++) {
      options.push(`<option value="${index}">${esc(t("moveCategoryBefore", siblings[index].name))}</option>`);
    }
    if (siblings.length) options.push(`<option value="${siblings.length}">${esc(t("moveCategoryLast"))}</option>`);
    select.innerHTML = options.join("");
    const max = siblings.length;
    select.value = String(Math.max(0, Math.min(Number(preferredIndex) || 0, max)));
  }

  function openMoveCategoryDialog(categoryId) {
    const category = categoryById(app.categories, categoryId);
    if (!category) return;
    const excluded = new Set(collectCategoryTreeIds(app.categories, categoryId));
    const parentSelect = $("moveCategoryParentSelect");
    const currentParent = category.parentId ?? null;
    parentSelect.innerHTML = `<option value="">${esc(t("moveCategoryNoParent"))}</option>${moveCategoryOptions(excluded, currentParent)}`;
    parentSelect.value = currentParent || "";
    refreshMovePositionSelect(categoryId, currentParent, childrenOf(app.categories, currentParent).findIndex(x => x.id === categoryId));
    $("moveCategoryDialog").dataset.categoryId = categoryId;
    $("moveCategoryError").textContent = "";
    $("moveCategoryDialog").showModal();
  }

  function saveMovedCategory() {
    const dialog = $("moveCategoryDialog");
    const categoryId = dialog.dataset.categoryId;
    const parentId = $("moveCategoryParentSelect").value || null;
    const position = Number($("moveCategoryPositionSelect").value) || 0;
    try {
      moveCategory(app.categories, categoryId, parentId, position);
      save();
      dialog.close();
      renderCategoryEditor(); refreshParentSelect(); populateCategorySelect(); render();
    } catch (error) {
      $("moveCategoryError").textContent = t(error.message || "apiError");
    }
  }

  function swapCategoryOrder(a, b) {
    const siblings = childrenOf(app.categories, a.parentId ?? null);
    const index = siblings.findIndex(x => x.id === a.id);
    if (index < 0) return;
    moveCategory(app.categories, a.id, a.parentId ?? null, index + (siblings[index + 1]?.id === b.id ? 1 : -1));
    save(); renderCategoryEditor(); refreshParentSelect(); populateCategorySelect(); render();
  }

  function deleteCategoryTree(cat) {
    const ids = collectCategoryTreeIds(app.categories, cat.id); const set = new Set(ids);
    const affected = app.items.filter(item => item.categoryIds.some(id => set.has(id))).length;
    let message = t("deleteCategoryConfirm", cat.name) + "?";
    if (affected) message += `\n${t("affectedItems", affected)}`;
    message += `\n\n${t("categoryDeleteDetails")}`;
    if (!confirm(message)) return;
    app.categories = app.categories.filter(c => !set.has(c.id));
    for (const item of app.items) item.categoryIds = item.categoryIds.filter(id => !set.has(id));
    for (const id of ids) delete app.settings.collapsedCategories[id];
    save(); renderCategoryEditor(); refreshParentSelect(); populateCategorySelect(); render();
  }

  function categoryOptions(selected = "") {
    function build(parentId = null, depth = 0) {
      return childrenOf(app.categories, parentId).map(cat => `<option value="${esc(cat.id)}" ${cat.id === selected ? "selected" : ""}>${esc(`${"　".repeat(depth)}${depth ? "└ " : ""}${cat.name}`)}</option>${build(cat.id, depth + 1)}`).join("");
    }
    return build();
  }

  function populateCategorySelect() {
    const select = $("categorySelect"); const old = select.value;
    select.innerHTML = `<option value="">${esc(t("allCategories"))}</option>${categoryOptions(old)}`;
    if ([...select.options].some(o => o.value === old)) select.value = old;
    renderItemEditor();
  }

  function renderItemEditor() {
    const root = $("itemEditor"); const categoryId = $("categorySelect").value;
    const items = app.items.filter(item => !categoryId || item.categoryIds.includes(categoryId));
    root.innerHTML = items.length ? "" : `<div class="hint">${esc(t("noItems"))}</div>`;
    for (const item of items) {
      const row = document.createElement("div"); row.className = "editor-row";
      const cats = item.categoryIds.map(id => categoryById(app.categories, id)?.name).filter(Boolean);
      row.innerHTML = `<div class="grow"><strong>${esc(itemName(item, app.settings.language))}</strong><div class="muted">${esc(item.slug)} · ${item.maxRank > 0 ? `${app.settings.language === "en" ? "Max rank" : "Макс. ранг"}: ${item.maxRank}` : t("noRankLoaded")}</div><div class="item-category-tags">${cats.map(c => `<span>${esc(c)}</span>`).join("")}</div></div><button class="small-btn" data-act="info">${esc(t("infoUpdate"))}</button><button class="small-btn" data-act="edit">${esc(t("edit"))}</button><button class="small-btn danger" data-act="delete">${esc(t("delete"))}</button>`;
      row.querySelector('[data-act="info"]').onclick = async () => { try { await getItemInfo(item, true); renderItemEditor(); render(); } catch (e) { alert(e.message); } };
      row.querySelector('[data-act="edit"]').onclick = () => openItemDialog(item.id);
      row.querySelector('[data-act="delete"]').onclick = () => { if (!confirm(t("deleteItemConfirm", itemName(item, app.settings.language)))) return; app.items = app.items.filter(x => x.id !== item.id); for (const key of Object.keys(app.prices)) if (key.startsWith(`${item.slug}|`)) delete app.prices[key]; save(); renderItemEditor(); render(); };
      root.appendChild(row);
    }
  }

  function renderCategoryChecklist(selectedIds = []) {
    const selected = new Set(selectedIds); const root = $("itemCategoryList");
    function build(parentId = null, depth = 0) {
      let html = "";
      for (const cat of childrenOf(app.categories, parentId)) {
        html += `<label class="category-check" style="--depth:${depth}"><input type="checkbox" data-category-check value="${esc(cat.id)}" ${selected.has(cat.id) ? "checked" : ""}><span class="category-check-name">${esc(cat.name)}</span></label>`;
        html += build(cat.id, depth + 1);
      }
      return html;
    }
    root.innerHTML = build() || `<div class="hint">${esc(t("noCategories"))}</div>`;
  }

  function openItemDialog(itemId = null) {
    if (!app.categories.length) { alert(t("noCategoriesYet")); return; }
    const dialog = $("itemDialog");
    const item = itemId ? app.items.find(x => x.id === itemId) : null;
    dialog.dataset.editId = item?.id || "";
    $("itemDialogTitle").textContent = t(item ? "editItemTitle" : "addItemTitle");
    $("saveItemBtn").textContent = t(item ? "save" : "add");
    $("itemUrlInput").disabled = !!item;
    $("itemUrlInput").value = item ? marketUrl(item.slug, app.settings.language) : "";
    $("itemNameInput").value = item?.name || "";
    $("urlError").textContent = "";
    const defaultCategoryIds = item ? item.categoryIds : ($("categorySelect").value ? [$('categorySelect').value] : []);
    renderCategoryChecklist(defaultCategoryIds);
    dialog.showModal();
    setTimeout(() => $(item ? "itemNameInput" : "itemUrlInput").focus(), 50);
  }

  function checkedCategories() { return [...$("itemCategoryList").querySelectorAll("input:checked")].map(input => input.value); }

  async function saveItemDialog() {
    const dialog = $("itemDialog"), error = $("urlError"), button = $("saveItemBtn"); error.textContent = "";
    try {
      const categoryIds = checkedCategories(); if (!categoryIds.length) throw new Error("chooseCategory");
      const editId = dialog.dataset.editId;
      if (editId) {
        const item = app.items.find(x => x.id === editId); const name = $("itemNameInput").value.trim();
        if (!name) throw new Error("needName");
        item.name = name; item.autoName = false; item.categoryIds = categoryIds; save(); dialog.close(); renderItemEditor(); render(); return;
      }
      const parsed = parseMarketUrl($("itemUrlInput").value);
      if (app.items.some(item => item.slug === parsed.slug)) throw new Error("duplicate");
      button.disabled = true; button.textContent = t("loading");
      const info = await getItemInfo({ slug: parsed.slug, maxRank: 0 }, true);
      const provided = $("itemNameInput").value.trim();
      const name = provided || buildName(info, parsed.slug);
      app.items.push({ id: crypto.randomUUID(), slug: parsed.slug, name, autoName: !provided, categoryIds, favorite: false, maxRank: info.maxRank, marketNameRu: info.nameRu, marketNameEn: info.nameEn, rarity: info.rarity });
      save(); dialog.close(); renderItemEditor(); render(); setStatus(t("added", name));
    } catch (e) { error.textContent = t(e.message?.split(":")[0] || "apiError"); console.error(e); }
    finally { button.disabled = false; button.textContent = t(dialog.dataset.editId ? "save" : "add"); }
  }

  function bind() {
    $("categories").addEventListener("click", async e => {
      const action = e.target.closest("[data-action]")?.dataset.action; const target = e.target.closest("[data-action]"); if (!target) return;
      if (action === "toggle-category") { const id = target.dataset.id; app.settings.collapsedCategories[id] = !app.settings.collapsedCategories[id]; save(); render(); }
      else if (action === "favorite") { e.stopPropagation(); const item = app.items.find(x => x.id === target.dataset.id); if (item) { item.favorite = !item.favorite; save(); render(); } }
      else if (action === "refresh-category") { e.stopPropagation(); const ids = collectCategoryTreeIds(app.categories, target.dataset.id); const set = new Set(ids); await prices.updateItems(app.items.filter(item => item.categoryIds.some(id => set.has(id))), { label: categoryById(app.categories, target.dataset.id)?.name || "" }); }
      else if (action === "sort") { e.stopPropagation(); const key = target.dataset.key; if (app.settings.sortKey === key) app.settings.sortDir = app.settings.sortDir === "asc" ? "desc" : "asc"; else { app.settings.sortKey = key; app.settings.sortDir = "asc"; } save(); render(); }
      else if (action === "expand") { const id = target.dataset.id; if (app.expandedItems.has(id)) app.expandedItems.delete(id); else { app.expandedItems.add(id); const item = app.items.find(x => x.id === id); if (item) prices.loadAllRanks(item); } render(); }
      else if (action === "edit-item") openItemDialog(target.dataset.id);
    });

    $("filterInput").oninput = e => { app.filter = e.target.value; render(); };
    $("emptySettingsBtn").onclick = () => openSettings();
    $("settingsBtn").onclick = () => openSettings();
    $("refreshBtn").onclick = () => prices.updateItems(app.items);
    $("refreshAllBtn").onclick = () => prices.updateItems(app.items, { full: true });
    $("crossplayToggle").onchange = e => { app.settings.crossplay = e.target.checked; save(); };
    $("playerStatusSelect").onchange = e => { app.settings.playerStatus = e.target.value; save(); };
    $("languageSelect").onchange = () => { app.settings.language = $("languageSelect").value; save(); applyLanguage(); renderCategoryEditor(); populateCategorySelect(); setStatus(t("languageSaved")); };
    $("categorySelect").onchange = renderItemEditor;
    $("addItemBtn").onclick = () => openItemDialog();
    $("saveItemBtn").onclick = saveItemDialog;
    $("addCategoryBtn").onclick = () => { const name = $("categoryNameInput").value.trim(); if (!name) return; app.categories.push({ id: crypto.randomUUID(), name, parentId: $("categoryParentSelect").value || null }); $("categoryNameInput").value = ""; save(); renderCategoryEditor(); populateCategorySelect(); render(); };
    $("exportBtn").onclick = () => onExport();
    $("importBtn").onclick = () => $("importFileInput").click();
    $("importFileInput").onchange = e => importFile(e.target.files[0]);
    $("resetPricesBtn").onclick = () => prices.resetPrices();
    $("resetBtn").onclick = () => { if (!confirm(t("resetAllConfirm"))) return; localStorage.removeItem(STORAGE_KEY); location.reload(); };
    $("moveCategoryParentSelect").onchange = () => refreshMovePositionSelect($("moveCategoryDialog").dataset.categoryId, $("moveCategoryParentSelect").value || null, 0);
    $("moveCategorySaveBtn").onclick = saveMovedCategory;
    document.querySelectorAll("[data-close]").forEach(btn => btn.onclick = () => $(btn.dataset.close).close());
    document.querySelectorAll(".tab").forEach(btn => btn.onclick = () => switchTab(btn.dataset.tab));
  }

  function switchTab(tab) { document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === tab)); document.querySelectorAll(".tab-content").forEach(x => x.classList.toggle("active", x.id === tab)); }

  async function importFile(file) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      await onImport(data);
      applyLanguage(); renderCategoryEditor(); refreshParentSelect(); populateCategorySelect(); setStatus(t("imported"));
    } catch (e) {
      const key = String(e?.message || "invalidFile").split(":")[0];
      alert(`${t("importFailed")}\n\n${t(key)}`);
    } finally { $("importFileInput").value = ""; }
  }

  function refreshParentSelect() { const select = $("categoryParentSelect"), old = select.value; select.innerHTML = `<option value="">${esc(t("noParent"))}</option>${categoryOptions(old)}`; if ([...select.options].some(o => o.value === old)) select.value = old; }

  return { render, applyLanguage, renderCategoryEditor, populateCategorySelect, renderItemEditor, bind, refreshParentSelect, openItemDialog };
}
