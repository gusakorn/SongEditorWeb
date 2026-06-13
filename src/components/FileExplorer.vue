<template>
  <aside class="file-explorer" :class="{ open }">
    <div class="section">
      <div class="compact-header">
        <div class="section-label">{{ t.songs }}</div>
        <input
          v-model.trim="libraryFilter"
          class="header-filter-input"
          type="text"
          :placeholder="t.filterSongs"
        />
        <button class="btn-square" @click="refreshRoot()" :data-tooltip="t.refreshLibrary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"></path>
            <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"></path>
          </svg>
        </button>
        <button class="btn-square" @click="pickRoot" :title="pendingRoot ? t.restoreFilesAccess : (rootHandle ? t.changeRoot : t.pickRoot)">
          <svg v-if="!rootHandle && !pendingRoot" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <path d="M12 12h6"></path>
            <path d="M15 9l3 3-3 3"></path>
          </svg>
        </button>
      </div>

      <div ref="filesList" class="library-tree">
        <div v-if="!rootHandle" class="empty">{{ t.noFolder }}</div>
        <div v-else-if="!visibleLibraryRows.length" class="empty">{{ t.noSongsInFolder }}</div>
        <ul v-else class="library-list">
          <li v-for="row in visibleLibraryRows" :key="row.id">
            <div
              v-if="row.kind === 'folder'"
              class="library-row folder-entry"
              :class="{ selected: selectedFolderPath === row.path }"
              :style="{ '--depth': row.depth }"
            >
              <button class="folder-select" @click="handleFolderClick(row)" :data-tooltip="row.label">
                <span class="folder-chevron" :class="{ placeholder: !row.hasChildren }">
                  <svg v-if="row.hasChildren" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline :points="isFolderExpanded(row.path) ? '6 9 12 15 18 9' : '9 6 15 12 9 18'"></polyline>
                  </svg>
                </span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="folder-name">{{ row.label }}</span>
              </button>
              <span class="row-count">{{ row.songCount }}</span>
            </div>

            <div
              v-else
              class="library-row file-entry"
              :class="{ selected: activeFilePath === row.file.relativePath }"
              :style="{ '--depth': row.depth }"
              @click="openFile(row.file.handle, row.file.relativePath)"
            >
              <div class="file-meta" :data-tooltip="row.file.name">
                <span class="file-name">{{ row.file.name }}</span>
                <span v-if="row.file.artist" class="file-artist">{{ row.file.artist }}</span>
              </div>
              <button
                v-if="setRoot"
                class="btn-add inline-add"
                @click.stop="addSongToSetlist(row.file)"
                :data-tooltip="t.addSetlist"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <div class="more-menu-container">
                <button
                  class="btn-more file-menu-trigger"
                  @click.stop="toggleMenu(row.file.relativePath)"
                  :data-tooltip="t.moreActions"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.7"></circle>
                    <circle cx="12" cy="12" r="1.7"></circle>
                    <circle cx="12" cy="19" r="1.7"></circle>
                  </svg>
                </button>
                <div v-if="activeMenu === row.file.relativePath" class="more-menu">
                  <button @click.stop="renameFile(row.file)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                    </svg>
                    {{ t.rename }}
                  </button>
                  <button class="danger" @click.stop="deleteFile(row.file)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    {{ t.delete }}
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="section section-sets">
      <div class="compact-header">
        <div class="compact-title-block">
          <div class="section-label">{{ t.sets }}</div>
          <div v-if="setsCaption" class="section-caption">{{ setsCaption }}</div>
        </div>
        <div class="inline-actions">
          <button class="btn-square" @click="refreshSetRoot" :data-tooltip="t.refreshLibrary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"></path>
              <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"></path>
            </svg>
          </button>
          <button class="btn-square" @click="pickSetRoot" :title="pendingSetRoot ? t.restoreSetlistsAccess : (setRoot ? t.changeRoot : t.pickSetRoot)">
            <svg v-if="!setRoot && !pendingSetRoot" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <path d="M12 12h6"></path>
              <path d="M15 9l3 3-3 3"></path>
            </svg>
          </button>
          <span class="actions-separator" aria-hidden="true"></span>
          <button class="btn-square" @click="newSetlist" :title="t.newSetlist">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </button>
          <button class="btn-square" @click="openSetlist" :title="t.openSetlist">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <path d="M12 11v6"></path>
              <path d="M9 14h6"></path>
            </svg>
          </button>
          <button class="btn-square" @click="addAllToSetlist" :title="t.addAll">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v10"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
              <circle cx="18" cy="18" r="4"></circle>
              <line x1="18" y1="16" x2="18" y2="20"></line>
              <line x1="16" y1="18" x2="20" y2="18"></line>
            </svg>
          </button>
          <button class="btn-square" @click="saveSetlist" :title="t.saveSetlist">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </button>
          <button class="btn-square" @click="openSetExportModal" :title="t.exportSetlistText">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="sets-panel">
        <div class="set-picker-row compact-header">
          <select v-model="selectedSavedSetName" class="set-select" @change="handleSetSelectionChange">
            <option value="">{{ t.selectSet }}</option>
            <option v-for="setFile in setFiles" :key="setFile.name" :value="setFile.name">
              {{ setFile.title }}
            </option>
          </select>
          <span class="subsection-count">{{ setlistItems.length }}</span>
        </div>
        <div v-if="!setRoot" class="empty compact-empty">{{ t.noFolder }}</div>
        <div v-else-if="!setFiles.length" class="empty compact-empty">{{ t.noSets }}</div>
        <div v-else-if="!setlistItems.length" class="empty compact-empty">{{ t.selectSetHint }}</div>
        <ul v-if="setlistItems.length" class="setlist minimal-setlist">
          <li
            v-for="(s, i) in setlistItems"
            :key="`${s.fileName}-${i}`"
            @dragover.prevent="dragOver(i)"
            @dragend="dragEnd"
            @click="openSetlistSong(s)"
            :class="{ 'drag-over': dragOverIndex === i }"
          >
            <span class="drag-handle" :data-tooltip="t.dragToReorder" draggable="true" @dragstart.stop="dragStart(i, $event)" @click.stop>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                <circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
              </svg>
            </span>
            <span class="setlist-item-name" :data-tooltip="s.fileName">{{ s.name }}</span>
            <button class="btn-remove" @click.stop="setlistItems.splice(i,1)" :data-tooltip="t.remove">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </li>
        </ul>
        <div v-if="setlistItems.length && setExportSummary.totalDurationLabel" class="setlist-summary">
          <span class="setlist-summary-label">{{ t.exportFieldSetDuration }}</span>
          <span class="subsection-count">{{ setExportSummary.totalDurationLabel }}</span>
        </div>
      </div>
    </div>

    <div v-if="showSetExportModal" class="modal-overlay" @click.self="closeSetExportModal">
      <div class="modal export-modal">
        <div class="modal-icon-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <h3>{{ t.exportSetlistText }}</h3>
        </div>
        <div class="export-meta">
          <span class="export-set-name">{{ setlistName || selectedSavedSetTitle || t.mySetlist }}</span>
          <div class="export-meta-pills">
            <span class="export-set-count">{{ setlistItems.length }} {{ t.songs }}</span>
            <span v-if="setExportSummary.totalDurationLabel" class="export-set-count">
              {{ setExportSummary.totalDurationLabel }}
            </span>
          </div>
        </div>
        <div class="export-toolbar">
          <label class="export-separator-picker">
            <span>{{ t.exportSeparator }}</span>
            <select v-model="exportFieldSeparator" class="export-separator-select">
              <option v-for="option in exportSeparatorOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
        <div class="export-grid">
          <div v-for="(field, index) in exportFieldOptions" :key="field.key" class="export-option">
            <label class="export-option-main">
              <input v-model="setExportFields[field.key]" type="checkbox" />
              <span class="export-option-label">{{ field.label }}</span>
            </label>
            <span v-if="setExportFields[field.key]" class="export-order-badge">{{ getExportFieldPosition(field.key) }}</span>
            <div class="export-order-controls">
              <button
                class="btn-order"
                type="button"
                :disabled="index === 0"
                :title="t.moveUp"
                @click="moveExportField(field.key, -1)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
              <button
                class="btn-order"
                type="button"
                :disabled="index === exportFieldOptions.length - 1"
                :title="t.moveDown"
                @click="moveExportField(field.key, 1)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-buttons">
          <button class="btn-secondary" :disabled="exportInProgress" @click="copySetlistText">{{ t.copySetlistText }}</button>
          <button class="btn-primary" :disabled="exportInProgress" @click="exportSetlistText">{{ t.exportTxt }}</button>
          <button class="btn-close-modal" @click="closeSetExportModal">{{ t.btnClose }}</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import { get, set } from '../idb';

