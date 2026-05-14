<template>
  <div id="app">
    <MainToolbar
      :modo="modo"
      :lang="lang"
      :t="t"
      :songTitle="song.title"
      :ytState="ytState"
      :ytReady="ytReady"
      @toggle-explorer="showExplorer = !showExplorer"
      @toggle-preview="showPreview = !showPreview"
      @open-help="openHelp"
      @edit-metadata="mostrarMetadata = true"
      @toggle-shortcuts="mostrarAtajos = !mostrarAtajos"
      @nuevo-archivo="nuevoArchivo"
      @abrir-archivo="abrirArchivoDirecto"
      @guardar-archivo="guardarDirecto"
      @guardar-como="guardarComo"
      @toggle-theme="toggleTheme"
      @toggle-lang="toggleLang"
      @transpose-up="transposeUp"
      @transpose-down="transposeDown"
      @convert-to-opensong="convertToOpenSong"
      @yt-play-pause="ytPlayPause"
      @yt-rewind="ytRewind"
      :osaConnected="osaConnected"
      :osaConnecting="osaConnecting"
      @open-osa-settings="showOsaSettings = true"
      @toggle-osa-connection="toggleOsaConnection"
    />

    <OsaSettingsModal
      :show="showOsaSettings"
      :t="t"
      :initialEndpoint="osaEndpoint"
      @save="saveOsaSettings"
      @cancel="showOsaSettings = false"
    />

    <!-- v-show en lugar de v-if: mantiene el estado de archivos cargados al cerrar -->
    <FileExplorer
      ref="fileExplorer"
      v-show="showExplorer"
      :open="showExplorer"
      :t="t"
      :osaConnected="osaConnected"
      :osaEndpoint="osaEndpoint"
      @open-file="openFileFromHandle"
      @open-remote-song="openRemoteOsaSong"
      @open-osa-settings="showOsaSettings = true"
      @alert="showAlert"
    />

    <!-- El editor se desplaza cuando el explorador está abierto -->
    <SongEditor
      v-model="song"
      ref="editor"
      :t="t"
      :style="{ '--explorer-left': showExplorer ? '320px' : '0px' }"
    />

    <!-- Preview como panel lateral derecho -->
    <SongPreview
      v-show="showPreview"
      :open="showPreview"
      :song="song"
      :t="t"
      @update-song="song = $event"
      @close="showPreview = false"
      @show-alert="showAlert"
    />

    <!-- Modal de metadatos -->
    <div v-if="mostrarMetadata" class="modal-overlay">
      <div class="modal">
        <h3>{{ t.metadataTitle }}</h3>
        <label>{{ t.title }}: <input v-model="song.title" :placeholder="t.title" /></label>
        <label>{{ t.artist }}: <input v-model="song.author" :placeholder="t.artist" /></label>
        <label>{{ t.notes }}: <textarea v-model="song.notes" :placeholder="t.notes"></textarea></label>
        <label>{{ t.key }}: <input v-model="song.key" placeholder="Ex. C, G, Am" /></label>
        <label>{{ t.originalKey }}: <input v-model="song.keyoriginal" placeholder="Ex. G" /></label>
        <label>{{ t.capo }}: <input type="number" v-model.number="song.capo" placeholder="Ex. 3" /></label>
        <label>{{ t.tempo }}: <input type="number" v-model.number="song.tempo" placeholder="Ex. 120" /></label>
        <label>{{ t.timeSignature }}: <input v-model="song.time_sig" placeholder="Ex. 4/4" /></label>
        <label>{{ t.duration }}:
          <div class="duration-row">
            <input type="number" v-model.number="durationMin" placeholder="min" min="0" />
            <span class="duration-label">min</span>
            <input type="number" v-model.number="durationSec" placeholder="seg" min="0" max="59" />
            <span class="duration-label">seg</span>
          </div>
        </label>
        <label>{{ t.delay }}: <input type="number" v-model.number="song.predelay" placeholder="Ex. 5" /></label>
        <label>{{ t.tags }}: <input v-model="song.theme" placeholder="Ex. Rock, Church, Acoustic" /></label>
        <label>{{ t.presentation }}: <input v-model="song.presentation" placeholder="Ex. V1, C, V2, C" /></label>
        <button type="button" class="btn-toggle-more" @click="showMoreMetadata = !showMoreMetadata">
          {{ showMoreMetadata ? t.showLess : t.showMore }}
        </button>
        <div v-if="showMoreMetadata" class="metadata-extra">
          <label>{{ t.ccli }}: <input v-model="song.ccli" placeholder="Ex. 1234567" /></label>
          <label>{{ t.copyright }}: <input v-model="song.copyright" :placeholder="t.copyrightPlaceholder" /></label>
          <label>{{ t.aka }}: <input v-model="song.aka" :placeholder="t.akaPlaceholder" /></label>
          <label>{{ t.customChords }}: <input v-model="song.custom_chords" :placeholder="t.customChordsPlaceholder" /></label>
          <label>{{ t.youtubeLink }}: <input v-model="song.link_youtube" placeholder="https://youtube.com/..." /></label>
          <label>{{ t.webLink }}: <input v-model="song.link_web" placeholder="https://example.com" /></label>
          <label>{{ t.audioLink }}: <input v-model="song.link_audio" placeholder="https://example.com/audio.mp3" /></label>
          <label>{{ t.otherLink }}: <input v-model="song.link_other" placeholder="https://example.com" /></label>
          <label>{{ t.hymnNumber }}: <input v-model="song.hymn_number" :placeholder="t.hymnNumberPlaceholder" /></label>
        </div>
        <div class="modal-buttons">
          <button @click="cerrarModal">{{ t.btnClose }}</button>
        </div>
      </div>
    </div>

    <!-- Modal de cambios sin guardar -->
    <div v-if="showUnsavedDialog" class="modal-overlay unsaved-overlay">
      <div class="modal">
        <div class="modal-icon-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h3>{{ t.unsavedTitle }}</h3>
        </div>
        <p class="modal-text">{{ t.unsavedText }}</p>
        <div class="modal-buttons vertical">
          <button class="btn-primary" @click="resolveUnsaved('save')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            {{ t.btnSave }}
          </button>
          <button class="btn-secondary" @click="resolveUnsaved('discard')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            {{ t.btnDiscard }}
          </button>
          <button class="btn-ghost" @click="resolveUnsaved('cancel')">{{ t.btnCancel }}</button>
        </div>
      </div>
    </div>

    <!-- Modal de Ayuda -->
    <div v-if="showHelpModal" class="modal-overlay">
      <div class="modal help-modal">
        <div class="modal-icon-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <h3>{{ t.helpTitle }}</h3>
        </div>
        <div class="help-content">
          <div class="help-item">
            <strong>{{ t.helpAbout }}</strong>
            <span>{{ t.helpAboutText }}</span>
          </div>
          <div class="help-item">
            <strong>{{ t.helpExplorer }}</strong>
            <span>{{ t.helpExplorerText }}</span>
          </div>
          <div class="help-item">
            <strong>{{ t.helpPreview }}</strong>
            <span>{{ t.helpPreviewText }}</span>
          </div>
          <div class="help-item">
            <strong>{{ t.helpFormat }}</strong>
            <span>{{ t.helpFormatText }}</span>
          </div>
          <div class="help-item">
            <strong>{{ t.helpNote }}</strong>
            <span>{{ t.helpNoteText }}</span>
          </div>
          <div class="help-footer">
            {{ t.helpContact }}
          </div>
        </div>
        <div class="modal-buttons">
          <button class="btn-close-modal" @click="showHelpModal = false">{{ t.btnClose }}</button>
        </div>
      </div>
    </div>

    <!-- Modal de Alerta Genérico (Duración, etc) -->
    <div v-if="alertModal.show" class="modal-overlay">
      <div class="modal alert-modal">
        <div class="modal-icon-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <h3>{{ alertModal.title }}</h3>
        </div>
        <p class="modal-text">{{ alertModal.message }}</p>
        <div class="modal-buttons">
          <button class="btn-close-modal" @click="alertModal.show = false">{{ t.btnClose }}</button>
        </div>
      </div>
    </div>

    <!-- Panel de atajos Rediseñado -->
    <Transition name="fade">
      <div v-if="mostrarAtajos" class="atajos-panel">
        <div class="atajos-header">
          <span>{{ t.shortcutsTitle }}</span>
          <button class="btn-close-mini" @click="mostrarAtajos = false">✕</button>
        </div>
        <div class="atajos-grid">
          <div class="atajo-row"><span>Alt + 1..9</span> <span>{{ t.shortcutSections }}</span></div>
          <div class="atajo-row"><span>Alt + T</span> <span>{{ t.shortcutTab }}</span></div>
          <div class="atajo-row"><span>Alt + G</span> <span>{{ t.shortcutGrid }}</span></div>
          <div class="atajo-row"><span>Alt + C</span> <span>{{ t.shortcutColumn }}</span></div>
          <div class="atajo-row"><span>Ctrl + S</span> <span>{{ t.shortcutSave }}</span></div>
        </div>
      </div>
    </Transition>

    <!-- Hidden YouTube Player Container -->
    <div id="youtube-player-container" style="display: none;"></div>
    <div id="youtube-player-placeholder" style="display: none;"></div>
  </div>
