const state = {
  dataset: null,
  mappings: [],
  filteredMappings: [],
  selectedMappingId: null,
  search: "",
  tactic: "all",
  logSource: "all",
  copyTimeout: null,
};

const elements = {
  search: document.querySelector("#search-input"),
  tacticFilter: document.querySelector("#tactic-filter"),
  logSourceFilter: document.querySelector("#log-source-filter"),
  techniqueList: document.querySelector("#technique-list"),
  resultCount: document.querySelector("#result-count"),
  detailPanel: document.querySelector("#detail-panel"),
  themeToggle: document.querySelector("#theme-toggle"),
  appStatus: document.querySelector("#app-status"),
};

const THEME_KEY = "mitre-sentinel-mapper-theme";
const KQL_KEYWORDS = new Set(["where", "summarize", "project", "extend", "let", "count()", "bin()"]);
const SENTINEL_TABLES = new Set(["SecurityEvent", "SigninLogs", "AuditLogs", "SecurityAlert"]);
const DEFENDER_TABLES = new Set(["EmailEvents"]);

initializeTheme();
bindEvents();
initializeApp();

function bindEvents() {
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    applyFilters();
  });

  elements.tacticFilter.addEventListener("change", (event) => {
    state.tactic = event.target.value;
    applyFilters();
  });

  elements.logSourceFilter.addEventListener("change", (event) => {
    state.logSource = event.target.value;
    applyFilters();
  });

  elements.techniqueList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mapping-id]");
    if (!button) {
      return;
    }

    const mapping = getMappingById(button.dataset.mappingId);
    if (mapping) {
      selectMapping(mapping, { updateHash: true, moveFocus: false });
    }
  });

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme, true);
  });

  window.addEventListener("hashchange", () => {
    const routeTechniqueId = readTechniqueIdFromHash();
    if (!routeTechniqueId) {
      return;
    }

    const routedMapping = findFirstMappingByTechniqueId(routeTechniqueId, state.filteredMappings.length ? state.filteredMappings : state.mappings);
    if (routedMapping) {
      selectMapping(routedMapping, { updateHash: false, moveFocus: true });
    }
  });
}

async function initializeApp() {
  try {
    announceStatus("Loading technique mappings...");
    const response = await fetch("./data/mitre-sentinel-mapping.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const dataset = await response.json();
    state.dataset = dataset;
    state.mappings = (dataset.kql_detections || []).map(enrichMapping);

    populateFilters();
    applyFilters();
    announceStatus(`Loaded ${state.mappings.length} technique mappings.`);
  } catch (error) {
    console.error(error);
    elements.resultCount.textContent = "Dataset unavailable";
    elements.detailPanel.innerHTML = `
      <section class="empty-detail" aria-live="polite">
        <h2>Unable to load mappings</h2>
        <p>Run this project through a local web server so the JSON dataset can load correctly.</p>
        <p class="detail-links"><a href="https://github.com/matthewfaber/mitre-sentinel-mapper" target="_blank" rel="noreferrer">Project source</a></p>
      </section>
    `;
    announceStatus("Unable to load the mapping dataset.");
  }
}

function enrichMapping(mapping) {
  const tactics = mapping.tactic.split(",").map((item) => item.trim()).filter(Boolean);
  const tables = extractTableNames(mapping);
  const platforms = deriveWhereRuns(tables);
  const techniqueUrl = buildMitreTechniqueUrl(mapping.technique_id);

  return {
    ...mapping,
    tactics,
    tables,
    platforms,
    techniqueUrl,
    searchBlob: [mapping.technique_id, mapping.technique_name, mapping.kql_example].join(" ").toLowerCase(),
  };
}

function extractTableNames(mapping) {
  const tables = new Set();
  const query = mapping.kql_example || "";
  const startMatch = query.match(/^\s*([A-Z][A-Za-z0-9]+)\b/);
  if (startMatch) {
    tables.add(startMatch[1]);
  }

  const joinRegex = /\|\s*(?:join(?:\s+kind=\w+)?|union)\s+([A-Z][A-Za-z0-9]+)\b/g;
  for (const match of query.matchAll(joinRegex)) {
    tables.add(match[1]);
  }

  const referenceMatch = (mapping.table_reference || "").match(/\b([A-Z][A-Za-z0-9]+)\b/);
  if (referenceMatch) {
    tables.add(referenceMatch[1]);
  }

  return Array.from(tables);
}

function deriveWhereRuns(tableNames) {
  const hasDefender = tableNames.some((table) => table.startsWith("Device") || DEFENDER_TABLES.has(table));
  const hasSentinel = tableNames.some((table) => SENTINEL_TABLES.has(table));
  const platforms = [];

  if (hasDefender) {
    platforms.push("Defender XDR Advanced Hunting");
  }

  if (hasSentinel) {
    platforms.push("Sentinel/Log Analytics");
  }

  if (!platforms.length) {
    platforms.push("Review source context");
  }

  return platforms;
}

function populateFilters() {
  const tacticOptions = [...new Set(state.mappings.flatMap((mapping) => mapping.tactics))].sort();
  const logSourceOptions = [...new Set(state.mappings.flatMap((mapping) => mapping.tables))].sort();

  fillSelect(elements.tacticFilter, tacticOptions, "All tactics");
  fillSelect(elements.logSourceFilter, logSourceOptions, "All log sources");
}

function fillSelect(selectElement, options, defaultLabel) {
  selectElement.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = defaultLabel;
  selectElement.append(allOption);

  options.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    selectElement.append(option);
  });
}