const DEFAULT_SET_EXPORT_FIELDS = {
  numbering: true,
  title: true,
  artist: true,
  filename: false,
  key: false,
  originalKey: false,
  capo: false,
  tempo: false,
  duration: false,
  setDuration: true,
  timeSignature: false,
  instrument: false,
  tags: false,
  notes: false,
  presentation: false,
  youtubeLink: false,
  webLink: false,
  ccli: false,
  copyright: false,
  aka: false,
  hymnNumber: false
};

const DEFAULT_EXPORT_FIELD_ORDER = [
  'numbering',
  'title',
  'artist',
  'duration',
  'tempo',
  'key',
  'originalKey',
  'capo',
  'timeSignature',
  'instrument',
  'filename',
  'tags',
  'notes',
  'presentation',
  'youtubeLink',
  'webLink',
  'ccli',
  'copyright',
  'aka',
  'hymnNumber',
  'setDuration'
];

const DEFAULT_EXPORT_SEPARATOR = 'pipe';

export default {
  name: 'FileExplorer',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    t: Object
  },
  emits: ['open-file', 'alert'],
  data() {
    return {
      rootHandle: null,
      libraryTree: null,
      selectedFolderPath: '',
      activeFilePath: null,
      libraryFilter: '',
      setRoot: null,
      setFiles: [],
      selectedSavedSetName: '',
      setlistItems: [],
      setlistName: '',
      setlistUuid: '',
      setlistLastModified: '',
      setlistHandle: null,
      dragIndex: null,
      dragOverIndex: null,
      pendingRoot: null,
      pendingSetRoot: null,
      activeMenu: null,
      expandedFolders: { '': true },
      showSetExportModal: false,
      exportInProgress: false,
      setExportSummary: {
        totalDurationSeconds: 0,
        totalDurationLabel: ''
      },
      setExportFields: { ...DEFAULT_SET_EXPORT_FIELDS },
      exportFieldOrder: [...DEFAULT_EXPORT_FIELD_ORDER],
      exportFieldSeparator: DEFAULT_EXPORT_SEPARATOR
    };
  },
  computed: {
    visibleLibraryRows() {
      if (!this.libraryTree) return [];
      const rows = [];
      this.collectVisibleLibraryRows(this.libraryTree, 0, rows);
      return rows;
    },
    currentFolderNode() {
      return this.getNodeByPath(this.libraryTree, this.selectedFolderPath);
    },
    currentFolderFiles() {
      return this.currentFolderNode?.files || [];
    },
    setsCaption() {
      const label = this.setRoot?.name || this.pendingSetRoot?.name || '';
      if (!label || label.toLocaleLowerCase() === this.t.sets.toLocaleLowerCase()) return '';
      return label;
    },
    selectedSavedSetTitle() {
      return this.setFiles.find((setFile) => setFile.name === this.selectedSavedSetName)?.title || '';
    },
    exportFieldOptions() {
      const options = [
        { key: 'numbering', label: this.t.exportFieldNumbering },
        { key: 'title', label: this.t.title },
        { key: 'artist', label: this.t.artist },
        { key: 'filename', label: this.t.exportFieldFilename },
        { key: 'key', label: this.t.key },
        { key: 'originalKey', label: this.t.originalKey },
        { key: 'capo', label: this.t.capo },
        { key: 'tempo', label: this.t.tempo },
        { key: 'duration', label: this.t.duration },
        { key: 'setDuration', label: this.t.exportFieldSetDuration },
        { key: 'timeSignature', label: this.t.timeSignature },
        { key: 'instrument', label: this.t.instrument },
        { key: 'tags', label: this.t.tags },
        { key: 'notes', label: this.t.notes },
        { key: 'presentation', label: this.t.presentation },
        { key: 'youtubeLink', label: this.t.youtubeLink },
        { key: 'webLink', label: this.t.webLink },
        { key: 'ccli', label: this.t.ccli },
        { key: 'copyright', label: this.t.copyright },
        { key: 'aka', label: this.t.aka },
        { key: 'hymnNumber', label: this.t.hymnNumber }
      ];
      const order = this.exportFieldOrder;
      return [...options].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    },
    exportSeparatorOptions() {
      return [
        { value: 'pipe', label: this.t.exportSeparatorPipe },
        { value: 'dash', label: this.t.exportSeparatorDash },
        { value: 'tab', label: this.t.exportSeparatorTab }
      ];
    }
  },
  watch: {
    setlistItems: {
      deep: true,
      handler() {
        this.syncSetExportSummary();
      }
    },
    libraryTree() {
      this.syncSetExportSummary();
    },
    setExportFields: {
      deep: true,
      handler() {
        this.persistExportPreferences();
      }
    },
    exportFieldOrder: {
      deep: true,
      handler() {
        this.persistExportPreferences();
      }
    },
    exportFieldSeparator() {
      this.persistExportPreferences();
    }
  },
  async mounted() {
    await this.initFromDB();
    document.addEventListener('click', this.closeMenu);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeMenu);
  },
  methods: {
    toggleMenu(id) {
      this.activeMenu = this.activeMenu === id ? null : id;
    },
    closeMenu() {
      this.activeMenu = null;
    },
    createUuid() {
      if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    currentIsoSecond() {
      return new Date().toISOString().split('.')[0] + 'Z';
    },
    async openSetExportModal() {
      if (!this.setlistItems.length) {
        this.$emit('alert', { message: this.t.setlistEmpty });
        return;
      }
      this.showSetExportModal = true;
      await this.updateSetExportSummary();
    },
    closeSetExportModal() {
      this.showSetExportModal = false;
    },
    moveExportField(fieldKey, direction) {
      const currentIndex = this.exportFieldOrder.indexOf(fieldKey);
      const targetIndex = currentIndex + direction;
      if (currentIndex === -1 || targetIndex < 0 || targetIndex >= this.exportFieldOrder.length) return;
      const nextOrder = [...this.exportFieldOrder];
      const [moved] = nextOrder.splice(currentIndex, 1);
      nextOrder.splice(targetIndex, 0, moved);
      this.exportFieldOrder = nextOrder;
    },
    isVisibleSongFileName(name) {
      return /\.(xml|ost|txt|song)$/i.test(name) || !name.includes('.');
    },
    joinRelativePath(parentPath, name) {
      return parentPath ? `${parentPath}/${name}` : name;
    },
    normalizeRenameTarget(oldName, requestedName) {
      const trimmedName = requestedName.trim();
      const oldExtensionMatch = oldName.match(/(\.[^.]+)$/);
      const oldExtension = oldExtensionMatch ? oldExtensionMatch[1] : '';
      const newHasExtension = /\.[^.]+$/.test(trimmedName);

      if (!newHasExtension && oldExtension) {
        return `${trimmedName}${oldExtension}`;
      }

      return trimmedName;
    },
    isCaseOnlyRename(oldName, newName) {
      return oldName !== newName && oldName.toLocaleLowerCase() === newName.toLocaleLowerCase();
    },
    buildTempRenameName(targetName) {
      const timestamp = Date.now();
      const extensionMatch = targetName.match(/(\.[^.]+)$/);
      const extension = extensionMatch ? extensionMatch[1] : '';
      const baseName = extension ? targetName.slice(0, -extension.length) : targetName;
      return `${baseName}.__sew_tmp_${timestamp}${extension}`;
    },
    getFilesListScrollTop() {
      return this.$refs.filesList?.scrollTop || 0;
    },
    setFilesListScrollTop(scrollTop) {
      if (this.$refs.filesList) {
        this.$refs.filesList.scrollTop = scrollTop;
      }
    },
    async renameFile(file) {
      this.closeMenu();
      const requestedName = prompt(this.t.renamePrompt, file.name);
      if (!requestedName) return;

      const newName = this.normalizeRenameTarget(file.name, requestedName);
      if (!newName || newName === file.name) return;
      if (!this.isVisibleSongFileName(newName)) {
        alert(this.t.renameInvalidFileType);
        return;
      }

      const targetDir = file.directoryHandle;
      const targetRelativePath = this.joinRelativePath(file.folderPath, newName);

      try {
        if (file.handle.move) {
          try {
            await file.handle.move(newName);
            await this.refreshRoot({
              selectedFolderPath: file.folderPath,
              selectedPath: targetRelativePath
            });
            return;
          } catch (e) {
            console.warn('Native move not supported or failed', e);
          }
        }

        if (this.isCaseOnlyRename(file.name, newName)) {
          const tempName = this.buildTempRenameName(newName);
          const oldFile = await file.handle.getFile();
          const data = await oldFile.arrayBuffer();

          const tempHandle = await targetDir.getFileHandle(tempName, { create: true });
          const tempWritable = await tempHandle.createWritable();
          await tempWritable.write(data);
          await tempWritable.close();

          const tempFile = await tempHandle.getFile();
          if (tempFile.size !== oldFile.size) {
            throw new Error('Temporary rename verification failed');
          }

          await targetDir.removeEntry(file.name);

          const finalHandle = await targetDir.getFileHandle(newName, { create: true });
          const finalWritable = await finalHandle.createWritable();
          await finalWritable.write(data);
          await finalWritable.close();

          const finalFile = await finalHandle.getFile();
          if (finalFile.size !== oldFile.size) {
            throw new Error('Final rename verification failed');
          }

          await targetDir.removeEntry(tempName);
          await this.refreshRoot({
            selectedFolderPath: file.folderPath,
            selectedPath: targetRelativePath
          });
          return;
        }

        const oldFile = await file.handle.getFile();
        const data = await oldFile.arrayBuffer();
        const newHandle = await targetDir.getFileHandle(newName, { create: true });
        const writable = await newHandle.createWritable();
        await writable.write(data);
        await writable.close();
        const writtenFile = await newHandle.getFile();
        if (writtenFile.size !== oldFile.size) {
          throw new Error('Renamed file verification failed');
        }
        await targetDir.removeEntry(file.name);
        await this.refreshRoot({
          selectedFolderPath: file.folderPath,
          selectedPath: targetRelativePath
        });
      } catch (err) {
        console.error('Error renaming file:', err);
        this.$emit('alert', { message: this.t.errorRename });
      }
    },
    async deleteFile(file) {
      this.closeMenu();
      if (!confirm(this.t.deleteConfirm)) return;
      try {
        const folderFiles = this.currentFolderFiles;
        const deletedIndex = folderFiles.findIndex((f) => f.relativePath === file.relativePath);
        const fallbackSelection =
          folderFiles[deletedIndex + 1]?.relativePath ||
          folderFiles[deletedIndex - 1]?.relativePath ||
          null;
        await file.directoryHandle.removeEntry(file.name);
        await this.refreshRoot({
          selectedFolderPath: file.folderPath,
          selectedPath: this.activeFilePath === file.relativePath ? fallbackSelection : this.activeFilePath
        });
      } catch (err) {
        console.error('Error deleting file:', err);
        this.$emit('alert', { message: this.t.errorDelete });
      }
    },
    async initFromDB() {
      try {
        const root = await get('rootHandle');
        if (root) {
          if ((await root.queryPermission({ mode: 'readwrite' })) === 'granted') {
            this.rootHandle = root;
            await this.loadDirectory(root);
          } else {
            this.pendingRoot = root;
          }
        }
        const setRoot = await get('setRoot');
        if (setRoot) {
          if ((await setRoot.queryPermission({ mode: 'readwrite' })) === 'granted') {
            this.setRoot = setRoot;
            await this.loadSetDirectory(setRoot);
          } else {
            this.pendingSetRoot = setRoot;
          }
        }
        const exportPreferences = await get('setExportPreferences');
        if (exportPreferences) {
          this.setExportFields = this.normalizeExportFields(exportPreferences.fields);
          this.exportFieldOrder = this.normalizeExportOrder(exportPreferences.order);
          this.exportFieldSeparator = this.normalizeExportSeparator(exportPreferences.separator);
        }
      } catch (err) {
        console.error('Error loading handles from IDB', err);
      }
    },
    normalizeExportFields(fields) {
      return {
        ...DEFAULT_SET_EXPORT_FIELDS,
        ...Object.fromEntries(
          Object.keys(DEFAULT_SET_EXPORT_FIELDS).map((key) => [key, Boolean(fields?.[key])])
        )
      };
    },
    normalizeExportOrder(order) {
      const validKeys = Object.keys(DEFAULT_SET_EXPORT_FIELDS);
      const normalized = Array.isArray(order)
        ? order.filter((key, index) => validKeys.includes(key) && order.indexOf(key) === index)
        : [];
      return [
        ...normalized,
        ...DEFAULT_EXPORT_FIELD_ORDER.filter((key) => !normalized.includes(key))
      ];
    },
    normalizeExportSeparator(separator) {
      return ['pipe', 'dash', 'tab'].includes(separator) ? separator : DEFAULT_EXPORT_SEPARATOR;
    },
    async persistExportPreferences() {
      try {
        const fields = Object.fromEntries(
          Object.keys(DEFAULT_SET_EXPORT_FIELDS).map((key) => [key, Boolean(this.setExportFields[key])])
        );
        const order = [...this.exportFieldOrder];
        await set('setExportPreferences', {
          fields,
          order,
          separator: String(this.exportFieldSeparator || DEFAULT_EXPORT_SEPARATOR)
        });
      } catch (err) {
        console.error('Error saving export preferences', err);
      }
    },
    async pickRoot() {
      if (this.pendingRoot) {
        if ((await this.pendingRoot.requestPermission({ mode: 'readwrite' })) === 'granted') {
          this.rootHandle = this.pendingRoot;
          this.pendingRoot = null;
          await this.loadDirectory(this.rootHandle);
        }
        return;
      }
      if (!window.showDirectoryPicker) {
        this.$emit('alert', { message: this.t.browserNotSupported });
        return;
      }
      try {
        const dir = await window.showDirectoryPicker();
        this.rootHandle = dir;
        await set('rootHandle', dir);
        await this.loadDirectory(dir);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error picking root', err);
      }
    },
    async readDirectoryNode(dir, folderPath = '') {
      const node = {
        name: folderPath ? folderPath.split('/').pop() : dir.name,
        path: folderPath,
        handle: dir,
        folders: [],
        files: []
      };

      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'directory') {
          node.folders.push(await this.readDirectoryNode(handle, this.joinRelativePath(folderPath, name)));
          continue;
        }

        if (handle.kind === 'file' && this.isVisibleSongFileName(name)) {
          const meta = await this.readMetadata(handle, name);
          node.files.push({
            name,
            handle,
            folderPath,
            relativePath: this.joinRelativePath(folderPath, name),
            directoryHandle: dir,
            ...meta
          });
        }
      }

      node.folders.sort((a, b) => a.name.localeCompare(b.name));
      node.files.sort((a, b) => a.name.localeCompare(b.name));
      return node;
    },
    async loadDirectory(dir) {
      try {
        this.libraryTree = await this.readDirectoryNode(dir);
        this.expandedFolders = { '': true };
        this.selectedFolderPath = '';
        this.activeFilePath = null;
        this.libraryFilter = '';
      } catch (err) {
        console.error('Error loading directory', err);
      }
    },
    async refreshRoot(options = {}) {
      if (!this.rootHandle) return;

      const scrollTop = this.getFilesListScrollTop();
      const selectedFolderPath = options.selectedFolderPath ?? this.selectedFolderPath;
      const selectedPath = options.selectedPath ?? this.activeFilePath;

      await this.loadDirectory(this.rootHandle);
      this.ensureFolderExpanded(selectedFolderPath);
      this.selectedFolderPath = selectedFolderPath;
      this.activeFilePath = selectedPath;

      await this.$nextTick();
      this.setFilesListScrollTop(scrollTop);
    },
    async refreshSetRoot() {
      if (!this.setRoot) return;
      const selectedSavedSetName = this.selectedSavedSetName;
      await this.loadSetDirectory(this.setRoot);
      if (selectedSavedSetName && this.setFiles.find((setFile) => setFile.name === selectedSavedSetName)) {
        this.selectedSavedSetName = selectedSavedSetName;
      }
    },
    countVisibleSongs(node) {
      if (!node) return 0;
      const query = this.libraryFilter.toLocaleLowerCase();
      const ownFiles = node.files.filter((file) => {
        if (!query) return true;
        return [file.name, file.title, file.artist]
          .some((value) => String(value || '').toLocaleLowerCase().includes(query));
      }).length;
      return ownFiles + node.folders.reduce((sum, child) => sum + this.countVisibleSongs(child), 0);
    },
    collectVisibleLibraryRows(node, depth, rows) {
      if (!node) return;

      const matchingFiles = this.filterFiles(node.files);
      const songCount = this.countVisibleSongs(node);
      rows.push({
        kind: 'folder',
        id: `folder:${node.path || '__root__'}`,
        path: node.path,
        label: node.path ? node.name : (this.rootHandle?.name || this.t.songs),
        depth,
        hasChildren: node.folders.length > 0 || matchingFiles.length > 0,
        songCount
      });

      if (this.isFolderExpanded(node.path)) {
        matchingFiles.forEach((file) => {
          rows.push({
            kind: 'file',
            id: `file:${file.relativePath}`,
            depth: depth + 1,
            file
          });
        });
      }

      node.folders.forEach((child) => {
        if (this.countVisibleSongs(child) === 0 && child.folders.length === 0) return;
        this.collectVisibleLibraryRows(child, depth + 1, rows);
      });
    },
    filterFiles(files = []) {
      const query = this.libraryFilter.toLocaleLowerCase();
      if (!query) return files;
      return files.filter((file) => [file.name, file.title, file.artist, file.relativePath]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query)));
    },
    isFolderExpanded(path) {
      return this.expandedFolders[path] !== false;
    },
    handleFolderClick(row) {
      if (row.hasChildren) {
        if (this.isFolderExpanded(row.path)) {
          this.expandedFolders[row.path] = false;
        } else {
          this.expandedFolders[row.path] = true;
        }
      }
      this.setSelectedFolder(row.path);
    },
    ensureFolderExpanded(path, { includeSelf = true } = {}) {
      this.expandedFolders[''] = true;
      if (!path) return;
      const segments = path.split('/');
      const limit = includeSelf ? segments.length : Math.max(segments.length - 1, 0);
      let current = '';
      segments.slice(0, limit).forEach((segment) => {
        current = current ? `${current}/${segment}` : segment;
        this.expandedFolders[current] = true;
      });
    },
    setSelectedFolder(path) {
      this.selectedFolderPath = path;
      const folderFiles = this.currentFolderNode?.files || [];
      if (!folderFiles.find((file) => file.relativePath === this.activeFilePath)) {
        this.activeFilePath = folderFiles[0]?.relativePath || null;
      }
    },
    selectFolder(path, { expandSelf = true } = {}) {
      this.ensureFolderExpanded(path, { includeSelf: expandSelf });
      this.setSelectedFolder(path);
    },
    getNodeByPath(node, path) {
      if (!node) return null;
      if (node.path === path) return node;
      for (const folderNode of node.folders) {
        const found = this.getNodeByPath(folderNode, path);
        if (found) return found;
      }
      return null;
    },
    async pickSetRoot() {
      if (this.pendingSetRoot) {
        if ((await this.pendingSetRoot.requestPermission({ mode: 'readwrite' })) === 'granted') {
          this.setRoot = this.pendingSetRoot;
          this.pendingSetRoot = null;
          await this.loadSetDirectory(this.setRoot);
        }
        return;
      }
      if (!window.showDirectoryPicker) {
        alert(this.t.browserNotSupported);
        return;
      }
      try {
        const dir = await window.showDirectoryPicker();
        this.setRoot = dir;
        await set('setRoot', dir);
        await this.loadSetDirectory(dir);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error picking setlist root', err);
      }
    },
    async readSetMetadata(handle, name) {
      try {
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = this.parseSetlistXml(text);
        if (!parsed || !parsed.items.length) return null;
        return {
          name,
          handle,
          title: parsed.name || name,
          itemCount: parsed.items.length,
          lastModified: parsed.lastModified || ''
        };
      } catch (err) {
        console.error('Error reading set metadata', err);
        return null;
      }
    },
    async loadSetDirectory(dir) {
      this.setFiles = [];
      try {
        for await (const [name, handle] of dir.entries()) {
          if (handle.kind !== 'file') continue;
          const meta = await this.readSetMetadata(handle, name);
          if (meta) this.setFiles.push(meta);
        }
        this.setFiles.sort((a, b) => a.title.localeCompare(b.title));
        if (this.selectedSavedSetName && !this.setFiles.find((setFile) => setFile.name === this.selectedSavedSetName)) {
          this.selectedSavedSetName = '';
        }
      } catch (err) {
        console.error('Error loading set directory', err);
      }
    },
    async readMetadata(handle, name) {
      try {
        const file = await handle.getFile();
        const text = await file.text();
        try {
          const doc = new DOMParser().parseFromString(text, 'application/xml');
          const q = (...names) => {
            for (const n of names) {
              const el = doc.querySelector(n);
              if (el?.textContent?.trim()) return el.textContent.trim();
            }
            return '';
          };
          const title = q('title', 'songtitle', 'name');
          const artist = q('artist', 'author', 'composer', 'autor');
          if (title || artist) return { title, artist };
        } catch (_) {
          // Fall back to plain-text metadata parsing when XML parsing fails.
        }

        const kv = (pat) => {
          const m = text.match(new RegExp(`^\\s*(?:${pat})\\s*[:=]\\s*(.+)$`, 'im'));
          return m?.[1]?.trim() || '';
        };
        const title = kv('title|titulo|songtitle');
        const artist = kv('artist|composer|autor');
        if (title || artist) return { title, artist };

        const firstLine = text.split(/\r?\n/).find((l) => l.trim());
        return { title: firstLine || name, artist: '' };
      } catch (err) {
        console.error('readMetadata error', err);
        return { title: '', artist: '' };
      }
    },
    parseDuration(value) {
      const total = Number(value);
      if (!Number.isFinite(total) || total <= 0) return '';
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    },
    durationToSeconds(value) {
      if (!value || !String(value).includes(':')) return 0;
      const parts = String(value).split(':').map((part) => Number(part));
      if (parts.some((part) => !Number.isFinite(part) || part < 0)) return 0;
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return 0;
    },
    formatTotalDuration(totalSeconds) {
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    },
    formatExportInline(parts) {
      const normalizedParts = parts.filter(Boolean);
      if (this.exportFieldSeparator === 'tab') return normalizedParts.join('\t');
      if (this.exportFieldSeparator === 'dash') return normalizedParts.join('  -  ');
      return normalizedParts.join('  |  ');
    },
    formatExportValue(label, value) {
      return value ? `${label}: ${value}` : '';
    },
    getExportFieldDisplayValue(song, index, fieldKey) {
      switch (fieldKey) {
        case 'numbering':
          return `#${index + 1}`;
        case 'title':
          return song.title || '';
        case 'artist':
          return song.artist || '';
        case 'filename':
          return this.formatExportValue(this.t.exportFieldFilename, song.filename);
        case 'key':
          return this.formatExportValue(this.t.key, song.key);
        case 'originalKey':
          return this.formatExportValue(this.t.originalKey, song.originalKey);
        case 'capo':
          return this.formatExportValue(this.t.capo, song.capo);
        case 'tempo':
          return this.formatExportValue(this.t.tempo, song.tempo);
        case 'duration':
          return this.formatExportValue(this.t.duration, song.duration);
        case 'timeSignature':
          return this.formatExportValue(this.t.timeSignature, song.timeSignature);
        case 'instrument':
          return this.formatExportValue(this.t.instrument, song.instrument);
        case 'tags':
          return this.formatExportValue(this.t.tags, song.tags);
        case 'notes':
          return this.formatExportValue(this.t.notes, song.notes);
        case 'presentation':
          return this.formatExportValue(this.t.presentation, song.presentation);
        case 'youtubeLink':
          return this.formatExportValue(this.t.youtubeLink, song.youtubeLink);
        case 'webLink':
          return this.formatExportValue(this.t.webLink, song.webLink);
        case 'ccli':
          return this.formatExportValue(this.t.ccli, song.ccli);
        case 'copyright':
          return this.formatExportValue(this.t.copyright, song.copyright);
        case 'aka':
          return this.formatExportValue(this.t.aka, song.aka);
        case 'hymnNumber':
          return this.formatExportValue(this.t.hymnNumber, song.hymnNumber);
        default:
          return '';
      }
    },
    getOrderedSelectedExportFieldKeys({ includeSetFields = false } = {}) {
      return this.exportFieldOrder.filter((key) => {
        if (!this.setExportFields[key]) return false;
        if (!includeSetFields && key === 'setDuration') return false;
        return true;
      });
    },
    getExportFieldPosition(fieldKey) {
      const orderedKeys = this.getOrderedSelectedExportFieldKeys({ includeSetFields: true });
      const index = orderedKeys.indexOf(fieldKey);
      return index === -1 ? '' : index + 1;
    },
    async readSongExportMetadata(relativePath) {
      const file = this.findFileByRelativePath(this.libraryTree, relativePath);
      if (!file) {
        return {
          title: relativePath.split('/').pop() || relativePath,
          artist: '',
          filename: relativePath,
          key: '',
          originalKey: '',
          capo: '',
          tempo: '',
          duration: '',
          timeSignature: '',
          instrument: '',
          tags: '',
          notes: '',
          presentation: '',
          youtubeLink: '',
          webLink: '',
          ccli: '',
          copyright: '',
          aka: '',
          hymnNumber: ''
        };
      }

      const result = {
        title: file.title || file.name,
        artist: file.artist || '',
        filename: file.relativePath,
        key: '',
        originalKey: '',
        capo: '',
        tempo: '',
        duration: '',
        timeSignature: '',
        instrument: '',
        tags: '',
        notes: '',
        presentation: '',
        youtubeLink: '',
        webLink: '',
        ccli: '',
        copyright: '',
        aka: '',
        hymnNumber: ''
      };

      try {
        const text = await (await file.handle.getFile()).text();
        const xmlDoc = new DOMParser().parseFromString(text, 'application/xml');
        const query = (...names) => {
          for (const name of names) {
            const el = xmlDoc.querySelector(name);
            if (el?.textContent?.trim()) return el.textContent.trim();
          }
          return '';
        };

        result.title = query('title', 'songtitle', 'name') || result.title;
        result.artist = query('author', 'artist', 'composer', 'autor') || result.artist;
        result.key = query('key');
        result.originalKey = query('keyoriginal', 'originalkey');
        result.capo = query('capo');
        result.tempo = query('tempo');
        result.duration = this.parseDuration(query('duration'));
        result.timeSignature = query('timesig', 'time_sig', 'timesignature');
        result.instrument = query('preferredInstrument', 'preferred_instrument', 'instrument');
        result.tags = query('theme', 'tags');
        result.notes = query('notes');
        result.presentation = query('presentation', 'presentationorder');
        result.youtubeLink = query('linkyoutube', 'link_youtube', 'youtube', 'youtubeLink');
        result.webLink = query('linkweb', 'link_web', 'weblink', 'webLink');
        result.ccli = query('ccli');
        result.copyright = query('copyright');
        result.aka = query('aka');
        result.hymnNumber = query('hymnnum', 'hymn_number', 'hymnnumber');
      } catch (err) {
        console.error('Error reading song export metadata', err);
      }

      return result;
    },
    async getSetlistExportSongs() {
      return Promise.all(this.setlistItems.map((item) => this.readSongExportMetadata(item.fileName)));
    },
    syncSetExportSummary() {
      if (!this.setlistItems.length) {
        this.setExportSummary = {
          totalDurationSeconds: 0,
          totalDurationLabel: ''
        };
        return;
      }
      this.updateSetExportSummary();
    },
    async updateSetExportSummary() {
      const songs = await this.getSetlistExportSongs();
      const totalDurationSeconds = songs.reduce((sum, song) => sum + this.durationToSeconds(song.duration), 0);
      this.setExportSummary = {
        totalDurationSeconds,
        totalDurationLabel: this.formatTotalDuration(totalDurationSeconds)
      };
      return songs;
    },
    async buildSetlistExportText() {
      const setName = this.setlistName || this.selectedSavedSetTitle || this.t.mySetlist;
      const lines = [setName, `${this.setlistItems.length} ${this.t.songs}`];
      const activeFields = this.setExportFields;
      const songs = await this.updateSetExportSummary();
      lines.push('');
      const orderedFieldKeys = this.getOrderedSelectedExportFieldKeys();

      songs.forEach((song, index) => {
        const values = orderedFieldKeys
          .map((fieldKey) => this.getExportFieldDisplayValue(song, index, fieldKey))
          .filter(Boolean);

        if (!values.length) {
          values.push(song.title || song.filename || `${index + 1}`);
        }

        lines.push(this.formatExportInline(values));
        lines.push('');
      });

      if (activeFields.setDuration && this.setExportSummary.totalDurationLabel) {
        lines.push(`${this.t.exportFieldSetDuration}: ${this.setExportSummary.totalDurationLabel}`);
      }

      return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
    },
    async copySetlistText() {
      if (this.exportInProgress) return;
      this.exportInProgress = true;
      try {
        const text = await this.buildSetlistExportText();
        await navigator.clipboard.writeText(text);
        this.$emit('alert', { message: this.t.setlistCopied });
        this.closeSetExportModal();
      } catch (err) {
        console.error('Error copying setlist text', err);
        this.$emit('alert', { message: this.t.errorCopySetlist });
      } finally {
        this.exportInProgress = false;
      }
    },
    async exportSetlistText() {
      if (this.exportInProgress) return;
      this.exportInProgress = true;
      try {
        const setName = this.setlistName || this.selectedSavedSetTitle || this.t.mySetlist;
        const text = await this.buildSetlistExportText();
        const handle = await window.showSaveFilePicker({
          suggestedName: `${setName.replace(/\.[^.]+$/, '')}.txt`,
          types: [{
            description: 'Text files',
            accept: { 'text/plain': ['.txt'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(text);
        await writable.close();
        this.$emit('alert', { message: this.t.setlistTextExported });
        this.closeSetExportModal();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error exporting setlist text', err);
          this.$emit('alert', { message: this.t.errorExportSetlist });
        }
      } finally {
        this.exportInProgress = false;
      }
    },
    openFile(handle, relativePath = handle?.name || null) {
      this.activeFilePath = relativePath;
      this.$emit('open-file', handle);
    },
    newSetlist() {
      if (this.setlistItems.length && !confirm(this.t.confirmNewSetlist)) return;
      this.setlistItems = [];
      this.setlistName = '';
      this.setlistUuid = '';
      this.setlistLastModified = '';
      this.setlistHandle = null;
      this.selectedSavedSetName = '';
    },
    addSongToSetlist(file) {
      if (!this.setlistItems.find((item) => item.fileName === file.relativePath)) {
        this.setlistItems.push({
          name: file.title || file.name,
          fileName: file.relativePath
        });
      }
    },
    addAllToSetlist() {
      for (const file of this.currentFolderFiles) {
        if (!this.setlistItems.find((item) => item.fileName === file.relativePath)) {
          this.setlistItems.push({
            name: file.title || file.name,
            fileName: file.relativePath
          });
        }
      }
    },
    findFileByRelativePath(node, relativePath) {
      if (!node) return null;
      const directMatch = node.files.find((file) => file.relativePath === relativePath);
      if (directMatch) return directMatch;
      for (const folderNode of node.folders) {
        const nestedMatch = this.findFileByRelativePath(folderNode, relativePath);
        if (nestedMatch) return nestedMatch;
      }
      return null;
    },
    openSetlistSong(item) {
      const match = this.findFileByRelativePath(this.libraryTree, item.fileName);
      if (match) {
        this.openFile(match.handle, match.relativePath);
      }
    },
    buildSetlistXml(name) {
      if (!this.setlistUuid) this.setlistUuid = this.createUuid();
      this.setlistLastModified = this.currentIsoSecond();

      const items = this.setlistItems.map((song) => {
        const escaped = song.name.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
          .replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const fileEscaped = (song.fileName || song.name).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
          .replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `    <slide_group name="${escaped}" type="song" presentation="" path="${fileEscaped}"/>`;
      }).join('\n');

      const escapedName = name.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

      return `<?xml version="1.0" encoding="UTF-8"?>\n<set name="${escapedName}">\n  <uuid>${this.setlistUuid}</uuid>\n  <last_modified>${this.setlistLastModified}</last_modified>\n  <slide_groups>\n${items}\n  </slide_groups>\n</set>`;
    },
    parseSetlistXml(text) {
      try {
        const doc = new DOMParser().parseFromString(text, 'application/xml');
        const setEl = doc.querySelector('set');
        const name = setEl?.getAttribute('name') || '';
        const directChildText = (tagName) => Array.from(setEl?.children || [])
          .find((child) => child.tagName === tagName)?.textContent || '';
        const uuid = directChildText('uuid');
        const lastModified = directChildText('last_modified');
        const groups = doc.querySelectorAll('slide_group[type="song"]');
        const items = [];
        groups.forEach((group) => {
          items.push({
            name: group.getAttribute('name') || '',
            fileName: group.getAttribute('path') || group.getAttribute('name') || ''
          });
        });
        return { name, uuid, lastModified, items };
      } catch (err) {
        console.error('Error parsing setlist XML:', err);
        return null;
      }
    },
    loadParsedSet(parsed, fallbackName = '') {
      this.setlistItems = parsed.items;
      this.setlistName = parsed.name || fallbackName;
      this.setlistUuid = parsed.uuid || '';
      this.setlistLastModified = parsed.lastModified || '';
    },
    handleSetSelectionChange() {
      if (!this.selectedSavedSetName) {
        this.newSetlist();
        return;
      }
      const setFile = this.setFiles.find((item) => item.name === this.selectedSavedSetName);
      if (setFile) {
        this.openSavedSet(setFile);
      }
    },
    async openSavedSet(setFile) {
      try {
        const file = await setFile.handle.getFile();
        const text = await file.text();
        const parsed = this.parseSetlistXml(text);
        if (!parsed || !parsed.items.length) {
          alert(this.t.errorOpenSetlist);
          return;
        }
        this.loadParsedSet(parsed, setFile.title || setFile.name);
        this.setlistHandle = setFile.handle;
        this.selectedSavedSetName = setFile.name;
      } catch (err) {
        console.error('Error opening saved set:', err);
        alert(this.t.errorOpenSetlist);
      }
    },
    async openSetlist() {
      try {
        const [handle] = await window.showOpenFilePicker();
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = this.parseSetlistXml(text);
        if (!parsed || !parsed.items.length) {
          alert(this.t.errorOpenSetlist);
          return;
        }
        this.loadParsedSet(parsed, handle.name);
        this.setlistHandle = handle;
        this.selectedSavedSetName = '';
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error opening setlist:', err);
          alert(this.t.errorOpenSetlist);
        }
      }
    },
    async saveSetlist() {
      if (!this.setlistItems.length) {
        alert(this.t.setlistEmpty);
        return;
      }

      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: this.setlistName || this.t.mySetlist
        });

        this.setlistName = handle.name;
        const xml = this.buildSetlistXml(this.setlistName);
        const writable = await handle.createWritable();
        await writable.write(xml);
        await writable.close();
        this.setlistHandle = handle;
        alert(this.t.setlistSaved);

        if (this.setRoot) {
          await this.loadSetDirectory(this.setRoot);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error saving setlist:', err);
          this.$emit('alert', { message: this.t.errorSaveSetlist });
        }
      }
    },
    dragStart(index, event) {
      this.dragIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index);
    },
    dragOver(index) {
      this.dragOverIndex = index;
    },
    dragEnd() {
      if (this.dragIndex !== null && this.dragOverIndex !== null && this.dragIndex !== this.dragOverIndex) {
        const item = this.setlistItems.splice(this.dragIndex, 1)[0];
        this.setlistItems.splice(this.dragOverIndex, 0, item);
      }
      this.dragIndex = null;
      this.dragOverIndex = null;
    }
  }
};
</script>