</template>

<script>
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { translations } from "./i18n";
import FileExplorer from "./components/FileExplorer.vue";
import OsaSettingsModal from "./components/OsaSettingsModal.vue";
import MainToolbar from "./components/MainToolbar.vue";
import SongEditor from "./components/SongEditor.vue";
import SongPreview from "./components/SongPreview.vue";
import * as osaApi from "./services/osaApi";

const SONG_DEFAULTS = () => ({
  title: '',
  author: '',
  lyrics: '',
  notes: '',
  key: '',
  keyoriginal: '',
  capo: 0,
  tempo: 120,
  time_sig: '4/4',
  duration: 0,
  predelay: 0,
  theme: '',
  presentation: '',
  ccli: '',
  copyright: '',
  aka: '',
  custom_chords: '',
  link_youtube: '',
  link_web: '',
  link_audio: '',
  link_other: '',
  hymn_number: '',
  uuid: '',
  last_modified: ''
});

const LEGACY_FIELD_ALIASES = {
  originalKey: 'keyoriginal',
  timeSignature: 'time_sig',
  delay: 'predelay',
  tag: 'theme',
  tags: 'theme',
  presentationOrder: 'presentation',
  // OSA JSON field aliases
  timesig: 'time_sig',
  lastModified: 'last_modified',
  customchords: 'custom_chords',
  midiindex: 'midi_index'
};