function applyFilters() {
  const filtered = state.mappings.filter((mapping) => {
    const matchesSearch = !state.search || mapping.searchBlob.includes(state.search);
    const matchesTactic = state.tactic === "all" || mapping.tactics.includes(state.tactic);
    const matchesLogSource = state.logSource === "all" || mapping.tables.includes(state.logSource);
    return matchesSearch && matchesTactic && matchesLogSource;
  });

  state.filteredMappings = filtered;
  renderTechniqueList();

  const currentSelection = getMappingById(state.selectedMappingId);
  if (currentSelection && filtered.some((mapping) => mapping.id === currentSelection.id)) {
    renderDetail(currentSelection);
    return;
  }

  const routeTechniqueId = readTechniqueIdFromHash();
  const routedMapping = routeTechniqueId ? findFirstMappingByTechniqueId(routeTechniqueId, filtered) : null;
  if (routedMapping) {
    selectMapping(routedMapping, { updateHash: false, moveFocus: false });
    return;
  }

  if (filtered.length) {
    selectMapping(filtered[0], { updateHash: true, moveFocus: false });
    return;
  }

  state.selectedMappingId = null;
  renderDetail(null);
}

function renderTechniqueList() {
  const total = state.filteredMappings.length;
  elements.resultCount.textContent = `${total} technique${total === 1 ? "" : "s"}`;

  if (!total) {
    elements.techniqueList.innerHTML = `
      <li class="empty-list-item">
        <p>No techniques match the current search and filter combination.</p>
      </li>
    `;
    return;
  }

  elements.techniqueList.innerHTML = state.filteredMappings
    .map((mapping) => {
      const isSelected = mapping.id === state.selectedMappingId;
      const tacticText = escapeHtml(mapping.tactic);
      const sourceText = escapeHtml(mapping.tables.join(", "));
      return `
        <li>
          <button
            type="button"
            class="technique-card${isSelected ? " is-selected" : ""}"
            data-mapping-id="${mapping.id}"
            aria-pressed="${isSelected ? "true" : "false"}"
          >
            <span class="technique-card__id">${escapeHtml(mapping.technique_id)}</span>
            <span class="technique-card__name">${escapeHtml(mapping.technique_name)}</span>
            <span class="technique-card__meta">${tacticText}</span>
            <span class="technique-card__sources">${sourceText}</span>
          </button>
        </li>
      `;
    })
    .join("");
}

function renderDetail(mapping) {
  if (!mapping) {
    elements.detailPanel.innerHTML = `
      <section class="empty-detail" aria-live="polite">
        <h2>No technique selected</h2>
        <p>Adjust the filters or search for a technique ID, name, or KQL phrase.</p>
      </section>
    `;
    return;
  }

  const tacticBadges = mapping.tactics.map((tactic) => `<span class="tag">${escapeHtml(tactic)}</span>`).join("");
  const whereRunsBadges = mapping.platforms.map((platform) => `<span class="badge">${escapeHtml(platform)}</span>`).join("");
  const sourceBadges = mapping.tables.map((table) => `<span class="mini-badge">${escapeHtml(table)}</span>`).join("");
  const highlightedKql = highlightKql(mapping.kql_example, mapping.tables);

  elements.detailPanel.innerHTML = `
    <article class="detail-card" aria-live="polite">
      <header class="detail-header">
        <div>
          <p class="detail-eyebrow">Technique detail</p>
          <h2>${escapeHtml(mapping.technique_id)} · ${escapeHtml(mapping.technique_name)}</h2>
        </div>
        <div class="detail-actions">
          <a class="text-link" href="${mapping.techniqueUrl}" target="_blank" rel="noreferrer">MITRE ATT&amp;CK</a>
          <a class="text-link" href="${mapping.source_url}" target="_blank" rel="noreferrer">Source link</a>
        </div>
      </header>

      <div class="detail-meta">
        <div>
          <p class="section-label">Tactic</p>
          <div class="tag-row">${tacticBadges}</div>
        </div>
        <div>
          <p class="section-label">Where this runs</p>
          <div class="tag-row">${whereRunsBadges}</div>
        </div>
      </div>

      <section class="detail-section">
        <div class="section-header">
          <div>
            <p class="section-label">KQL example</p>
            <p class="section-subtitle">Starter logic only — tune before production use.</p>
          </div>
          <button type="button" class="copy-button" id="copy-kql-button">Copy KQL</button>
        </div>
        <pre class="kql-block"><code>${highlightedKql}</code></pre>
      </section>

      <aside class="caveat-box" aria-label="Technique caveat">
        <p class="section-label">Caveat</p>
        <p>${escapeHtml(mapping.kql_caveat)}</p>
      </aside>

      <section class="detail-section citations-section">
        <p class="section-label">Visible citations and sources</p>
        <div class="tag-row">${sourceBadges}</div>
        <ul class="citation-list">
          <li><strong>MITRE technique:</strong> <a href="${mapping.techniqueUrl}" target="_blank" rel="noreferrer">${escapeHtml(mapping.technique_id)} on attack.mitre.org</a></li>
          <li><strong>Source citation:</strong> <a href="${mapping.source_url}" target="_blank" rel="noreferrer">${escapeHtml(mapping.source_url)}</a></li>
          <li><strong>Telemetry reference:</strong> ${escapeHtml(mapping.table_reference)}</li>
        </ul>
      </section>
    </article>
  `;

  const copyButton = document.querySelector("#copy-kql-button");
  copyButton.addEventListener("click", () => copyKql(mapping.kql_example, copyButton));
}