<style scoped>
.file-explorer {
  position: fixed;
  top: var(--toolbar-h, 48px);
  left: 0;
  bottom: 0;
  width: 0;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--bg2, #111) 92%, #1d3d34 8%), var(--bg2, #111) 120px),
    var(--bg2, #111);
  border-right: 1px solid var(--border, #222);
  overflow: hidden;
  z-index: 1150;
  transition: width 280ms ease;
  display: flex;
  flex-direction: column;
}

.file-explorer.open {
  width: 340px;
  overflow-x: hidden;
  overflow-y: auto;
}

.section {
  padding: 10px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--border, #222) 88%, transparent);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-sets {
  padding-bottom: 14px;
}

.compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fg2, #aaa);
  min-width: 52px;
}

.section-caption {
  font-size: 11px;
  color: var(--fg2, #888);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 210px;
}

.header-filter-input {
  flex: 1;
  min-width: 0;
  background: color-mix(in srgb, var(--bg2, #171717) 88%, transparent);
  border: 1px solid var(--border, #2b2b2b);
  color: var(--fg, #fff);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
}

.header-filter-input::placeholder {
  color: var(--fg2, #777);
}

.inline-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.actions-separator {
  width: 1px;
  height: 18px;
  background: color-mix(in srgb, var(--border, #333) 85%, transparent);
  margin: 0 2px;
  flex: 0 0 auto;
}

.btn-square {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg3, #222) 86%, #17382f 14%);
  border: 1px solid var(--border);
  color: var(--fg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-square:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.subsection-count {
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent, #3ca88d) 18%, transparent);
  color: var(--accent, #3ca88d);
}

.folder-select {
  border: none;
  background: transparent;
  color: var(--fg2, #aaa);
}

.folder-select {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  border: 1px solid transparent;
  min-width: 0;
}

.folder-chevron {
  width: 10px;
  flex: 0 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fg2, #8d8d8d);
  line-height: 1;
}

.folder-chevron.placeholder {
  opacity: 0;
}

.folder-select:hover {
  background: var(--bg3, #2a2a2a);
  color: var(--fg, #fff);
}

.folder-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 13px;
}

.library-tree {
  overflow: auto;
  max-height: 520px;
  padding-right: 2px;
}

.library-tree::-webkit-scrollbar-corner {
  background: var(--bg2, #111);
}

.library-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.empty {
  font-size: 12px;
  color: var(--fg2, #888);
  padding: 8px 2px;
}

.library-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding-left: calc(var(--depth) * 11px + 1px);
  padding-right: 2px;
}

.folder-entry {
  margin-top: 2px;
}

.file-entry {
  color: var(--fg, #f0f0f0);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
  min-width: 0;
}

.file-entry:hover {
  background: color-mix(in srgb, var(--accent, #3ca88d) 10%, transparent);
}

.file-entry.selected {
  background: color-mix(in srgb, var(--accent, #3ca88d) 18%, transparent);
}

.file-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.file-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.file-artist {
  flex: 0 0 92px;
  min-width: 0;
  color: var(--fg2, #919191);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  margin-left: auto;
}

.row-count {
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent, #3ca88d) 18%, transparent);
  color: var(--accent, #3ca88d);
  font-size: 11px;
  margin-left: 8px;
  flex: 0 0 auto;
}

.btn-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--accent);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.inline-add {
  opacity: 0;
  flex: 0 0 24px;
}

.file-entry:hover .inline-add,
.file-entry.selected .inline-add,
.inline-add:focus {
  opacity: 1;
}

.btn-add:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.more-menu-container {
  position: relative;
  display: inline-block;
}

.btn-more {
  background: transparent;
  border: none;
  color: var(--fg2);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.file-entry:hover .btn-more,
.file-entry.selected .btn-more,
.btn-more:focus,
.more-menu-container:has(.more-menu) .btn-more {
  opacity: 1;
}

.btn-more:hover {
  background: var(--bg3);
  color: var(--fg);
}

.file-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
}

.more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 4px;
  min-width: 120px;
}

.more-menu button {
  background: transparent;
  border: none;
  color: var(--fg);
  padding: 6px 10px;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}

.more-menu button:hover {
  background: var(--bg2);
}

.more-menu button.danger:hover {
  background: #e05;
  color: #fff;
}

.set-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.set-select {
  flex: 1;
  min-width: 0;
  background: color-mix(in srgb, var(--bg2, #171717) 88%, transparent);
  border: 1px solid var(--border, #2b2b2b);
  color: var(--fg, #fff);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
}

.compact-empty {
  padding: 6px 2px 4px;
}

.sets-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setlist {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
}

.setlist li {
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 4px;
  padding: 5px 6px;
  border-radius: 6px;
  background: transparent;
  transition: all 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
}

.setlist li:hover {
  background: color-mix(in srgb, var(--accent, #3ca88d) 8%, transparent);
}

.setlist li.drag-over {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent, #3ca88d) 14%, transparent);
}

.drag-handle {
  color: var(--fg2, #666);
  margin-right: 6px;
  padding: 4px 3px;
  display: flex;
  align-items: center;
  cursor: grab;
  user-select: none;
  flex: 0 0 auto;
  border-radius: 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle:hover {
  background: color-mix(in srgb, var(--accent, #3ca88d) 10%, transparent);
  color: var(--accent, #3ca88d);
}

.setlist-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.setlist li:hover .setlist-item-name {
  color: var(--accent, #3ca88d);
}

.btn-remove {
  background: transparent;
  border: none;
  color: var(--fg2, #aaa);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-remove:hover {
  color: #fff;
  background: #e05;
}

.setlist::-webkit-scrollbar-corner {
  background: var(--bg2, #111);
}

.setlist-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid color-mix(in srgb, var(--border, #2c2c2c) 80%, transparent);
}

.setlist-summary-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg2, #c7c7c7);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}

.modal {
  background: var(--bg2, #1a1a1a);
  border: 1px solid var(--border, #2c2c2c);
  border-radius: 12px;
  padding: 24px;
  width: min(520px, calc(100vw - 32px));
  max-height: min(85vh, 760px);
  overflow-y: auto;
  color: var(--fg, #fff);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent, #3ca88d);
}

.modal-icon-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2px;
}

.modal-icon-header svg {
  color: var(--accent, #3ca88d);
}

.export-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--bg3, #111) 88%, transparent);
  border: 1px solid var(--border, #2c2c2c);
}

.export-set-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--fg, #fff);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.export-meta-pills {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.export-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.export-separator-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--fg2, #c7c7c7);
}

.export-separator-select {
  background: color-mix(in srgb, var(--bg3, #111) 88%, transparent);
  border: 1px solid var(--border, #2c2c2c);
  color: var(--fg, #fff);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
}

.export-set-count {
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent, #3ca88d) 24%, transparent);
  color: var(--accent, #3ca88d);
  font-size: 11px;
  font-weight: 700;
}

.export-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--border, #2c2c2c);
  background: color-mix(in srgb, var(--bg3, #111) 88%, transparent);
  color: var(--fg2, #c7c7c7);
  font-size: 12px;
  line-height: 1.3;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}

.export-option:hover {
  border-color: color-mix(in srgb, var(--accent, #3ca88d) 36%, var(--border, #2c2c2c));
  background: color-mix(in srgb, var(--accent, #3ca88d) 10%, var(--bg3, #111));
  color: var(--fg, #fff);
}

.export-option input {
  margin: 0;
  accent-color: var(--accent, #3ca88d);
}

.export-option-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  cursor: pointer;
}

.export-option-label {
  min-width: 0;
}

.export-order-badge {
  flex: 0 0 auto;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent, #3ca88d) 24%, transparent);
  color: var(--accent, #3ca88d);
  font-size: 11px;
  font-weight: 700;
}

.export-order-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.btn-order {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border, #2c2c2c);
  color: var(--fg2, #c7c7c7);
}

.btn-order:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent, #3ca88d) 12%, var(--bg3, #111));
  border-color: color-mix(in srgb, var(--accent, #3ca88d) 36%, var(--border, #2c2c2c));
  color: var(--fg, #fff);
}

.btn-order:disabled {
  opacity: 0.35;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.modal-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn-primary {
  background: var(--accent, #3ca88d);
  color: #fff;
  border-color: var(--accent, #3ca88d);
}

.btn-secondary {
  background: var(--bg3, #111);
  color: var(--fg, #fff);
  border-color: var(--border, #2c2c2c);
}

.btn-close-modal {
  background: transparent;
  border: 1px solid var(--border, #2c2c2c);
  color: var(--fg2, #c7c7c7);
}

.btn-close-modal:hover {
  background: var(--bg3, #111);
  color: var(--fg, #fff);
}

.modal-buttons button:disabled {
  opacity: 0.65;
  cursor: wait;
  transform: none;
  box-shadow: none;
}

@media (max-width: 700px) {
  .modal {
    padding: 18px;
  }

  .export-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .export-separator-picker {
    width: 100%;
    justify-content: space-between;
  }

  .modal-buttons {
    flex-direction: column-reverse;
  }

  .modal-buttons button {
    width: 100%;
  }
}
</style>
