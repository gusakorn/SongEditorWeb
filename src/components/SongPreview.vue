<template>
  <aside
    class="preview-panel"
    :class="{ open, fullscreen: viewMode === 'fullscreen' }"
    :style="panelStyle"
  >
    <!-- Resize handle — only in normal mode -->
    <div
      v-if="viewMode === 'normal' && open"
      class="resize-handle"
      @mousedown.prevent="startResize"
    />

    <header class="preview-headerbar">
      <span class="preview-title">{{ t.preview }}</span>

      <div class="preview-controls">

        <!-- Modos de vista — mutuamente exclusivos -->
        <button
          class="btn-icon"
          :class="{ active: viewMode === 'phone' }"
          @click="setViewMode('phone')"
          :title="t.phoneView"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="2"/>
            <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
          </svg>
        </button>

        <button
          class="btn-icon"
          :class="{ active: viewMode === 'tablet' }"
          @click="setViewMode('tablet')"
          :title="t.tabletView"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
        </button>

        <button
          class="btn-icon"
          :class="{ active: viewMode === 'print' }"
          @click="setViewMode('print')"
          :title="t.printView"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
          </svg>
        </button>

        <button
          class="btn-icon"
          :class="{ active: viewMode === 'fullscreen' }"
          @click="setViewMode('fullscreen')"
          :title="t.fullscreen"
        >
          <!-- Expandir -->
          <svg v-if="viewMode !== 'fullscreen'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"/>
            <polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3"  y1="21" x2="10" y2="14"/>
          </svg>
          <!-- Contraer -->
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 14 4 20 10 20"/>
            <polyline points="20 10 20 4 14 4"/>
            <line x1="14" y1="10" x2="21" y2="3"/>
            <line x1="3"  y1="21" x2="10" y2="14"/>
          </svg>
        </button>

        <span class="sep"/>

        <!-- Botón imprimir — solo visible en modo print -->
        <button
          v-if="viewMode === 'print'"
          class="btn-icon"
          @click="printSong"
          :title="t.print"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
        </button>

        <!-- Sync scroll: flecha arriba = iniciar/reanudar, pausa = detener -->
        <button
          class="btn-icon"
          :class="{ active: syncScrollActive }"
          @click="toggleSyncScroll"
          :title="syncScrollActive ? t.syncScrollPause : t.syncScrollStart"
        >
          <svg v-if="!syncScrollActive" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        </button>

        <span class="sep"/>

        <!-- Tamaño de fuente -->
        <label class="preset-select-wrap" :title="t.previewStyle">
          <span class="sr-only">{{ t.previewStyle }}</span>
          <select v-model="selectedPreset" class="preset-select">
            <option
              v-for="preset in previewPresets"
              :key="preset.id"
              :value="preset.id"
            >
              {{ preset.label }}
            </option>
          </select>
        </label>

        <span class="sep"/>

        <button class="btn-icon" @click="decreaseFont" :title="t.decreaseFont">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button class="btn-icon" @click="increaseFont" :title="t.increaseFont">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>

        <span class="sep"/>

      </div>
    </header>

    <div
      class="preview-scroll"
      ref="content"
    >
      <div
        v-if="viewMode === 'print'"
        class="print-pages"
        :style="{ fontSize: fontSize + 'px', ...presetStyle }"
      >
        <section
          v-for="(page, index) in printPagesData"
          :key="`page-${index}`"
          class="preview-content sim-print print-page"
        >
          <template v-if="hasPreviewContent">
            <div
              v-for="(block, blockIndex) in page"
              :key="`page-${index}-block-${blockIndex}`"
              v-html="block.html"
            />
          </template>
          <div class="empty-state" v-else>
            <p>{{ t.emptyPreview }}</p>
          </div>
        </section>
      </div>

      <div
        v-else
        class="preview-content"
        :class="viewMode !== 'normal' ? `sim-${viewMode}` : ''"
        :style="{ fontSize: fontSize + 'px', ...presetStyle }"
      >
        <div class="song-header" v-if="song && (song.title || song.author)">
          <div class="song-title">{{ song.title }}</div>
          <div class="song-meta" v-if="song.author">{{ song.author }}</div>
          <div class="song-meta" v-if="song.key">
            {{ t.key }}: {{ song.key }}{{ song.capo ? `  |  ${t.capo}: ${song.capo}` : '' }}
          </div>
        </div>

        <div v-if="hasPreviewContent" v-html="renderedLyrics"/>
        <div class="empty-state" v-else>
          <p>{{ t.emptyPreview }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="viewMode === 'print' && hasPreviewContent"
      ref="printMeasureFrame"
      class="preview-content sim-print print-measure-frame"
      :style="{ fontSize: fontSize + 'px', ...presetStyle }"
    >
      <div ref="printMeasureFlow" class="print-measure-flow">
        <div
          v-for="(block, index) in printBlocks"
          :key="`measure-${index}`"
          ref="printMeasureItems"
          class="print-measure-item"
          :data-keep-with-next="block.keepWithNext ? '1' : '0'"
          v-html="block.html"
        />
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: "SongPreview",
  props: {
    song:  Object,
    open:  { type: Boolean, default: false },
    modo: String,
    t: Object
  },
  emits: ['update-song', 'close', 'show-alert'],

  data() {
    return {
      fontSize: parseInt(localStorage.getItem('previewFontSize')) || 15,
      // Un único campo — solo un modo activo a la vez
      // Valores posibles: 'normal' | 'phone' | 'tablet' | 'print' | 'fullscreen'
      viewMode: 'normal',
      syncScrollActive: false,
      syncAnimation: null,
      syncStartTimeout: null,
      // Resize handle state
      customWidth: parseInt(localStorage.getItem('previewWidth')) || 450,
      isResizing: false,
      printPagesData: [],
      paginationRaf: null,
      selectedPreset: localStorage.getItem('previewPreset') || 'classic',
      previewPresets: [
        { id: 'classic', label: 'Classic' },
        { id: 'modern', label: 'Modern' },
        { id: 'stage', label: 'Stage' },
        { id: 'serif', label: 'Serif' },
        { id: 'mono', label: 'Mono' }
      ]
    };
  },

  computed: {
    panelStyle() {
      if (!this.open) return {};
      switch (this.viewMode) {
        case 'phone':      return { width: '375px' };
        case 'tablet':     return { width: '820px' };
        case 'print':      return { width: '850px' };
        case 'fullscreen': return { width: '100vw' };
        default:           return { width: this.customWidth + 'px' };
      }
    },
    presetStyle() {
      const isLight = this.modo === 'light';
      const presets = {
        classic: {
          '--preview-font-lyrics': "'Roboto Mono', monospace",
          '--preview-font-chords': "'Roboto Mono', monospace",
          '--preview-font-sections': "'Roboto Mono', monospace",
          '--preview-font-comments': "'Roboto Mono', monospace",
          '--preview-font-tabs': "'Roboto Mono', monospace",
          '--preview-color-lyrics': 'var(--fg, #f0f0f0)',
          '--preview-color-chords': 'var(--chord-color, #4FC3F7)',
          '--preview-color-sections': isLight ? '#6b7280' : 'var(--fg2, #aaa)',
          '--preview-color-comments': isLight ? '#7c5a2b' : 'color-mix(in srgb, var(--fg2, #aaa) 92%, var(--fg, #fff) 8%)',
          '--preview-color-tabs': isLight ? '#374151' : 'var(--fg, #f0f0f0)',
          '--preview-color-lyrics-l2': 'var(--lyrics-l2, #3ca88d)',
          '--preview-size-lyrics': '1em',
          '--preview-size-chords': '0.96em',
          '--preview-size-sections': '0.78em',
          '--preview-size-comments': '0.94em',
          '--preview-size-tabs': '0.96em',
          '--preview-spacing-sections': '0.06em',
          '--preview-weight-lyrics': '400',
          '--preview-weight-chords': '700',
          '--preview-line-height': '1.55',
          '--preview-section-margin': '14px 0 3px',
          '--preview-chorus-padding': '4px 10px',
          '--preview-chorus-margin': '6px 0',
          '--preview-comment-bg': isLight ? 'rgba(180, 83, 9, 0.08)' : 'rgba(255, 255, 255, 0.04)',
          '--preview-comment-border': isLight ? 'rgba(180, 83, 9, 0.22)' : 'rgba(255, 255, 255, 0.12)',
          '--preview-chorus-bg': isLight ? 'rgba(60, 168, 141, 0.08)' : 'rgba(255, 255, 255, 0.1)',
          '--preview-chorus-border': 'var(--accent, #3ca88d)'
        },
        modern: {
          '--preview-font-lyrics': "'Inter', 'Segoe UI', system-ui, sans-serif",
          '--preview-font-chords': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-font-sections': "'Inter', 'Segoe UI', system-ui, sans-serif",
          '--preview-font-comments': "'Inter', 'Segoe UI', system-ui, sans-serif",
          '--preview-font-tabs': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-color-lyrics': 'var(--fg, #f0f0f0)',
          '--preview-color-chords': isLight ? '#005a9c' : '#6ad1ff',
          '--preview-color-sections': isLight ? '#64748b' : '#c8d0d8',
          '--preview-color-comments': isLight ? '#7c3f00' : '#b5bec8',
          '--preview-color-tabs': isLight ? '#1f2937' : '#eef4f7',
          '--preview-color-lyrics-l2': isLight ? '#0f766e' : '#7bd8bf',
          '--preview-size-lyrics': '1.04em',
          '--preview-size-chords': '0.78em',
          '--preview-size-sections': '0.7em',
          '--preview-size-comments': '0.86em',
          '--preview-size-tabs': '0.86em',
          '--preview-spacing-sections': '0.12em',
          '--preview-weight-lyrics': '450',
          '--preview-weight-chords': '650',
          '--preview-line-height': '1.78',
          '--preview-section-margin': '18px 0 4px',
          '--preview-chorus-padding': '7px 12px',
          '--preview-chorus-margin': '10px 0',
          '--preview-comment-bg': isLight ? 'rgba(217, 119, 6, 0.07)' : 'rgba(255, 255, 255, 0.035)',
          '--preview-comment-border': isLight ? 'rgba(217, 119, 6, 0.22)' : 'rgba(106, 209, 255, 0.22)',
          '--preview-chorus-bg': isLight ? 'rgba(0, 90, 156, 0.07)' : 'rgba(106, 209, 255, 0.09)',
          '--preview-chorus-border': isLight ? '#005a9c' : '#6ad1ff'
        },
        stage: {
          '--preview-font-lyrics': "'Nunito Sans', 'Segoe UI', system-ui, sans-serif",
          '--preview-font-chords': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-font-sections': "'Nunito Sans', 'Segoe UI', system-ui, sans-serif",
          '--preview-font-comments': "'Nunito Sans', 'Segoe UI', system-ui, sans-serif",
          '--preview-font-tabs': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-color-lyrics': 'var(--fg, #f0f0f0)',
          '--preview-color-chords': isLight ? '#b45309' : '#ffd166',
          '--preview-color-sections': isLight ? '#92400e' : '#ffe7a3',
          '--preview-color-comments': isLight ? '#0f766e' : '#d6d1c0',
          '--preview-color-tabs': isLight ? '#3f3f46' : '#fff6dd',
          '--preview-color-lyrics-l2': isLight ? '#0f766e' : '#90e0ef',
          '--preview-size-lyrics': '1.1em',
          '--preview-size-chords': '1.28em',
          '--preview-size-sections': '0.98em',
          '--preview-size-comments': '0.96em',
          '--preview-size-tabs': '1.02em',
          '--preview-spacing-sections': '0.14em',
          '--preview-weight-lyrics': '650',
          '--preview-weight-chords': '800',
          '--preview-line-height': '1.82',
          '--preview-section-margin': '20px 0 6px',
          '--preview-chorus-padding': '10px 14px',
          '--preview-chorus-margin': '12px 0',
          '--preview-comment-bg': isLight ? 'rgba(15, 118, 110, 0.08)' : 'rgba(255, 209, 102, 0.06)',
          '--preview-comment-border': isLight ? 'rgba(15, 118, 110, 0.22)' : 'rgba(255, 209, 102, 0.24)',
          '--preview-chorus-bg': isLight ? 'rgba(180, 83, 9, 0.08)' : 'rgba(255, 209, 102, 0.14)',
          '--preview-chorus-border': isLight ? '#b45309' : '#ffd166'
        },
        serif: {
          '--preview-font-lyrics': "'Merriweather', Georgia, serif",
          '--preview-font-chords': "'Roboto Mono', monospace",
          '--preview-font-sections': "'Inter', 'Segoe UI', system-ui, sans-serif",
          '--preview-font-comments': "'Inter', 'Segoe UI', system-ui, sans-serif",
          '--preview-font-tabs': "'Roboto Mono', monospace",
          '--preview-color-lyrics': 'var(--fg, #f0f0f0)',
          '--preview-color-chords': isLight ? '#0369a1' : '#7dd3fc',
          '--preview-color-sections': isLight ? '#64748b' : '#cbd5e1',
          '--preview-color-comments': isLight ? '#8b5e34' : '#b6c2cf',
          '--preview-color-tabs': isLight ? '#334155' : '#f0f0f0',
          '--preview-color-lyrics-l2': isLight ? '#0f766e' : '#8dd3c7',
          '--preview-size-lyrics': '1.2em',
          '--preview-size-chords': '0.72em',
          '--preview-size-sections': '0.72em',
          '--preview-size-comments': '0.82em',
          '--preview-size-tabs': '0.82em',
          '--preview-spacing-sections': '0.1em',
          '--preview-weight-lyrics': '400',
          '--preview-weight-chords': '650',
          '--preview-line-height': '1.9',
          '--preview-section-margin': '22px 0 5px',
          '--preview-chorus-padding': '8px 12px',
          '--preview-chorus-margin': '12px 0',
          '--preview-comment-bg': isLight ? 'rgba(245, 158, 11, 0.07)' : 'rgba(255, 255, 255, 0.03)',
          '--preview-comment-border': isLight ? 'rgba(180, 83, 9, 0.2)' : 'rgba(203, 213, 225, 0.18)',
          '--preview-chorus-bg': isLight ? 'rgba(15, 118, 110, 0.08)' : 'rgba(141, 211, 199, 0.1)',
          '--preview-chorus-border': isLight ? '#0f766e' : '#8dd3c7'
        },
        mono: {
          '--preview-font-lyrics': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-font-chords': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-font-sections': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-font-comments': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-font-tabs': "'IBM Plex Mono', 'Roboto Mono', monospace",
          '--preview-color-lyrics': 'var(--fg, #f0f0f0)',
          '--preview-color-chords': isLight ? '#0369a1' : '#5cc8ff',
          '--preview-color-sections': isLight ? '#4b5563' : '#aeb7bf',
          '--preview-color-comments': isLight ? '#7c3f00' : '#b3bcc4',
          '--preview-color-tabs': isLight ? '#111827' : '#eef4f7',
          '--preview-color-lyrics-l2': isLight ? '#0f766e' : '#78d6bf',
          '--preview-size-lyrics': '0.9em',
          '--preview-size-chords': '0.84em',
          '--preview-size-sections': '0.66em',
          '--preview-size-comments': '0.78em',
          '--preview-size-tabs': '0.86em',
          '--preview-spacing-sections': '0.08em',
          '--preview-weight-lyrics': '400',
          '--preview-weight-chords': '650',
          '--preview-line-height': '1.36',
          '--preview-section-margin': '10px 0 2px',
          '--preview-chorus-padding': '3px 8px',
          '--preview-chorus-margin': '4px 0',
          '--preview-comment-bg': isLight ? 'rgba(217, 119, 6, 0.07)' : 'rgba(255, 255, 255, 0.035)',
          '--preview-comment-border': isLight ? 'rgba(217, 119, 6, 0.22)' : 'rgba(255, 255, 255, 0.12)',
          '--preview-chorus-bg': isLight ? 'rgba(3, 105, 161, 0.07)' : 'rgba(92, 200, 255, 0.08)',
          '--preview-chorus-border': isLight ? '#0369a1' : '#5cc8ff'
        }
      };
      return presets[this.selectedPreset] || presets.classic;
    },
    hasPreviewContent() {
      return Boolean(this.song?.lyrics);
    },
    printBlocks() {
      const blocks = [];
      const headerHtml = this.renderSongHeaderBlock();
      if (headerHtml) {
        blocks.push({ html: headerHtml, keepWithNext: true });
      }
      if (!this.song?.lyrics) return blocks;
      return blocks.concat(this.renderedPrintBlocks());
    },

    renderedLyrics() {
      if (!this.song?.lyrics) return '';
      // FIX: regex más robusto para split de column break
      const columnas = this.song.lyrics.split(/\n?!--\n?/);
      const htmlColumnas = columnas.map(col => {
        const lineas = col.trim().split('\n');
        let dentroDeChorus = false;
        let seccionBilingue = false;
        let contadorLetras = 0;
        const contenido = lineas.map(linea => {
          const trimmed = linea.trim();
          if (/^\[.+\]$/.test(trimmed)) {
            const nombre = trimmed.slice(1, -1);
            const etiqueta = this.formatSectionLabel(nombre);
            seccionBilingue = /L$/i.test(nombre);
            contadorLetras = 0;
            // FIX: solo matchea "Chorus" exacto, no "Pre-Chorus"
            if (/^chorus(\s|$)/i.test(etiqueta)) {
              dentroDeChorus = true;
              return `<div class="chorus-block"><div class="section-label chorus">${etiqueta}</div>`;
            }
            if (dentroDeChorus) {
              dentroDeChorus = false;
              return `</div><div class="section-label">${etiqueta}</div>`;
            }
            return `<div class="section-label">${etiqueta}</div>`;
          }
          if (linea.trim().startsWith(';')) {
            return this.renderPreviewLine(linea).html;
          }
          if (linea.trim().startsWith('.')) {
            return this.renderPreviewLine(linea).html;
          }
          // FIX: remove extra space from start of lyrics line
          if (linea.replace(/^ /, "").trim()) {
            const renderedLine = this.renderPreviewLine(linea, seccionBilingue, contadorLetras);
            if (seccionBilingue) contadorLetras++;
            return renderedLine.html;
          }
          return this.renderPreviewLine(linea).html;
        }).join('');

        const cerrado = dentroDeChorus ? contenido + '</div>' : contenido;
        return `<div class="column">${cerrado}</div>`;
      }).join('');

      return `<div class="columns">${htmlColumnas}</div>`;
    }
  },

  methods: {
    renderSongHeaderBlock() {
      if (!this.song || (!this.song.title && !this.song.author && !this.song.key)) return '';
      const title = this.escapeHtml(this.song.title || '');
      const author = this.song.author
        ? `<div class="song-meta">${this.escapeHtml(this.song.author)}</div>`
        : '';
      const meta = this.song.key
        ? `<div class="song-meta">${this.escapeHtml(this.t.key)}: ${this.escapeHtml(this.song.key)}${this.song.capo ? `  |  ${this.escapeHtml(this.t.capo)}: ${this.escapeHtml(String(this.song.capo))}` : ''}</div>`
        : '';
      return `<div class="song-header"><div class="song-title">${title}</div>${author}${meta}</div>`;
    },
    renderedPrintBlocks() {
      const columns = this.song.lyrics.split(/\n?!--\n?/);
      return columns.flatMap((column, columnIndex) => {
        const blocks = this.renderColumnBlocks(column);
        if (columnIndex === 0) return blocks;
        return [
          { html: '<div class="print-column-break"></div>', keepWithNext: true },
          ...blocks
        ];
      });
    },
    schedulePrintPagination() {
      cancelAnimationFrame(this.paginationRaf);
      this.paginationRaf = requestAnimationFrame(() => {
        this.$nextTick(() => this.rebuildPrintPages());
      });
    },
    rebuildPrintPages() {
      if (this.viewMode !== 'print' || !this.hasPreviewContent) {
        this.printPagesData = [];
        return;
      }

      const frame = this.$refs.printMeasureFrame;
      const items = this.$refs.printMeasureItems;
      if (!frame || !items || !items.length) return;

      const styles = window.getComputedStyle(frame);
      const pageHeight = frame.clientHeight;
      const paddingTop = parseFloat(styles.paddingTop) || 0;
      const paddingBottom = parseFloat(styles.paddingBottom) || 0;
      const availableHeight = pageHeight - paddingTop - paddingBottom;

      const measured = items.map((item, index) => {
        const itemStyles = window.getComputedStyle(item);
        const marginTop = parseFloat(itemStyles.marginTop) || 0;
        const marginBottom = parseFloat(itemStyles.marginBottom) || 0;
        return {
          html: this.printBlocks[index].html,
          keepWithNext: this.printBlocks[index].keepWithNext,
          height: item.getBoundingClientRect().height + marginTop + marginBottom
        };
      });

      const pages = [];
      let currentPage = [];
      let usedHeight = 0;

      measured.forEach((block, index) => {
        const nextBlock = measured[index + 1];
        const requiredHeight = block.keepWithNext && nextBlock
          ? block.height + nextBlock.height
          : block.height;

        if (currentPage.length && usedHeight + requiredHeight > availableHeight) {
          pages.push(currentPage);
          currentPage = [];
          usedHeight = 0;
        }

        currentPage.push({ html: block.html });
        usedHeight += block.height;
      });

      if (currentPage.length) {
        pages.push(currentPage);
      }

      this.printPagesData = pages.length ? pages : [[{ html: '' }]];
    },
    renderColumnBlocks(columnText) {
      const lines = columnText.trim().split('\n');
      const blocks = [];
      let dentroDeChorus = false;
      let seccionBilingue = false;
      let contadorLetras = 0;
      let justSawSection = false;
      lines.forEach((linea) => {
        const trimmed = linea.trim();
        if (/^\[.+\]$/.test(trimmed)) {
          const nombre = trimmed.slice(1, -1);
          const etiqueta = this.formatSectionLabel(nombre);
          seccionBilingue = /L$/i.test(nombre);
          contadorLetras = 0;
          dentroDeChorus = false;
          if (/^chorus(\s|$)/i.test(etiqueta)) {
            dentroDeChorus = true;
            blocks.push({
              html: `<div class="section-label chorus print-chorus-label">${etiqueta}</div>`,
              weight: 2,
              keepWithNext: true
            });
            justSawSection = true;
            return;
          }
          blocks.push({
            html: `<div class="section-label">${etiqueta}</div>`,
            weight: 2,
            keepWithNext: true
          });
          justSawSection = true;
          return;
        }

        if (justSawSection && !trimmed) return;

        const rendered = this.renderPreviewLine(linea, seccionBilingue, contadorLetras, dentroDeChorus);
        if (linea.trim() && !linea.trim().startsWith('.') && !linea.trim().startsWith(';')) {
          contadorLetras += 1;
        }
        blocks.push(rendered);
        justSawSection = false;
      });

      return blocks;
    },
    renderPreviewLine(linea, seccionBilingue = false, contadorLetras = 0, dentroDeChorus = false) {
      const chorusClass = dentroDeChorus ? ' print-chorus-line' : '';
      if (linea.trim().startsWith(';')) {
        const commentBody = linea.replace(/^\s*;\s?/, '');
        if (this.isTabComment(commentBody)) {
          return {
            html: `<div class="line-tab${chorusClass}">${this.renderTabComment(commentBody)}</div>`,
            weight: 1
          };
        }
        return {
          html: `<div class="line-comment${chorusClass}">${this.escapeHtml(commentBody)}</div>`,
          weight: 1.4
        };
      }
      if (linea.trim().startsWith('.')) {
        const sinPunto = linea.replace(/^\s*\./, '');
        const conSpans = sinPunto.replace(
          /([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*(?:\/[A-G](?:#|b)?)?)/g,
          `<span class="chord">$1</span>`
        );
        return {
          html: `<div class="line-chords${chorusClass}">${conSpans}</div>`,
          weight: 1
        };
      }
      const lyricLine = linea.replace(/^ /, "");
      if (lyricLine.trim()) {
        let cls = 'line-lyrics';
        if (seccionBilingue && (contadorLetras + 1) % 2 === 0) cls += ' l2';
        cls += chorusClass;
        return {
          html: `<div class="${cls}">${lyricLine}</div>`,
          weight: 1
        };
      }
      return {
        html: '<div class="line-empty"></div>',
        weight: 0.6
      };
    },
    ensurePreviewFonts() {
      const linkId = 'sew-preview-fonts';
      if (document.getElementById(linkId)) return;
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Nunito+Sans:wght@400;600;700&family=Roboto+Mono:wght@400;700&display=swap';
      document.head.appendChild(link);
    },
    escapeHtml(text) {
      return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    renderTabComment(text) {
      return this.escapeHtml(text).replace(/-/g, (char) => `<span class="tab-faint">${char}</span>`);
    },
    formatSectionLabel(rawLabel) {
      const raw = String(rawLabel || '').trim();
      if (!raw) return '';

      const hasBilingualSuffix = raw.length > 1 && /l$/i.test(raw);
      const withoutSuffix = hasBilingualSuffix ? raw.slice(0, -1).trim() : raw;
      const match = withoutSuffix.match(/^([A-Za-z][A-Za-z\s-]*?)(\d+)?$/);
      if (!match) return raw;

      const key = match[1].replace(/\s+/g, '').replace(/-/g, '').toLowerCase();
      const number = match[2] ? ` ${match[2]}` : '';
      const aliases = {
        i: 'Intro',
        intro: 'Intro',
        v: 'Verse',
        vs: 'Verse',
        verse: 'Verse',
        pc: 'Pre-Chorus',
        pre: 'Pre-Chorus',
        prechorus: 'Pre-Chorus',
        c: 'Chorus',
        ch: 'Chorus',
        chorus: 'Chorus',
        b: 'Bridge',
        br: 'Bridge',
        bridge: 'Bridge',
        s: 'Solo',
        solo: 'Solo',
        inst: 'Instrumental',
        instrumental: 'Instrumental',
        o: 'Outro',
        outro: 'Outro',
        int: 'Interlude',
        interlude: 'Interlude',
        t: 'Tag',
        tag: 'Tag',
        e: 'Ending',
        end: 'Ending',
        ending: 'Ending'
      };

      const normalized = aliases[key];
      if (!normalized) return raw;
      return `${normalized}${number}${hasBilingualSuffix ? ' L' : ''}`;
    },
    isTabComment(line) {
      const trimmed = String(line || '').trim();
      if (!trimmed) return false;
      return /^(?:[A-Ga-g][#b]?|[eEBDGA])\|/.test(trimmed) ||
        /^[|:.\-\dhoHpPbBrRxX/\\~*() ]+$/.test(trimmed) ||
        /^[A-Za-z]{1,4}\|[-0-9hHpPbBrRxX/\\~*(). :]+$/.test(trimmed);
    },
    // Si el modo ya está activo, vuelve a 'normal' (toggle)
    setViewMode(mode) {
      this.viewMode = this.viewMode === mode ? 'normal' : mode;
    },

    // ── Resize handle logic ──
    startResize(e) {
      this.isResizing = true;
      const startX = e.clientX;
      const startWidth = this.customWidth;

      const onMouseMove = (ev) => {
        // Panel is on the right, so moving mouse left increases width
        const delta = startX - ev.clientX;
        const newWidth = Math.max(300, Math.min(startWidth + delta, window.innerWidth * 0.7));
        this.customWidth = Math.round(newWidth);
      };

      const onMouseUp = () => {
        this.isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('blur', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        localStorage.setItem('previewWidth', this.customWidth);
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      window.addEventListener('blur', onMouseUp);
    },

    printSong() {
      const content = this.$refs.content?.innerHTML;
      if (!content) return;
      const win = window.open('', '_blank', 'width=850,height=700');
      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${this.song?.title || 'Canción'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Roboto Mono', monospace; font-size: 11pt; color: #000; background: #fff; padding: 18mm 20mm; }
    .song-title  { font-size: 17pt; font-weight: bold; margin-bottom: 3pt; }
    .song-meta   { font-size: 9pt; color: #555; margin-bottom: 2pt; }
    .song-header { margin-bottom: 12pt; padding-bottom: 7pt; border-bottom: 1pt solid #ccc; }
    .columns     { display: flex; gap: 14pt; flex-wrap: wrap; }
    .column      { flex: 1; min-width: 200px; }
    .section-label { font-weight: bold; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.07em; color: #666; margin: 10pt 0 2pt; text-decoration: underline; }
    .section-label.chorus { color: #1e6e52; }
    .chorus-block { border-left: 2pt solid #1e6e52; padding-left: 6pt; margin: 5pt 0; background: rgba(30, 110, 82, 0.12); }
    .line-chords  { font-family: 'Roboto Mono', monospace; font-size: 9pt; font-weight: bold; color: #0050a0; white-space: pre-wrap; overflow-wrap: break-word; }
    .line-lyrics  { font-size: 10.5pt; white-space: pre-wrap; }
    .line-comment { font-size: 10pt; white-space: pre-wrap; color: #666; background: rgba(0, 0, 0, 0.04); border-left: 2pt solid #bbb; padding: 2pt 6pt; margin: 2pt 0; }
    .line-tab     { font-family: 'Roboto Mono', monospace; font-size: 9.5pt; white-space: pre-wrap; color: #333; background: rgba(0, 80, 160, 0.08); border-radius: 4pt; padding: 3pt 6pt; margin: 2pt 0; }
    .line-lyrics.l2 { color: #1e6e52; font-style: italic; opacity: 0.9; }
    .line-empty   { height: 5pt; }
    .chord        { color: #0050a0; font-weight: bold; }
    .print-block,
    .section-label,
    .chorus-block { break-inside: avoid; page-break-inside: avoid; }
    @page { margin: 15mm 18mm; }
  </style>
</head>
<body>${content}</body>
</html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 350);
    },

    toggleSyncScroll() {
      this.syncScrollActive ? this.stopSyncScroll() : this.startSyncScroll();
    },

    startSyncScroll() {
      const delay    = Number(this.song?.predelay) || 0;
      const duration = Number(this.song?.duration) || 0;
      if (!duration) {
        this.$emit('show-alert', {
          title: this.t.durationMissingTitle,
          message: this.t.durationMissingText
        });
        return;
      }
      const el = this.$refs.content;
      if (!el) return;

      const totalPx = el.scrollHeight - el.clientHeight;
      if (totalPx <= 0) return;

      // Calculate current progress and remaining time
      const currentScroll = el.scrollTop;
      const currentProgress = currentScroll / totalPx;
      const remainingDuration = duration * (1 - currentProgress);

      if (remainingDuration <= 0) {
        // Already at the bottom, reset to top
        el.scrollTop = 0;
        return;
      }

      this.syncScrollActive = true;

      const startScroll = () => {
        const startScrollTop = el.scrollTop;
        const remainingPx = totalPx - startScrollTop;
        const start = performance.now();
        const run = (now) => {
          if (!this.syncScrollActive) return;
          const elapsed = now - start;
          const t = Math.min(elapsed / (remainingDuration * 1000), 1);
          el.scrollTop = startScrollTop + remainingPx * t;
          if (t >= 1) { this.stopSyncScroll(); return; }
          this.syncAnimation = requestAnimationFrame(run);
        };
        this.syncAnimation = requestAnimationFrame(run);
      };

      // If starting from the very beginning, apply delay
      if (currentProgress < 0.01 && delay > 0) {
        this.syncStartTimeout = setTimeout(startScroll, delay * 1000);
      } else {
        startScroll();
      }
    },

    stopSyncScroll() {
      this.syncScrollActive = false;
      clearTimeout(this.syncStartTimeout);
      cancelAnimationFrame(this.syncAnimation);
      this.syncStartTimeout = null;
      this.syncAnimation = null;
    },

    transposeUp()   { this.$emit('update-song', this.transposeSong(1));  },
    transposeDown() { this.$emit('update-song', this.transposeSong(-1)); },
    transposeSong(semitones) {
      if (!this.song?.lyrics) return this.song;
      const notas   = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
      const bemoles = { "Db":"C#","Eb":"D#","Gb":"F#","Ab":"G#","Bb":"A#" };
      const moverNota = (nota) => {
        if (bemoles[nota]) nota = bemoles[nota];
        const base = nota.match(/^[A-G](#|b)?/);
        if (!base) return nota;
        const idx = notas.indexOf(base[0]);
        if (idx === -1) return nota;
        return notas[(idx + semitones + 12) % 12] + nota.slice(base[0].length);
      };
      const lines = this.song.lyrics.split('\n').map(line => {
        if (!line.trim().startsWith('.')) return line;
        return line.replace(/([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus)?\d*)/g, moverNota);
      });
      return {
        ...this.song,
        lyrics: lines.join('\n'),
        key: this.song.key ? moverNota(this.song.key) : this.song.key
      };
    },

    increaseFont() {
      this.fontSize = Math.min(32, this.fontSize + 1);
      localStorage.setItem('previewFontSize', this.fontSize);
    },
    decreaseFont() {
      this.fontSize = Math.max(10, this.fontSize - 1);
      localStorage.setItem('previewFontSize', this.fontSize);
    }
  },

  mounted() {
    this.ensurePreviewFonts();
    window.addEventListener('resize', this.schedulePrintPagination);
    this.schedulePrintPagination();
  },

  watch: {
    selectedPreset(value) {
      localStorage.setItem('previewPreset', value);
      this.schedulePrintPagination();
    },
    fontSize() {
      this.schedulePrintPagination();
    },
    viewMode() {
      this.schedulePrintPagination();
    },
    modo() {
      this.schedulePrintPagination();
    },
    song: {
      deep: true,
      handler() {
        this.schedulePrintPagination();
      }
    }
  },

  beforeUnmount() {
    this.stopSyncScroll();
    cancelAnimationFrame(this.paginationRaf);
    window.removeEventListener('resize', this.schedulePrintPagination);
  }
};
</script>

<style scoped>
.preview-panel {
  position: fixed;
  top: var(--toolbar-h, 48px);
  right: 0;
  bottom: 0;
  width: 0;
  background: var(--bg2, #111);
  border-left: 1px solid var(--border, #222);
  overflow: hidden;
  z-index: 1150;
  transition: width 280ms ease;
  display: flex;
  flex-direction: column;
}
/* width is now controlled via inline panelStyle, so no .preview-panel.open width rule */
.preview-panel.fullscreen { width: 100vw; z-index: 1500; }

/* ── Resize handle ── */
.resize-handle {
  position: absolute;
  top: 0;
  left: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  background: transparent;
  transition: background 0.15s;
}
.resize-handle:hover,
.resize-handle:active {
  background: var(--accent, #3ca88d);
  opacity: 0.5;
}

/* ── Header ── */
.preview-headerbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  height: 40px;
  border-bottom: 1px solid var(--border, #222);
  flex-shrink: 0;
}
.preview-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fg2, #aaa);
  white-space: nowrap;
}
.preview-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}
.preset-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.preset-select {
  appearance: none;
  background: var(--bg3, #2a2a2a);
  color: var(--fg, #fff);
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  padding: 5px 26px 5px 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  min-width: 88px;
}
.preset-select:hover,
.preset-select:focus {
  border-color: var(--accent, #3ca88d);
  outline: none;
}
.preset-select-wrap::after {
  content: '';
  position: absolute;
  right: 10px;
  width: 7px;
  height: 7px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
  color: var(--fg2, #aaa);
  pointer-events: none;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--fg2, #aaa);
  cursor: pointer;
  padding: 5px 6px;
  border-radius: 4px;
  line-height: 1;
  transition: background 0.1s, color 0.1s;
}
.btn-icon:hover  { background: var(--bg3, #2a2a2a); color: var(--fg, #fff); }
.btn-icon.active { color: var(--accent, #3ca88d); }
.sep {
  width: 1px;
  height: 16px;
  background: var(--border, #333);
  margin: 0 3px;
  flex-shrink: 0;
}

/* ── Scroll wrapper — NO horizontal scrollbar ── */
.preview-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
}

/* ── Área de contenido interior — Roboto Mono everywhere ── */
.preview-content {
  padding: 16px 20px;
  line-height: var(--preview-line-height, 1.55);
  min-height: 100%;
  font-family: 'Roboto Mono', monospace;
  /* Prevent content from exceeding panel width */
  max-width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

/* ── Modo teléfono ── */
.sim-phone {
  max-width: 100%;
  margin: 0 auto;
  border: 2px solid var(--border, #555);
  border-radius: 18px;
  padding: 20px 16px;
  min-height: 600px;
}

/* ── Modo tableta ── */
.sim-tablet {
  max-width: 100%;
  margin: 0 auto;
  border: 2px solid var(--border, #555);
  border-radius: 10px;
  padding: 20px 24px;
  min-height: 500px;
}

/* ── Modo impresión A4 ── */
.print-pages {
  padding: 18px 0 36px;
  line-height: var(--preview-line-height, 1.55);
}
.sim-print {
  width: 210mm;
  max-width: calc(100% - 32px);
  margin: 0 auto 24px;
  background: #fff;
  color: #000;
  border: 1px solid #bbb;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  padding: 18mm 20mm;
  height: 297mm;
  font-family: 'Roboto Mono', monospace;
  overflow: hidden;
}
.print-page {
  position: relative;
}
.print-page::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -13px;
  height: 1px;
  background: rgba(0,0,0,0.18);
}
.print-measure-frame {
  position: absolute;
  top: -99999px;
  left: -99999px;
  visibility: hidden;
  pointer-events: none;
  margin: 0;
  overflow: visible;
}
.print-measure-flow {
  width: 100%;
}
.print-measure-item {
  display: block;
}

.empty-state { color: var(--fg2, #888); font-size: 13px; text-align: center; margin-top: 40px; }
</style>

<!-- Unscoped styles for v-html rendered content (scoped styles don't penetrate v-html) -->
<style>
/* ── Cabecera de canción (dentro del preview) ── */
.preview-panel .song-header {
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border, #333);
}
.preview-panel .song-title {
  font-size: 1.25em;
  font-weight: 700;
  margin-bottom: 3px;
  font-family: var(--preview-font-lyrics, 'Roboto Mono', monospace);
}
.preview-panel .song-meta {
  font-size: 0.85em;
  color: var(--fg2, #aaa);
  font-family: var(--preview-font-comments, 'Roboto Mono', monospace);
}

/* ── Letra y acordes ── */
.preview-panel .section-label {
  font-weight: 700;
  text-decoration: underline;
  font-size: var(--preview-size-sections, 0.78em);
  text-transform: uppercase;
  letter-spacing: var(--preview-spacing-sections, 0.06em);
  margin: var(--preview-section-margin, 14px 0 3px);
  color: var(--preview-color-sections, var(--fg2, #aaa));
  font-family: var(--preview-font-sections, 'Roboto Mono', monospace);
}
.preview-panel .section-label.chorus { color: var(--preview-chorus-border, var(--accent, #3ca88d)); }
.preview-panel .chorus-block {
  background: var(--preview-chorus-bg, rgba(255, 255, 255, 0.1));
  border-left: 2px solid var(--preview-chorus-border, var(--accent, #3ca88d));
  padding: var(--preview-chorus-padding, 4px 10px);
  margin: var(--preview-chorus-margin, 6px 0);
  border-radius: 0 4px 4px 0;
}
.preview-panel .line-chords {
  font-family: var(--preview-font-chords, 'Roboto Mono', monospace);
  color: var(--preview-color-chords, var(--chord-color, #4FC3F7));
  font-weight: var(--preview-weight-chords, 700);
  font-size: var(--preview-size-chords, 0.96em);
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-all;
  margin: 0;
  max-width: 100%;
}
.preview-panel .line-lyrics {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  font-family: var(--preview-font-lyrics, 'Roboto Mono', monospace);
  color: var(--preview-color-lyrics, var(--fg, #f0f0f0));
  font-size: var(--preview-size-lyrics, 1em);
  font-weight: var(--preview-weight-lyrics, 400);
  max-width: 100%;
}
.preview-panel .line-comment {
  margin: 2px 0;
  padding: 3px 8px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  color: var(--preview-color-comments, color-mix(in srgb, var(--fg2, #aaa) 92%, var(--fg, #fff) 8%));
  background: var(--preview-comment-bg, rgba(255, 255, 255, 0.04));
  border-left: 2px solid var(--preview-comment-border, rgba(255, 255, 255, 0.12));
  border-radius: 0 6px 6px 0;
  font-family: var(--preview-font-comments, 'Roboto Mono', monospace);
  font-size: var(--preview-size-comments, 0.94em);
  max-width: 100%;
}
.preview-panel .line-tab {
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  color: var(--preview-color-tabs, var(--fg, #f0f0f0));
  background: transparent;
  border: none;
  border-radius: 0;
  font-family: var(--preview-font-tabs, 'Roboto Mono', monospace);
  font-size: var(--preview-size-tabs, 0.96em);
  max-width: 100%;
}
.preview-panel .line-tab .tab-faint {
  opacity: 0.28;
}
.preview-panel .line-lyrics.l2 {
  color: var(--preview-color-lyrics-l2, var(--lyrics-l2, #3ca88d));
  font-style: italic;
  font-weight: 500;
  opacity: 0.9;
}
.preview-panel .line-empty  { height: 0.55em; }
.preview-panel .chord { font-weight: bold; }
.preview-panel .print-column-break { height: 1.2em; }

.preview-panel .columns {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  max-width: 100%;
  overflow: hidden;
}
.preview-panel .column {
  flex: 1;
  min-width: 200px;
  padding-right: 16px;
  border-right: 1px dashed var(--border, #333);
  overflow: hidden;
  max-width: 100%;
}
.preview-panel .column:last-child { border-right: none; padding-right: 0; }

/* ── Print mode overrides ── */
.preview-panel .sim-print .song-title           { color: #000; }
.preview-panel .sim-print .song-meta             { color: #555; }
.preview-panel .sim-print .section-label         { color: #666; }
.preview-panel .sim-print .section-label.chorus  { color: #1e6e52; }
.preview-panel .sim-print .chorus-block          { border-left-color: #1e6e52; background: rgba(30, 110, 82, 0.12); }
.preview-panel .sim-print .print-chorus-label    { background: rgba(30, 110, 82, 0.1); border-left: 2px solid #1e6e52; padding: 4px 8px; margin-bottom: 3px; border-radius: 0 4px 4px 0; }
.preview-panel .sim-print .print-chorus-line     { background: rgba(30, 110, 82, 0.07); padding-left: 8px; border-left: 2px solid #1e6e52; }
.preview-panel .sim-print .line-chords           { color: #0050a0; }
.preview-panel .sim-print .line-comment          { color: #555; background: rgba(0, 0, 0, 0.04); border-left-color: #bbb; }
.preview-panel .sim-print .line-tab              { color: #222; background: transparent; border: none; }
</style>