async function copyKql(kql, button) {
  const defaultLabel = "Copy KQL";

  try {
    await navigator.clipboard.writeText(kql);
    button.textContent = "Copied";
    announceStatus("KQL copied to clipboard.");
  } catch (error) {
    console.error(error);
    button.textContent = "Copy failed";
    announceStatus("Clipboard copy failed in this browser context.");
  }

  window.clearTimeout(state.copyTimeout);
  state.copyTimeout = window.setTimeout(() => {
    button.textContent = defaultLabel;
  }, 1800);
}

function selectMapping(mapping, options = {}) {
  state.selectedMappingId = mapping.id;
  renderTechniqueList();
  renderDetail(mapping);

  if (options.updateHash !== false) {
    writeTechniqueHash(mapping.technique_id);
  }

  if (options.moveFocus) {
    elements.detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function getMappingById(mappingId) {
  return state.mappings.find((mapping) => mapping.id === mappingId) || null;
}

function findFirstMappingByTechniqueId(techniqueId, candidates) {
  return candidates.find((mapping) => mapping.technique_id.toLowerCase() === techniqueId.toLowerCase()) || null;
}

function readTechniqueIdFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return "";
  }

  const params = new URLSearchParams(hash);
  return params.get("t") || "";
}

function writeTechniqueHash(techniqueId) {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  params.set("t", techniqueId);
  const nextHash = `#${params.toString()}`;
  if (window.location.hash !== nextHash) {
    history.replaceState(null, "", nextHash);
  }
}

function buildMitreTechniqueUrl(techniqueId) {
  const [baseTechnique, subTechnique] = techniqueId.split(".");
  return subTechnique
    ? `https://attack.mitre.org/techniques/${baseTechnique}/${subTechnique}/`
    : `https://attack.mitre.org/techniques/${baseTechnique}/`;
}

function highlightKql(kql, tableNames) {
  const tables = new Set(tableNames);
  const tokenRegex = /"(?:\\.|[^"\\])*"|count\(\)|bin\(\)|\b(?:where|summarize|project|extend|let)\b|\b[A-Z][A-Za-z0-9]+\b/gi;
  let cursor = 0;
  let result = "";

  for (const match of kql.matchAll(tokenRegex)) {
    const token = match[0];
    const index = match.index ?? 0;
    result += escapeHtml(kql.slice(cursor, index));

    if (token.startsWith('"')) {
      result += `<span class="token-string">${escapeHtml(token)}</span>`;
    } else if (KQL_KEYWORDS.has(token.toLowerCase())) {
      result += `<span class="token-keyword">${escapeHtml(token)}</span>`;
    } else if (tables.has(token)) {
      result += `<span class="token-table">${escapeHtml(token)}</span>`;
    } else {
      result += escapeHtml(token);
    }

    cursor = index + token.length;
  }

  result += escapeHtml(kql.slice(cursor));
  return result;
}

function initializeTheme() {
  const savedTheme = window.localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme || (prefersDark ? "dark" : "light"), false);
}

function setTheme(theme, persist) {
  document.documentElement.dataset.theme = theme;
  elements.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  elements.themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  if (persist) {
    window.localStorage.setItem(THEME_KEY, theme);
  }
}

function announceStatus(message) {
  elements.appStatus.textContent = message;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