const createUuid = () => {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const currentIsoSecond = () => new Date().toISOString().split('.')[0] + 'Z';

const SONG_XML_FIELD_ORDER = [
  'uuid',
  'last_modified',
  'title',
  'author',
  'copyright',
  'presentation',
  'hymn_number',
  'capo',
  'tempo',
  'time_sig',
  'duration',
  'predelay',
  'ccli',
  'theme',
  'alttheme',
  'user1',
  'user2',
  'user3',
  'beatbuddysong',
  'beatbuddykit',
  'drummer',
  'drummerkit',
  'key',
  'keyoriginal',
  'preferred_instrument',
  'aka',
  'midi',
  'midi_index',
  'notes',
  'lyrics',
  'pad_file',
  'custom_chords',
  'link_youtube',
  'link_web',
  'link_audio',
  'loop_audio',
  'link_other',
  'abcnotation',
  'abctranspose'
];

export default {
  name: "App",
  components: { MainToolbar, SongEditor, SongPreview, FileExplorer, OsaSettingsModal },

  data() {
    return {
      mostrarMetadata: false,
      showMoreMetadata: false,
      mostrarAtajos: false,
      showPreview: false,
      showExplorer: false,
      // FIX: modo inicializa desde localStorage para persistir entre sesiones
      modo: localStorage.getItem('theme') || 'dark',
      lang: localStorage.getItem('lang') || 'es',
      song: SONG_DEFAULTS(),
      fileHandle: null,
      tabBlock: `;E|-------|\n;B|-------|\n;G|-------|\n;D|-------|\n;A|-------|\n;E|-------|`,
      gridBlock: `[ChordGrid]\n | C . . . | G . . . | Am . . . | F . D . | \n`,
      // ── Unsaved changes tracking ──
      savedSongSnapshot: JSON.stringify(SONG_DEFAULTS()),
      showUnsavedDialog: false,
      unsavedResolve: null,
      // ── New UI states ──
      showHelpModal: false,
      alertModal: {
        show: false,
        title: '',
        message: ''
      },
      // YouTube Player state
      ytPlayer: null,
      ytReady: false,
      ytState: -1, // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
      // ── OSA State ──
      osaEndpoint: localStorage.getItem('osa_endpoint') || '',
      osaConnected: false,
      osaConnecting: false,
      osaSocket: null,
      showOsaSettings: false,
      currentRemoteOsaInfo: null // { folder, filename }
    };
  },

  computed: {
    hasUnsavedChanges() {
      return JSON.stringify(this.song) !== this.savedSongSnapshot;
    },
    t() {
      return translations[this.lang];
    },
    // ── Duration split into min and sec ──
    durationMin: {
      get() {
        const total = Number(this.song.duration) || 0;
        return Math.floor(total / 60);
      },
      set(val) {
        const sec = (Number(this.song.duration) || 0) % 60;
        this.song.duration = (Number(val) || 0) * 60 + sec;
      }
    },
    durationSec: {
      get() {
        const total = Number(this.song.duration) || 0;
        return total % 60;
      },
      set(val) {
        const min = Math.floor((Number(this.song.duration) || 0) / 60);
        this.song.duration = min * 60 + (Number(val) || 0);
      }
    }
  },

  methods: {
    // ── Snapshot helpers ──
    takeSongSnapshot() {
      this.savedSongSnapshot = JSON.stringify(this.song);
    },

    normalizeSongFromXml(parsedSong) {
      const normalized = { ...parsedSong };

      // Flatten objects (tags with attributes) into simple values
      Object.keys(normalized).forEach(key => {
        const val = normalized[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          normalized[key] = val['#text'] !== undefined ? val['#text'] : '';
        }
      });

      Object.entries(LEGACY_FIELD_ALIASES).forEach(([legacyKey, canonicalKey]) => {
        const legacyValue = normalized[legacyKey];
        if (
          legacyValue !== undefined &&
          legacyValue !== null &&
          (
            normalized[canonicalKey] === undefined ||
            normalized[canonicalKey] === null ||
            normalized[canonicalKey] === ''
          )
        ) {
          normalized[canonicalKey] = legacyValue;
        }
        delete normalized[legacyKey];
      });

      return { ...SONG_DEFAULTS(), ...normalized };
    },

    prepareSongForSave() {
      const songToSave = { ...this.song };

      Object.keys(LEGACY_FIELD_ALIASES).forEach((legacyKey) => {
        delete songToSave[legacyKey];
      });

      if (!songToSave.uuid) {
        songToSave.uuid = createUuid();
        this.song.uuid = songToSave.uuid;
      }

      songToSave.last_modified = currentIsoSecond();
      this.song.last_modified = songToSave.last_modified;

      if (songToSave.capo !== undefined && songToSave.capo !== null && songToSave.capo !== '') {
        // Ensure we are not nesting an object if something went wrong
        const capoVal = (typeof songToSave.capo === 'object') 
          ? (songToSave.capo['#text'] !== undefined ? songToSave.capo['#text'] : '')
          : songToSave.capo;
        
        songToSave.capo = { '#text': capoVal, '@_print': '' };
      }

      const orderedSongToSave = {};

      SONG_XML_FIELD_ORDER.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(songToSave, field)) {
          orderedSongToSave[field] = songToSave[field];
        }
      });

      Object.keys(songToSave).forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(orderedSongToSave, field)) {
          orderedSongToSave[field] = songToSave[field];
        }
      });

      return orderedSongToSave;
    },

    prepareSongForOsaJson() {
      const flatSong = { ...this.song };

      // Generate UUID if missing
      if (!flatSong.uuid) {
        flatSong.uuid = createUuid();
        this.song.uuid = flatSong.uuid;
      }

      // Sync timestamps
      const isoNow = currentIsoSecond();
      flatSong.last_modified = isoNow;
      flatSong.lastModified = isoNow; // OSA Beta uses camelCase
      this.song.last_modified = isoNow;

      // Extract Capo value (flatten)
      if (flatSong.capo !== undefined && flatSong.capo !== null && flatSong.capo !== '') {
        flatSong.capo = (typeof flatSong.capo === 'object') 
          ? (flatSong.capo['#text'] !== undefined ? flatSong.capo['#text'] : '')
          : flatSong.capo;
      }

      // Map time_sig to timesig for OSA Beta
      if (flatSong.time_sig) {
        flatSong.timesig = flatSong.time_sig;
      }

      // Clean up aliases used for XML parsing just to be neat
      Object.keys(LEGACY_FIELD_ALIASES).forEach((legacyKey) => {
        delete flatSong[legacyKey];
      });

      return flatSong;
    },

    buildSongXml() {
      const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
      return builder.build({ song: this.prepareSongForSave() });
    },

    // ── Unsaved changes dialog ──
    // Returns a promise that resolves to 'save', 'discard', or 'cancel'
    askUnsavedChanges() {
      return new Promise((resolve) => {
        this.showUnsavedDialog = true;
        this.unsavedResolve = resolve;
      });
    },

    async resolveUnsaved(action) {
      this.showUnsavedDialog = false;
      if (action === 'save') {
        await this.guardarDirecto();
      }
      if (this.unsavedResolve) {
        this.unsavedResolve(action);
        this.unsavedResolve = null;
      }
    },

    // Helper: check unsaved and ask user. Returns true if safe to proceed.
    async checkUnsaved() {
      if (!this.hasUnsavedChanges) return true;
      const action = await this.askUnsavedChanges();
      return action !== 'cancel';
    },

    // FIX: toggle-theme ahora funciona — aplica data-theme al <html> para Pico CSS
    toggleTheme() {
      this.modo = this.modo === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.modo);
      localStorage.setItem('theme', this.modo);
    },

    toggleLang() {
      this.lang = this.lang === 'es' ? 'en' : 'es';
      localStorage.setItem('lang', this.lang);
    },

    async openFileFromHandle(handle) {
      // Check unsaved changes before opening another song
      if (!(await this.checkUnsaved())) return;
      try {
        const file = await handle.getFile();
        const texto = await file.text();
        const parser = new XMLParser({ ignoreAttributes: false });
        const json = parser.parse(texto);
        const parsedSong = json.song || {};

        // FIX: fallback robusto si el XML no tiene <song>
        this.song = this.normalizeSongFromXml(parsedSong);
        this.fileHandle = handle;
        this.currentRemoteOsaInfo = null;
        this.takeSongSnapshot();

        // Load YouTube if link exists
        this.$nextTick(() => {
          this.initYoutubeFromLink();
        });
      } catch (err) {
        console.error("Error opening file from handle:", err);
        this.showAlert({ message: this.t.errorOpenFile });
      }
    },

    // FIX: ya no necesita guardarMetadatos separado — los v-model ya actualizan reactivamente
    cerrarModal() {
      this.mostrarMetadata = false;
      this.showMoreMetadata = false;
    },

    async nuevoArchivo() {
      // Check unsaved changes before creating new
      if (!(await this.checkUnsaved())) return;
      // FIX: campos numéricos con valores correctos en lugar de strings vacíos
      this.song = SONG_DEFAULTS();
      this.fileHandle = null;
      this.currentRemoteOsaInfo = null;
      this.takeSongSnapshot();
      this.mostrarMetadata = true;
    },

    openHelp() {
      this.showHelpModal = true;
    },

    showAlert(config) {
      this.alertModal = {
        show: true,
        title: config.title || this.t.alertTitle,
        message: config.message || ''
      };
    },

    insertarBloque(texto) {
      const textarea = this.$refs.editor?.$refs?.lyricsTextarea;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText(texto, start, end, "end");
      textarea.focus();
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    },

    async guardarComo() {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: this.song.title || 'Nueva Canción'
        });
        const writable = await handle.createWritable();
        await writable.write(this.buildSongXml());
        await writable.close();
        this.fileHandle = handle;
        this.takeSongSnapshot();
        this.$refs.fileExplorer?.refreshRoot({ selectedName: handle.name });
        this.showAlert({ message: this.t.fileSaved });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error al guardar como:", err);
          this.showAlert({ message: this.t.errorSaveFile });
        }
      }
    },

    async abrirArchivoDirecto() {
      // Check unsaved changes before opening another file
      if (!(await this.checkUnsaved())) return;
      try {
        const [handle] = await window.showOpenFilePicker();
        this.fileHandle = handle;
        const file = await handle.getFile();
        const texto = await file.text();
        const parser = new XMLParser({ ignoreAttributes: false });
        const json = parser.parse(texto);
        const parsedSong = json.song || {};

        // FIX: fallback si el XML no contiene <song>
        this.song = this.normalizeSongFromXml(parsedSong);
        this.takeSongSnapshot();

        // Load YouTube if link exists
        this.$nextTick(() => {
          this.initYoutubeFromLink();
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error al abrir:", err);
          this.showAlert({ message: this.t.errorOpenFile });
        }
      }
    },

    async guardarDirecto() {
      try {
        if (this.osaConnected && this.currentRemoteOsaInfo) {
          return this.guardarEnOsa();
        }
        if (!this.fileHandle) {
          return this.guardarComo();
        }
        const writable = await this.fileHandle.createWritable();
        await writable.write(this.buildSongXml());
        await writable.close();
        this.takeSongSnapshot();
        this.$refs.fileExplorer?.refreshRoot({ selectedName: this.fileHandle.name });
        this.showAlert({ message: this.t.fileSaved });
      } catch (err) {
        console.error("Error al guardar:", err);
        this.showAlert({ message: this.t.errorSaveFile });
      }
    },

    async guardarEnOsa() {
      try {
        const songData = this.prepareSongForOsaJson();
        // Inject remote metadata required by OSA API
        songData.folder = this.currentRemoteOsaInfo.folder;
        songData.filename = this.currentRemoteOsaInfo.filename;

        this.showAlert({ message: this.t.osaSaveRemote });
        await osaApi.saveSongToOsa(this.osaEndpoint, songData);
        
        // Trigger remote device to reload the song (replaces REFRESH websocket logic)
        try {
          await osaApi.sendRemoteCommand(this.osaEndpoint, songData.folder, songData.filename);
        } catch (remoteErr) {
          console.warn("Song saved, but failed to trigger remote load:", remoteErr);
        }

        this.takeSongSnapshot();
        this.showAlert({ message: this.t.osaSaveSuccess });
      } catch (err) {
        console.error("Error saving to OSA:", err);
        const detail = err.message || "Unknown error";
        
        // Expose partial payload for debugging the 400 error
        const payloadPreview = JSON.stringify(this.prepareSongForOsaJson()).substring(0, 100) + "...";
        this.showAlert({ 
          message: `${this.t.osaError}: ${detail}\n\n[Debug Payload] ${payloadPreview}`, 
          title: "Error 400 Debug" 
        });
      }
    },

    // ── Convert editor text to OpenSong format ──
    convertToOpenSong() {
      if (!this.song?.lyrics) {
        this.showAlert({ message: this.t.emptyEditorError });
        return;
      }

      const CHORD_REGEX = /^[\s]*([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|6|2|4|M)*(?:\d*)(?:\/[A-G][#b]?)?\s*)+$/;
      const SECTION_REGEX = /^\s*(Intro|Verse|Pre[-\s]?Chorus|Chorus|Bridge|Solo|Instrumental|Outro|Interlude|Tag|Ending|Coda|Segue)\s*:?\s*(\d*)\s*$/i;

      const lines = this.song.lyrics.split('\n');
      const converted = lines.map(line => {
        // Already in OpenSong format (starts with . or [ or ;)
        // eslint-disable-next-line no-useless-escape
        if (/^\s*[.\[;]/.test(line)) return line;

        // Empty line
        if (!line.trim()) return '';

        // Section header: "Verse:", "Chorus 2:", etc.
        const sectionMatch = line.match(SECTION_REGEX);
        if (sectionMatch) {
          const name = sectionMatch[1] + (sectionMatch[2] ? ' ' + sectionMatch[2] : '');
          return `[${name}]`;
        }

        // Chord line: all tokens are valid chords
        if (CHORD_REGEX.test(line)) {
          return '.' + line;
        }

        // Lyrics line: leave as-is (space prefix for OpenSong format)
        return ' ' + line.trimStart();
      }).join('\n');

      this.song.lyrics = converted;
      this.showAlert({ message: this.t.convertedSuccess });
    },

    transponer(semitonos) {
      if (!this.song?.lyrics) return;
      const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
      const bemoles = { "Db":"C#","Eb":"D#","Gb":"F#","Ab":"G#","Bb":"A#" };
      const moverNota = (nota) => {
        if (bemoles[nota]) nota = bemoles[nota];
        const base = nota.match(/^[A-G](#|b)?/);
        if (!base) return nota;
        const idx = notas.indexOf(base[0]);
        if (idx === -1) return nota;
        return notas[(idx + semitonos + 12) % 12] + nota.slice(base[0].length);
      };
      // FIX: solo transpone en líneas que empiezan con "." (líneas de acordes)
      const lines = this.song.lyrics.split('\n');
      this.song.lyrics = lines.map(line => {
        if (!line.trim().startsWith('.')) return line;
        return line.replace(/([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?\d*)/g, moverNota);
      }).join('\n');
      if (this.song.key) this.song.key = moverNota(this.song.key);
    },

    // ── YouTube Controls ──
    initYoutubeFromLink() {
      if (!this.ytPlayer) return;
      
      const link = this.song?.link_youtube || "";
      const videoId = this.extractYoutubeId(link);

      if (videoId) {
        this.ytPlayer.cueVideoById(videoId);
        this.ytReady = true;
      } else {
        this.ytPlayer.stopVideo();
        this.ytReady = false;
      }
    },

    extractYoutubeId(url) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    },

    ytPlayPause() {
      if (!this.ytPlayer || !this.ytReady) return;
      if (this.ytState === 1) {
        this.ytPlayer.pauseVideo();
      } else {
        this.ytPlayer.playVideo();
      }
    },

    ytRewind(seconds) {
      if (!this.ytPlayer || !this.ytReady) return;
      const currentTime = this.ytPlayer.getCurrentTime();
      this.ytPlayer.seekTo(Math.max(0, currentTime - seconds), true);
    },

    transposeUp()   { this.transponer(1);  },
    transposeDown() { this.transponer(-1); },

    handleKeydown(e) {
      // Guardar con Alt+S para evitar conflictos con el navegador
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.guardarDirecto();
        return;
      }

      if (!e.altKey) return;
      const key = e.key.toUpperCase();
      const map = {
        "1": "[ ]", "2": "[Intro]", "3": "[Verse]", "4": "[Pre-Chorus]",
        "5": "[Chorus]",
        "6": "[Bridge]", "7": "[Solo]", "8": "[Instrumental]", "9": "[Outro]",
        "T": this.tabBlock,
        "G": this.gridBlock,
        "C": "\n!--\n"
      };
      if (map[key]) {
        this.insertarBloque(map[key]);
        e.preventDefault();
      }
    },

    // ── beforeunload guard ──
    handleBeforeUnload(e) {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
    // ── OSA Methods ──
    saveOsaSettings(newEndpoint) {
      this.osaEndpoint = newEndpoint;
      localStorage.setItem('osa_endpoint', newEndpoint);
      this.showOsaSettings = false;
      // Reconnect if already connected
      if (this.osaConnected) {
        this.disconnectOsa();
        this.connectOsa();
      }
    },
    toggleOsaConnection() {
      if (this.osaConnected || this.osaConnecting) {
        this.disconnectOsa();
      } else {
        this.connectOsa();
      }
    },
    connectOsa() {
      // Basic validation: check if it looks like an IP or hostname
      if (!this.osaEndpoint || !this.osaEndpoint.includes('.') || this.osaEndpoint.length < 7) {
        this.showOsaSettings = true;
        return;
      }
      this.osaConnecting = true;
      try {
        this.osaSocket = osaApi.createWebSocket(
          this.osaEndpoint,
          this.handleOsaMessage,
          () => {
            this.osaConnected = true;
            this.osaConnecting = false;
          },
          () => {
            this.osaConnected = false;
            this.osaConnecting = false;
            this.osaSocket = null;
          },
          (err) => {
            console.error("OSA Socket Error:", err);
            this.osaConnecting = false;
            this.showAlert(this.t.osaError, "Connection failed. Check IP/Port and mixed content settings.");
          }
        );
      } catch (e) {
        this.osaConnecting = false;
        console.error("OSA Connection Error:", e);
      }
    },
    disconnectOsa() {
      if (this.osaSocket) {
        this.osaSocket.close();
        this.osaSocket = null;
      }
      this.osaConnected = false;
      this.osaConnecting = false;
    },
    handleOsaMessage(payload) {
      // Handle remote refresh/update signal based on OSA 6.7.9 spec
      const isRefresh = (typeof payload === 'string' && payload === 'REFRESH') || 
                        (payload && payload.action === 'REFRESH');
      
      if (isRefresh) {
        this.fetchCurrentOsaSong();
      }
    },
    async fetchCurrentOsaSong() {
      try {
        const osaSong = await osaApi.fetchSongData(this.osaEndpoint);
        if (osaSong) {
          // Confirm before overwriting if there are unsaved changes?
          // For now, let's just update if the user is in "Remote Sync" mode
          this.song = this.normalizeSongFromXml(osaSong);
          this.currentRemoteOsaInfo = {
            folder: osaSong.folder || '',
            filename: osaSong.filename || ''
          };
          this.takeSongSnapshot();
        }
      } catch (e) {
        console.error("Failed to fetch current OSA song:", e);
      }
    },
    async openRemoteOsaSong(remoteSongInfo) {
      try {
        const osaSong = await osaApi.fetchSongData(
          this.osaEndpoint,
          remoteSongInfo.folder,
          remoteSongInfo.filename
        );
        if (osaSong) {
          this.song = this.normalizeSongFromXml(osaSong);
          this.currentRemoteOsaInfo = {
            folder: remoteSongInfo.folder,
            filename: remoteSongInfo.filename
          };
          this.takeSongSnapshot();
        }
      } catch (e) {
        console.error("Failed to fetch remote song:", e);
        this.showAlert(this.t.osaError, "Could not fetch song from OSA device.");
      }
    }
  },

  mounted() {
    // Load YouTube API
    if (!window.YT) {
      window.onYouTubeIframeAPIReady = () => {
        this.ytPlayer = new window.YT.Player('youtube-player-placeholder', {
          height: '0',
          width: '0',
          videoId: '',
          playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1 },
          events: {
            'onReady': () => {
              this.initYoutubeFromLink();
            },
            'onStateChange': (e) => {
              this.ytState = e.data;
            }
          }
        });
      };
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else if (window.YT && window.YT.Player) {
      // Si ya existe la API pero no el player (hot reload)
      window.onYouTubeIframeAPIReady();
    }

    // Aplicar tema guardado al arrancar
    document.documentElement.setAttribute('data-theme', this.modo);
    this._escapeHandler = (e) => { if (e.key === "Escape") this.cerrarModal(); };
    window.addEventListener("keydown", this.handleKeydown);
    window.addEventListener("keydown", this._escapeHandler);
    window.addEventListener("beforeunload", this.handleBeforeUnload);

    // Request persistent storage for PWA
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) console.log("Storage will not be cleared except by explicit user action");
      });
    }
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeydown);
    window.removeEventListener("keydown", this._escapeHandler);
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  }
};
</script>

<style>
/* ── Variables de tema (Pico CSS las sobreescribe si está instalado) ── */
:root {
  --bg: #0d0d0d;
  --bg2: #1a1a1a;
  --bg3: #2a2a2a;
  --fg: #f0f0f0;
  --fg2: #aaa;
  --accent: #3ca88d;
  --border: #333;
  --chord-color: #4FC3F7;
  --lyrics-l2: #4edeb5; /* Menta brillante para modo oscuro */
  --toolbar-h: 48px;
}
[data-theme="light"] {
  --bg: #f5f5f5;
  --bg2: #ffffff;
  --bg3: #e8e8e8;
  --fg: #111;
  --fg2: #555;
  --border: #ccc;
  --chord-color: #0070b8;
  --lyrics-l2: #1e6e52; /* Verde bosque profundo para modo claro */
}

/* ── Reset base ── */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Segoe UI', system-ui, sans-serif;
  overflow-x: hidden;
}

/* ==========================================================================
   FIX: Custom Scrollbars to prevent Windows Overlay Scrollbar bug.
   This prevents the 5-second fade-out timer, the pixel shifting, and 
   the GPU cursor flickering caused by OS-level scrollbars.
   ========================================================================== */
::-webkit-scrollbar {
  width: 14px;
  height: 14px;
}
::-webkit-scrollbar-track {
  background: var(--bg, #0d0d0d);
}
::-webkit-scrollbar-thumb {
  background: var(--border, #333);
  border-radius: 7px;
  border: 3px solid var(--bg, #0d0d0d);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--fg2, #555);
}

/* Transiciones originales restauradas (sin afectar el rendimiento) */
.file-explorer, .preview-panel {
  transition: width 280ms ease, left 280ms ease;
}

/* Evitamos transiciones en el textarea para asegurar fluidez extrema */
textarea {
  transition: none !important;
}

/* ── Toolbar ── */
header.toolbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--toolbar-h);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  z-index: 1200;
}

/* ── Botones globales ── */
button {
  padding: 8px 16px;
  background: var(--bg3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
button:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(60, 168, 141, 0.2);
}
button:active {
  transform: none !important;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex; justify-content: center; align-items: center;
  z-index: 1300;
}
.modal {
  background: var(--bg2);
  border: 1px solid var(--border);
  padding: 24px;
  border-radius: 12px;
  width: 440px;
  max-height: 85vh;
  overflow-y: auto;
  color: var(--fg);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
.modal h3 { 
  margin: 0; 
  font-size: 18px; 
  font-weight: 700;
  color: var(--accent);
}
.modal label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
  color: var(--fg2);
}
.modal label input,
.modal label textarea {
  background: var(--bg3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 13px;
  font-family: inherit;
}
.modal label textarea { resize: vertical; min-height: 60px; }
.modal-buttons { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

/* ── Duration row ── */
.btn-toggle-more {
  align-self: flex-start;
  padding: 6px 12px;
}
.metadata-extra {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
  border-top: 1px solid var(--border);
}
.duration-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.duration-row input {
  width: 70px;
  background: var(--bg3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 13px;
  font-family: inherit;
}
.duration-label {
  font-size: 12px;
  color: var(--fg2);
}

/* ── Panel de atajos Rediseñado ── */
.atajos-panel {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 280px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  z-index: 1250;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.atajos-header {
  padding: 10px 14px;
  background: var(--bg3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg2);
  border-bottom: 1px solid var(--border);
}

.atajos-grid {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.atajo-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.atajo-row span:first-child {
  color: var(--accent);
  font-weight: 600;
  font-family: monospace;
}

.atajo-row span:last-child {
  color: var(--fg2);
}

.btn-close-mini {
  background: transparent;
  border: none;
  color: var(--fg2);
  cursor: pointer;
  padding: 2px;
  font-size: 10px;
  line-height: 1;
}
.btn-close-mini:hover { color: var(--accent); }

/* ── Estilos de Modales Premium ── */
.modal-icon-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.modal-icon-header svg {
  color: var(--accent);
}

.modal-text {
  font-size: 14px;
  color: var(--fg2);
  line-height: 1.5;
  margin: 0;
}

.modal-buttons.vertical {
  flex-direction: column;
  gap: 8px;
}

.modal-buttons.vertical button {
  width: 100%;
  justify-content: flex-start;
}

.btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-secondary { background: var(--bg3); color: var(--fg); border-color: var(--border); }
.btn-ghost { background: transparent; border: none; color: var(--fg2); }
.btn-ghost:hover { background: rgba(255,255,255,0.05); color: var(--fg); }

.btn-close-modal {
  background: var(--bg3);
  color: var(--fg2);
  border: 1px solid var(--border);
  min-width: 100px;
}
.btn-close-modal:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 8px;
}

.help-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-item strong {
  font-size: 13px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.help-item span {
  font-size: 13px;
  color: var(--fg2);
  line-height: 1.6;
}

.help-footer {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--fg2);
  font-style: italic;
  text-align: center;
}

/* Transiciones */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Utilidades de contenido (letras/acordes) ── */
.chord { white-space: pre; font-family: monospace; color: var(--chord-color); font-weight: bold; }
.columns { display: flex; gap: 20px; }
.column { flex: 1; min-width: 200px; padding-right: 10px; border-right: 1px dashed var(--border); }
.column:last-child { border-right: none; }

/* ── Marquee & Tooltip ── */
.marquee-content {
  display: inline-block;
  white-space: nowrap;
  transition: transform 0.3s ease-out; /* Regreso suave */
}

/* Custom Tooltip (Instant) */
[data-tooltip] {
  position: relative;
}

[data-tooltip]:after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a;
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s;
  z-index: 99999;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  border: 1px solid #444;
}

[data-tooltip]:hover {
  overflow: visible !important; /* Permite que el tooltip escape de la celda */
}

[data-tooltip]:hover:after {
  opacity: 1;
}
</style>
