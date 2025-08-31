/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { css, html, LitElement, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import './PromptController';
import './PlayPauseButton';
import type { PlaybackState, Prompt, Playlist } from '../types';
import { MidiDispatcher } from '../utils/MidiDispatcher';
import { LiveMusicHelper } from '../utils/LiveMusicHelper';

const CATEGORIES = ['All', 'English', 'Urdu', 'Punjabi', 'Hip Hop'];
const FAKE_SONG_DURATION = 30; // seconds

/** The grid of prompt inputs. */
@customElement('prompt-dj-midi')
export class PromptDjMidi extends LitElement {
  static override styles = css`
    :host {
      height: 100vh;
      width: 100vw;
      display: grid;
      grid-template-areas:
        'sidebar main'
        'player player';
      grid-template-rows: 1fr auto;
      grid-template-columns: 300px 1fr;
      background-color: var(--background-base);
      color: var(--text-base);
      overflow: hidden;
      gap: 8px;
      padding: 8px;
    }

    #sidebar {
      grid-area: sidebar;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sidebar-box {
        background-color: var(--background-highlight);
        border-radius: 8px;
        padding: 8px 12px;
    }

    .nav-links {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .nav-links li a {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 8px;
        color: var(--text-subdued);
        text-decoration: none;
        font-weight: 700;
        font-size: 16px;
        transition: color 0.2s;
        cursor: pointer;
    }
    .nav-links li a:hover,
    .nav-links li a.active {
        color: var(--text-base);
    }
    .nav-links li a svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
    }

    .library-box {
        background-color: var(--background-highlight);
        border-radius: 8px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .library-header {
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .library-header .library-title-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-subdued);
        text-decoration: none;
        font-weight: 700;
        font-size: 16px;
        transition: color 0.2s;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        font-family: inherit;
    }
    .library-header .library-title-btn:hover {
        color: var(--text-base);
    }
    .library-header .library-title-btn svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
    }
    .library-action-btn {
        background: none;
        border: none;
        color: var(--text-subdued);
        cursor: pointer;
        padding: 4px;
    }
    .library-action-btn:hover {
        color: var(--text-base);
    }

    .library-controls {
      padding: 0 16px 8px;
    }

    .search-container {
        position: relative;
        display: flex;
        align-items: center;
    }
    .search-icon {
        position: absolute;
        left: 10px;
        fill: var(--text-subdued);
        pointer-events: none;
    }
    .search-container input {
        background-color: var(--background-press);
        border: 1px solid transparent;
        border-radius: 4px;
        color: var(--text-base);
        font-family: inherit;
        font-size: 14px;
        padding: 8px 8px 8px 32px;
        width: 100%;
        transition: border-color 0.2s;
    }
    .search-container input:focus {
        outline: none;
        border-color: var(--text-base);
    }

    .category-filters {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      overflow-x: auto;
    }
    .category-filters button {
      background-color: var(--background-tinted-highlight);
      color: var(--text-base);
      border: none;
      border-radius: 16px;
      padding: 6px 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
      white-space: nowrap;
    }
    .category-filters button.active {
      background-color: var(--essential-base);
      color: var(--background-base);
    }


    #prompt-list, #playlist-list, #search-results ul {
        list-style: none;
        padding: 0 8px;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow-y: auto;
        flex-grow: 1;
    }
    #search-results ul {
        padding: 0;
    }
    .prompt-item, .playlist-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
        cursor: pointer;
    }
    .prompt-item:hover, .playlist-item:hover {
      background-color: var(--background-tinted-highlight);
    }
    .prompt-item.active-in-mixer {
        color: var(--essential-base);
    }
    .prompt-item.active-in-mixer .prompt-item-title {
        color: var(--essential-base);
    }

    .prompt-item-info, .playlist-item-info {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }
    .prompt-item img, .playlist-item img {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      flex-shrink: 0;
      background-color: var(--background-tinted-highlight);
      object-fit: cover;
    }
    .prompt-item-text, .playlist-item-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .prompt-item-title, .playlist-item-title {
      font-weight: 600;
      color: var(--text-base);
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .prompt-item-artist, .playlist-item-subtitle {
      font-size: 12px;
      color: var(--text-subdued);
    }

    .play-pause-overlay {
        position: relative;
        flex-shrink: 0;
    }
    .play-pause-overlay .overlay-button {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .prompt-item:hover .play-pause-overlay .overlay-button,
    .prompt-item.now-playing .play-pause-overlay .overlay-button {
        opacity: 1;
    }
    .overlay-button svg {
        width: 24px;
        height: 24px;
        fill: #fff;
    }


    #main {
      grid-area: main;
      overflow-y: auto;
      background-color: var(--background-highlight);
      border-radius: 8px;
      position: relative;
      z-index: 0;
    }
    
    #main::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 332px;
        background-image: var(--background-image-url, none);
        background-size: cover;
        background-position: center;
        transition: background-image 0.5s ease-in-out;
        filter: blur(50px);
        opacity: 0.4;
        z-index: -1;
    }

    #main-content {
      padding: 24px;
      background: linear-gradient(rgba(0,0,0,0.6) 0%, var(--background-highlight) 332px);
    }

    #main-header-container {
      padding-top: 64px;
      display: flex;
      gap: 24px;
      align-items: flex-end;
      min-height: 340px;
    }
    
    #main-header-container .playlist-art {
      width: 232px;
      height: 232px;
      flex-shrink: 0;
      background-color: var(--background-tinted-highlight);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 60px rgba(0,0,0,.5);
      background-size: cover;
      background-position: center;
    }

    #main-header-container .playlist-art svg {
        width: 100px;
        height: 100px;
        fill: var(--text-subdued);
    }

    #main-header-container .playlist-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .playlist-details h1 {
      font-size: 96px;
      margin: 0;
      font-weight: 900;
      letter-spacing: -0.04em;
    }
    .playlist-details p {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
    }


    #sticky-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      position: sticky;
      top: 0;
      background-color: transparent;
      transition: background-color 0.3s;
      z-index: 10;
    }
    
    #main.scrolled #sticky-header {
        background-color: var(--background-press-alpha);
        backdrop-filter: blur(10px);
    }

    .nav-buttons button {
        background-color: var(--background-base-alpha);
        border: none;
        border-radius: 50%;
        color: var(--text-base);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .nav-buttons {
        display: flex;
        gap: 8px;
    }
    .nav-buttons button {
        width: 32px;
        height: 32px;
    }
    .nav-buttons button svg {
        fill: var(--text-base);
    }
    .nav-buttons button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }

    .profile-container {
        position: relative;
    }

    .user-profile-btn {
        padding: 2px;
        gap: 8px;
        border-radius: 24px;
        font-size: 14px;
        background-color: var(--background-base-alpha);
        border: none;
        color: var(--text-base);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .user-profile-btn svg {
        fill: var(--text-base);
        background-color: #535353;
        border-radius: 50%;
        width: 28px;
        height: 28px;
    }
    .user-profile-btn span {
        font-weight: 700;
        padding-right: 8px;
    }

    .user-profile-dropdown {
      position: absolute;
      top: 110%;
      right: 0;
      background-color: var(--background-elevated-highlight);
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      padding: 4px;
      min-width: 200px;
      z-index: 100;
    }

    .theme-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
    }
    .theme-toggle:hover {
      background-color: var(--background-tinted-highlight);
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 34px;
      height: 20px;
    }
    .switch input { display:none; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 20px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 12px;
      width: 12px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    input:checked + .slider { background-color: var(--essential-base); }
    input:checked + .slider:before { transform: translateX(14px); }


    #grid {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      justify-content: flex-start;
      padding: 24px 0 0;
    }

    #player-bar {
      grid-area: player;
      background-color: var(--background-base);
      border-top: 1px solid var(--background-highlight);
      display: grid;
      grid-template-areas: 'now-playing player-controls extra-controls';
      grid-template-columns: 1fr 1.5fr 1fr;
      align-items: center;
      padding: 16px;
      gap: 24px;
    }
    
    .now-playing {
      grid-area: now-playing;
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .now-playing img {
      width: 56px;
      height: 56px;
      border-radius: 4px;
      background-color: var(--background-tinted-highlight);
    }
    .now-playing-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .now-playing-title {
      font-weight: 600;
      color: var(--text-base);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .now-playing-artist {
      font-size: 12px;
      color: var(--text-subdued);
    }
    .now-playing-actions {
        display: flex;
        align-items: center;
        margin-left: 16px;
    }
    .now-playing-actions button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }

    .player-controls {
      grid-area: player-controls;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    
    .player-buttons {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .player-buttons button {
      background: none;
      border: none;
      fill: var(--text-subdued);
      cursor: pointer;
      padding: 0;
      transition: fill 0.2s;
    }
    .player-buttons button:hover {
      fill: var(--text-base);
    }
    .player-buttons button.active {
        fill: var(--essential-base);
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      max-width: 600px;
    }
    .progress-bar-time {
      font-size: 12px;
      color: var(--text-subdued);
    }
    .progress-bar {
      flex-grow: 1;
      height: 4px;
      background-color: var(--background-tinted-highlight);
      border-radius: 2px;
      cursor: pointer;
      position: relative;
    }
    .progress-bar-fill {
      height: 100%;
      background-color: var(--text-subdued);
      border-radius: 2px;
      position: relative;
    }
    .progress-bar:hover .progress-bar-fill {
      background-color: var(--essential-base);
    }
    .progress-bar:hover .progress-bar-thumb {
      opacity: 1;
    }
    .progress-bar-thumb {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translate(50%, -50%);
      width: 12px;
      height: 12px;
      background-color: var(--text-base);
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .player-extra-controls {
      grid-area: extra-controls;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
    }
    
    .player-extra-controls button, .player-extra-controls select {
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      color: var(--text-base);
      background-color: transparent;
      border: none;
      border-radius: 500px;
      padding: 4px;
      transition: transform 0.2s, background-color 0.2s;
      -webkit-font-smoothing: antialiased;
      display: flex;
      align-items: center;
    }

    .player-extra-controls button svg {
        fill: var(--text-subdued);
        transition: fill 0.2s;
    }

    .player-extra-controls button:hover svg {
        fill: var(--text-base);
    }
    
    .player-extra-controls button.active, .player-extra-controls button.active svg {
        color: var(--essential-base);
        fill: var(--essential-base);
    }
    
    select {
        background: var(--background-tinted-highlight);
        color: var(--text-base);
        padding: 8px;
        border-radius: 4px;
    }
    
    .volume-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .volume-bar .progress-bar {
        width: 100px;
    }

    #search-view {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    #search-view .search-container {
        max-width: 400px;
    }

    #search-view-input {
      font-size: 24px;
      padding: 12px 12px 12px 48px;
    }

    #search-view .search-icon {
      width: 24px;
      height: 24px;
      left: 12px;
    }
    
    #queue-panel {
      position: fixed;
      top: 8px;
      right: 8px;
      bottom: 97px; /* 8px padding + player bar height */
      width: 350px;
      background-color: var(--background-highlight);
      border-radius: 8px;
      z-index: 1000;
      transform: translateX(105%);
      transition: transform 0.3s ease-in-out;
      display: flex;
      flex-direction: column;
    }
    #queue-panel.open {
      transform: translateX(0);
    }
    #queue-header {
      padding: 16px;
      font-size: 20px;
      font-weight: 700;
      border-bottom: 1px solid var(--background-press);
    }
    #queue-list {
      flex-grow: 1;
      overflow-y: auto;
      padding: 8px;
    }
    #queue-list h3 {
      font-size: 16px;
      padding: 8px;
      margin: 0;
      color: var(--text-subdued);
    }
  `;

  private allPrompts: Map<string, Prompt>;
  private midiDispatcher: MidiDispatcher;
  private liveMusicHelper: LiveMusicHelper;

  @state() private activePromptIds = new Set<string>();
  @state() private showMidi = false;
  @property({ type: String }) public playbackState: PlaybackState = 'stopped';
  @state() public audioLevel = 0;
  @state() private midiInputIds: string[] = [];
  @state() private activeMidiInputId: string | null = null;
  @state() private searchTerm = '';
  @state() private selectedCategory = 'All';
  
  @state() private playlists = new Map<string, Playlist>();
  @state() private currentView: 'mixer' | 'search' = 'mixer';
  @state() private isProfileMenuOpen = false;
  @state() private searchResults: Prompt[] = [];
  @state() private nowPlayingPromptId: string | null = null;
  @state() private volume = 1;
  
  @state() private isShuffleActive = false;
  @state() private isRepeatActive = false;
  @state() private isLiked = false;
  
  @state() private songProgress = 0;
  @state() private songCurrentTime = '0:00';
  private animationFrameId: number | null = null;
  
  @state() private activeContext: Playlist | null = null;
  @state() private isQueueOpen = false;

  private mainEl: HTMLElement | null = null;

  @property({ type: Object })
  private filteredPrompts = new Set<string>();

  constructor(
    initialPrompts: Map<string, Prompt>,
    liveMusicHelper: LiveMusicHelper
  ) {
    super();
    this.allPrompts = initialPrompts;
    this.liveMusicHelper = liveMusicHelper;
    this.midiDispatcher = new MidiDispatcher();

    // Initialize active prompts from initial weights
    for (const [id, prompt] of this.allPrompts.entries()) {
        if (prompt.weight > 0) {
            this.activePromptIds.add(id);
            if (!this.nowPlayingPromptId) {
              this.nowPlayingPromptId = id;
            }
        }
    }
  }

  override firstUpdated() {
    this.mainEl = this.shadowRoot?.querySelector('#main') ?? null;
    this.mainEl?.addEventListener('scroll', this.handleMainScroll);
    this.updateDynamicBackground();
  }

  override connectedCallback() {
      super.connectedCallback();
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
      }
      document.addEventListener('click', this.handleGlobalClick);
  }

  override disconnectedCallback() {
      super.disconnectedCallback();
      document.removeEventListener('click', this.handleGlobalClick);
      this.mainEl?.removeEventListener('scroll', this.handleMainScroll);
      this.stopProgressLoop();
  }
  
  override updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('playbackState')) {
        if (this.playbackState === 'playing') {
            this.startProgressLoop();
        } else {
            this.stopProgressLoop();
        }
    }
  }

  private handleMainScroll = () => {
    this.mainEl?.classList.toggle('scrolled', this.mainEl.scrollTop > 10);
  }

  private handleGlobalClick = (e: MouseEvent) => {
    if (this.isProfileMenuOpen) {
        const profileContainer = this.shadowRoot?.querySelector('.profile-container');
        if (profileContainer && !e.composedPath().includes(profileContainer)) {
            this.isProfileMenuOpen = false;
        }
    }
  }

  private handlePromptChanged(e: CustomEvent<Prompt>) {
    const changedPrompt = e.detail;
    const prompt = this.allPrompts.get(changedPrompt.promptId);

    if (!prompt) {
      console.error('prompt not found', changedPrompt.promptId);
      return;
    }

    prompt.text = changedPrompt.text;
    prompt.weight = changedPrompt.weight;
    prompt.cc = changedPrompt.cc;

    this.allPrompts.set(changedPrompt.promptId, prompt);
    this.requestUpdate();
    this.dispatchPromptsChanged();
  }
  
  private handlePromptRemoved(e: CustomEvent<{promptId: string}>) {
    const { promptId } = e.detail;
    if (this.activePromptIds.has(promptId)) {
      const prompt = this.allPrompts.get(promptId);
      if (prompt) {
        prompt.weight = 0;
        this.allPrompts.set(promptId, prompt);
      }
      
      this.activePromptIds.delete(promptId);
      if (this.nowPlayingPromptId === promptId) {
        this.nowPlayingPromptId = this.activePromptIds.values().next().value || null;
      }

      this.requestUpdate();
      this.dispatchPromptsChanged();
    }
  }

  private dispatchPromptsChanged() {
    this.dispatchEvent(
      new CustomEvent('prompts-changed', { detail: new Map(this.allPrompts) }),
    );
  }

  private dispatchVolumeChanged() {
    this.dispatchEvent(
      new CustomEvent('volume-changed', { detail: this.volume })
    )
  }

  private toggleShowMidi() {
    return this.setShowMidi(!this.showMidi);
  }

  public async setShowMidi(show: boolean) {
    this.showMidi = show;
    if (!this.showMidi) return;
    try {
      const inputIds = await this.midiDispatcher.getMidiAccess();
      this.midiInputIds = inputIds;
      this.activeMidiInputId = this.midiDispatcher.activeMidiInputId;
    } catch (e: any) {
      this.dispatchEvent(new CustomEvent('error', {detail: e.message}));
    }
  }

  private handleMidiInputChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newMidiId = selectElement.value;
    this.activeMidiInputId = newMidiId;
    this.midiDispatcher.activeMidiInputId = newMidiId;
  }

  private playPause() {
    this.dispatchEvent(new CustomEvent('play-pause'));
  }

  public addFilteredPrompt(prompt: string) {
    this.filteredPrompts = new Set([...this.filteredPrompts, prompt]);
  }

  private handleSidebarSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
  }

  private addPromptToMixer(promptId: string) {
    if (this.activePromptIds.has(promptId)) return;
    this.activePromptIds = new Set([...this.activePromptIds, promptId]);
    
    const prompt = this.allPrompts.get(promptId);
    if(prompt && prompt.weight === 0) {
      prompt.weight = 1; // Default weight when adding
      this.allPrompts.set(promptId, prompt);
    }
    if (!this.nowPlayingPromptId) {
      this.nowPlayingPromptId = promptId;
      this.updateDynamicBackground();
    }
    this.dispatchPromptsChanged();
  }

  private toggleSongPlayback(promptId: string) {
      if (this.nowPlayingPromptId === promptId && this.playbackState === 'playing') {
          this.playPause();
      } else {
          this.playSong(promptId);
      }
  }

  private playSong(promptId: string) {
    for (const id of this.activePromptIds) {
      const p = this.allPrompts.get(id);
      if (p) p.weight = 0;
    }
    this.activePromptIds.clear();

    const prompt = this.allPrompts.get(promptId);
    if (prompt) {
      prompt.weight = 2;
      this.allPrompts.set(promptId, prompt);
      this.activePromptIds = new Set([promptId]);
      this.nowPlayingPromptId = promptId;
      this.activeContext = null; // A single song is not a playlist context
      this.dispatchPromptsChanged();
      this.updateDynamicBackground();
    }
    
    if (this.playbackState !== 'playing' && this.playbackState !== 'loading') {
        this.playPause();
    }
    this.setCurrentView('mixer');
  }

  private handleVolumeChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.volume = parseFloat(input.value);
    this.dispatchVolumeChanged();
    this.requestUpdate();
  }

  private updateDynamicBackground() {
    let imageUrl = '';
    if (this.activeContext) {
        imageUrl = this.activeContext.imageUrl;
    } else {
        const prompt = this.nowPlayingPromptId ? this.allPrompts.get(this.nowPlayingPromptId) : null;
        if (prompt) imageUrl = prompt.imageUrl;
    }
    const finalImageUrl = imageUrl ? `url(${imageUrl.replace('/64', '/512')})` : 'none';
    this.mainEl?.style.setProperty('--background-image-url', finalImageUrl);
  }

  private getPlaylistArt(): string {
    if (this.activePromptIds.size > 0) {
        const firstPromptId = this.activePromptIds.values().next().value;
        const firstPrompt = this.allPrompts.get(firstPromptId);
        return firstPrompt?.imageUrl || '';
    }
    return '';
  }

  private createPlaylist() {
    const playlistName = prompt('Enter playlist name:', `My Playlist #${this.playlists.size + 1}`);
    if (playlistName) {
        const id = `playlist-${Date.now()}`;
        const imageUrl = this.getPlaylistArt();
        this.playlists.set(id, { id, name: playlistName, promptIds: new Set(), imageUrl, description: 'Your description' });
        this.requestUpdate();
    }
  }

  private saveMixerAsPlaylist() {
    const playlistName = prompt('Save mixer as playlist:', `My Awesome Mix`);
     if (playlistName) {
        const id = `playlist-${Date.now()}`;
        const imageUrl = this.getPlaylistArt();
        const newPlaylist = { 
            id, 
            name: playlistName, 
            promptIds: new Set(this.activePromptIds), 
            imageUrl, 
            description: `${this.activePromptIds.size} songs` 
        };
        this.playlists.set(id, newPlaylist);
        this.requestUpdate();
    }
  }

  private loadPlaylist(playlistId: string) {
    const playlist = this.playlists.get(playlistId);
    if (playlist) {
      for (const id of this.activePromptIds) {
        const p = this.allPrompts.get(id);
        if (p) p.weight = 0;
      }
      this.activePromptIds.clear();
      this.nowPlayingPromptId = null;

      for (const promptId of playlist.promptIds) {
        const p = this.allPrompts.get(promptId);
        if (p) {
          p.weight = 1;
          this.activePromptIds.add(promptId);
          if (!this.nowPlayingPromptId) {
            this.nowPlayingPromptId = promptId;
          }
        }
      }
      this.activeContext = playlist;
      this.requestUpdate();
      this.dispatchPromptsChanged();
      this.updateDynamicBackground();
    }
  }

  private setCurrentView(view: 'mixer' | 'search') {
    this.currentView = view;
  }

  private toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.requestUpdate();
  }

  private handleMainSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    const term = input.value.toLowerCase();
    if (term.length > 1) {
        this.searchResults = [...this.allPrompts.values()].filter(p => 
            p.text.toLowerCase().includes(term) || p.artist.toLowerCase().includes(term)
        );
    } else {
        this.searchResults = [];
    }
  }
  
  private startProgressLoop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    const startTime = performance.now();

    const loop = (currentTime: number) => {
        const elapsedTime = (currentTime - startTime) / 1000;
        const progress = (elapsedTime % FAKE_SONG_DURATION) / FAKE_SONG_DURATION;
        this.songProgress = progress;

        const currentSeconds = Math.floor(elapsedTime % FAKE_SONG_DURATION);
        const minutes = Math.floor(currentSeconds / 60);
        const seconds = currentSeconds % 60;
        this.songCurrentTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopProgressLoop() {
      if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
      }
      this.songProgress = 0;
      this.songCurrentTime = '0:00';
  }

  override render() {
    const libraryPrompts = [...this.allPrompts.values()].filter(p => {
        const matchesCategory = this.selectedCategory === 'All' || p.category === this.selectedCategory;
        const matchesSearch = p.text.toLowerCase().includes(this.searchTerm) || p.artist.toLowerCase().includes(this.searchTerm);
        return matchesCategory && matchesSearch;
    });

    return html`
      <div id="sidebar">
        <div class="sidebar-box">
            <ul class="nav-links">
                <li><a @click=${() => this.setCurrentView('mixer')} class=${classMap({active: this.currentView === 'mixer'})}>${svg`<svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1-1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"></path></svg>`}<span>Home</span></a></li>
                <li><a @click=${() => this.setCurrentView('search')} class=${classMap({active: this.currentView === 'search'})}>${svg`<svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24"><path d="M10.533 1.279a1 1 0 0 0-1.066 0L3 5.795a1 1 0 0 0-.533.882V17.38a1 1 0 0 0 .533.882l6.467 4.516a1 1 0 0 0 1.066 0l6.467-4.516a1 1 0 0 0 .533-.882V5.795a1 1 0 0 0-.533-.882l-6.467-4.516zM4 6.362l6-4.202 6 4.202v10.47l-6 4.201-6-4.201V6.362z"></path><path d="M10.134 12.51a1 1 0 0 0-1.134 1.604l2.48 1.735a1 1 0 0 0 1.133-1.604l-2.48-1.735z"></path>`}<span>Search</span></a></li>
            </ul>
        </div>
        <div class="library-box">
            <div class="library-header">
                <button class="library-title-btn">
                    ${svg`<svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" class="Svg-sc-ytk21e-0 uPxdw"><path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1.5.866l8-9a1 1 0 0 0 0-1.732l-8-9z"></path></svg>`}
                    <span>Your Library</span>
                </button>
                <button class="library-action-btn" @click=${this.createPlaylist} title="Create playlist">${svg`<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M14 7H9V2H7v5H2v2h5v5h2V9h5z"></path></svg>`}</button>
            </div>
            <div class="library-controls">
                <div class="search-container">
                    <input type="text" placeholder="Search in your library" @input=${this.handleSidebarSearch} .value=${this.searchTerm}>
                    ${svg`<svg class="search-icon" viewBox="0 0 16 16" height="16" width="16"><path d="M7.153 1.127a6.027 6.027 0 1 0 0 12.054 6.027 6.027 0 0 0 0-12.054zM.5 7.153a6.653 6.653 0 1 1 11.757 4.342l2.623 2.623a.85.85 0 0 1-1.202 1.202l-2.623-2.623A6.653 6.653 0 0 1 .5 7.153z"></path></svg>`}
                </div>
            </div>
            <div class="category-filters">
              ${CATEGORIES.map(
                (c) => html`<button
                  class=${classMap({ active: this.selectedCategory === c })}
                  @click=${() => { this.selectedCategory = c; }}
                >${c}</button>`
              )}
            </div>
            <ul id="playlist-list">
             ${[...this.playlists.values()].map(pl => this.renderPlaylistItem(pl))}
            </ul>
            <ul id="prompt-list">
              ${libraryPrompts.map(p => this.renderPromptItem(p))}
            </ul>
        </div>
      </div>
      <main id="main" @prompt-removed=${this.handlePromptRemoved}>
        ${this.renderMainContent()}
      </main>
      ${this.renderQueueView()}
      <footer id="player-bar">
        <div class="now-playing">${this.renderNowPlaying()}</div>
        <div class="player-controls">
            <div class="player-buttons">
                <button aria-label="Shuffle" @click=${() => this.isShuffleActive = !this.isShuffleActive} class=${classMap({active: this.isShuffleActive})}>${svg`<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.1 3.045H11.5a2.75 2.75 0 0 0-2.75 2.75v3.155a4.25 4.25 0 0 0-1.022-.105A3.75 3.75 0 0 0 4 12.593V4.75a.75.75 0 0 0-1.5 0v8.513a.75.75 0 1 0 1.5 0v-.326a2.25 2.25 0 0 1 2.228-2.245 2.25 2.25 0 0 1 1.022.252V6.045a1.25 1.25 0 0 1 1.25-1.25H13.1l-1.01 1.01a.75.75 0 1 0 1.06 1.06L14.718 5.3a.75.75 0 0 0 0-1.06L13.15.922zM2.5 12.083a.75.75 0 1 0-1.5 0v.74a2.25 2.25 0 0 1 4.478.336.75.75 0 0 0 1.498-.072A3.75 3.75 0 0 0 1 12.823v-.74z"></path></svg>`}</button>
                <button aria-label="Previous">${svg`<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 8.15V13.3a.7.7 0 0 1-1.4 0V1.7a.7.7 0 0 1 .7-.7z"></path></svg>`}</button>
                <play-pause-button
                  .playbackState=${this.playbackState}
                  @click=${this.playPause}
                ></play-pause-button>
                <button aria-label="Next">${svg`<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 8.15V13.3a.7.7 0 0 0 1.4 0V1.7a.7.7 0 0 0-.7-.7z"></path></svg>`}</button>
                <button aria-label="Repeat" @click=${() => this.isRepeatActive = !this.isRepeatActive} class=${classMap({active: this.isRepeatActive})}>${svg`<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg>`}</button>
            </div>
            <div class="progress-bar-container">
                <span class="progress-bar-time">${this.songCurrentTime}</span>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${this.songProgress * 100}%">
                        <div class="progress-bar-thumb"></div>
                    </div>
                </div>
                <span class="progress-bar-time">${Math.floor(FAKE_SONG_DURATION / 60)}:${(FAKE_SONG_DURATION % 60).toString().padStart(2, '0')}</span>
            </div>
        </div>
        <div class="player-extra-controls">
           <button aria-label="Now Playing Queue" @click=${() => this.isQueueOpen = !this.isQueueOpen} class=${classMap({active: this.isQueueOpen})}>
            ${svg`<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 0 1 3.5 1h9A2.5 2.5 0 0 1 15 3.5v1.5H1V3.5z"></path></svg>`}
           </button>
          <button
            aria-label="Toggle MIDI Controls"
            @click=${this.toggleShowMidi}
            class=${this.showMidi ? 'active' : ''}
          >
           ${svg`<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H3z"></path><path d="M3 8.5a.5.5 0 0 1 .5-.5h1.25a.75.75 0 0 1 0 1.5H4v-1h-.5zm3.75-1.5h.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-.5a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zM9 8.5a.5.5 0 0 1 .5-.5h1.25a.75.75 0 0 1 0 1.5H10v-1h-.5zm3.75-1.5h.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-.5a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zM3.5 4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V5h-.5a.5.5 0 0 1 0-1H4zM9.5 4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V5h-.5a.5.5 0 0 1 0-1H10z"></path></svg>`}
          </button>
          <select
            @change=${this.handleMidiInputChange}
            .value=${this.activeMidiInputId || ''}
            style=${this.showMidi ? '' : 'display: none'}
          >
            ${
              this.midiInputIds.length > 0
                ? this.midiInputIds.map(
                    (id) =>
                      html`<option value=${id}>
                        ${this.midiDispatcher.getDeviceName(id)}
                      </option>`,
                  )
                : html`<option value="">No devices found</option>`
            }
          </select>
          <div class="volume-bar">
            <button aria-label="Volume">${svg`<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.142 2.142 0 0 0-.781 2.927 2.14 2.14 0 0 0 .781.781l6.925 4V1.5z"></path></svg>`}</button>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${this.volume * 100}%">
                    <div class="progress-bar-thumb"></div>
                </div>
                <input type="range" min="0" max="1" step="0.01" .value=${this.volume} @input=${this.handleVolumeChange} style="position:absolute; top:0; left:0; width: 100%; height: 100%; opacity: 0; cursor: pointer;"/>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  private renderMainContent() {
    const isDarkMode = (document.body.getAttribute('data-theme') || 'dark') === 'dark';
    return html`
    <header id="sticky-header">
        <div class="nav-buttons">
            <button aria-label="Go back" disabled>
                ${svg`<svg viewBox="0 0 16 16" height="16" width="16"><path d="M11.03.47a.75.75 0 0 1 0 1.06L4.56 8l6.47 6.47a.75.75 0 1 1-1.06 1.06L2.44 8 9.97.47a.75.75 0 0 1 1.06 0z"></path></svg>`}
            </button>
            <button aria-label="Go forward" disabled>
                ${svg`<svg viewBox="0 0 16 16" height="16" width="16"><path d="M4.97.47a.75.75 0 0 0 0 1.06L11.44 8l-6.47 6.47a.75.75 0 1 0 1.06 1.06L13.56 8 6.03.47a.75.75 0 0 0-1.06 0z"></path></svg>`}
            </button>
        </div>
        <div class="profile-container">
            <button class="user-profile-btn" @click=${() => { this.isProfileMenuOpen = !this.isProfileMenuOpen; }}>
                ${svg`<svg viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-1.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"></path><path d="M8 9.5A5.5 5.5 0 0 0 2.5 15h11A5.5 5.5 0 0 0 8 9.5Zm-4.002 4A4.002 4.002 0 0 1 8 11a4.002 4.002 0 0 1 4.002 2.5h-8.004Z"></path></svg>`}
                <span>Profile</span>
            </button>
            ${this.isProfileMenuOpen ? html`
                <div class="user-profile-dropdown">
                    <label class="theme-toggle" for="theme-toggle-input">
                        <span>${isDarkMode ? 'Dark' : 'Light'} Mode</span>
                        <div class="switch">
                            <input type="checkbox" id="theme-toggle-input" .checked=${!isDarkMode} @change=${this.toggleTheme}>
                            <span class="slider"></span>
                        </div>
                    </label>
                </div>
            ` : ''}
        </div>
    </header>
    ${this.currentView === 'search' ? this.renderSearchView() : this.renderMixerView()}
    `;
  }

  private renderNowPlaying() {
    if (!this.nowPlayingPromptId) return '';
    const prompt = this.allPrompts.get(this.nowPlayingPromptId);
    if (!prompt) return '';

    return html`
      <img src=${prompt.imageUrl.replace('/64', '/128')} alt=${prompt.text}>
      <div class="now-playing-details">
        <span class="now-playing-title">${prompt.text}</span>
        <span class="now-playing-artist">${prompt.artist}</span>
      </div>
      <div class="now-playing-actions">
          <button @click=${() => this.isLiked = !this.isLiked} title="Save to Your Library">
            ${this.isLiked 
                ? svg`<svg height="16" width="16" viewBox="0 0 16 16" style="fill: var(--essential-base);"><path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.313 4.313 0 0 0-3.632 1.69.127.127 0 0 1-.176 0A4.313 4.313 0 0 0 4.75.814a4.313 4.313 0 0 0-3.532 3.406c-.004.086-.008.172-.012.258a4.313 4.313 0 0 0 .62 2.872l6.545 6.545a.75.75 0 0 0 1.06 0l6.545-6.545a4.313 4.313 0 0 0 .62-2.872c-.004-.086-.008-.172-.012-.258z"></path></svg>` 
                : svg`<svg height="16" width="16" viewBox="0 0 16 16" style="fill: var(--text-subdued);"><path d="M1.69 2.023a4.313 4.313 0 0 1 6.185-1.115.126.126 0 0 0 .176 0 4.313 4.313 0 0 1 6.185 1.115 4.313 4.313 0 0 1-1.115 6.185L8 14.309 2.805 9.122a4.313 4.313 0 0 1-1.115-6.185zM8 15.366l7.14-7.14a5.813 5.813 0 0 0-8.22-8.22.126.126 0 0 0-.176 0 5.813 5.813 0 0 0-8.22 8.22L8 15.366z"></path></svg>`
            }
          </button>
      </div>
    `;
  }

   private renderPlaylistItem(pl: Playlist) {
    return html`<li class="playlist-item" @click=${() => this.loadPlaylist(pl.id)}>
      <div class="playlist-item-info">
        <img src=${pl.imageUrl || 'https://picsum.photos/seed/playlist/64'} alt=${pl.name}>
        <div class="playlist-item-text">
          <span class="playlist-item-title">${pl.name}</span>
          <span class="playlist-item-subtitle">Playlist</span>
        </div>
      </div>
    </li>`;
  }

  private renderPromptItem(p: Prompt, isQueueItem = false) {
    const isNowPlaying = p.promptId === this.nowPlayingPromptId;
    const isPlaying = isNowPlaying && this.playbackState === 'playing';

    return html`<li 
      class="prompt-item ${isNowPlaying ? 'now-playing' : ''} ${this.activePromptIds.has(p.promptId) ? 'active-in-mixer' : ''}"
      @click=${() => isQueueItem ? {} : this.toggleSongPlayback(p.promptId)}>
      <div class="prompt-item-info">
        <div class="play-pause-overlay">
          <img src=${p.imageUrl} alt=${p.text}>
          ${!isQueueItem ? html`
            <button class="overlay-button" @click=${(e:Event) => {e.stopPropagation(); this.toggleSongPlayback(p.promptId)}}>
              ${isPlaying 
                ? svg`<svg height="24" width="24" viewBox="0 0 24 24"><path d="M5.7 3a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7H5.7zm10 0a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7h-2.6z"></path></svg>`
                : svg`<svg height="24" width="24" viewBox="0 0 24 24"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path></svg>`
              }
            </button>
          ` : ''}
        </div>
        <div class="prompt-item-text">
          <span class="prompt-item-title">${p.text}</span>
          <span class="prompt-item-artist">${p.artist}</span>
        </div>
      </div>
      ${!isQueueItem && !this.activePromptIds.has(p.promptId) ? html`<button class="add-prompt-btn" @click=${(e: Event) => {e.stopPropagation(); this.addPromptToMixer(p.promptId)}} title="Add to mixer">+</button>` : ''}
    </li>`;
  }

  private renderMixerView() {
    const headerContext = this.activeContext;
    const nowPlayingPrompt = this.nowPlayingPromptId ? this.allPrompts.get(this.nowPlayingPromptId) : null;
    
    let headerImageUrl, headerTitle, headerSubtitle, headerType;
    if (headerContext) {
      headerImageUrl = headerContext.imageUrl?.replace('/64', '/256');
      headerTitle = headerContext.name;
      headerSubtitle = headerContext.description;
      headerType = 'Playlist';
    } else if (nowPlayingPrompt) {
      headerImageUrl = nowPlayingPrompt.imageUrl.replace('/64', '/256');
      headerTitle = nowPlayingPrompt.text;
      headerSubtitle = nowPlayingPrompt.artist;
      headerType = 'Real-time Generated Music';
    } else {
      headerTitle = 'Music Mixer';
      headerSubtitle = 'Create your unique soundscape';
      headerType = 'Home';
    }

    return html`
        <div id="main-content">
            <div id="main-header-container">
                <div class="playlist-art" style="background-image: url(${headerImageUrl || ''})">
                    ${!headerImageUrl ? svg`<svg role="img" height="64" width="64" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h15v15.167a3.5 3.5 0 1 1-3.5-3.5H19V5H8v13.167a3.5 3.5 0 1 1-3.5-3.5H6V3zm0 13.667H4.5a1.5 1.5 0 1 0 1.5 1.5v-1.5zm13 0h-1.5a1.5 1.5 0 1 0 1.5 1.5v-1.5z"></path></svg>` : ''}
                </div>
                <div class="playlist-details">
                    <p>${headerType}</p>
                    <h1>${headerTitle}</h1>
                    <p>${headerSubtitle}</p>
                </div>
            </div>
            <div id="grid">
                ${this.renderPrompts()}
            </div>
        </div>
    `;
  }

  private renderSearchView() {
    return html`
      <div id="search-view">
        <div class="search-container">
            <input id="search-view-input" type="text" placeholder="What do you want to listen to?" @input=${this.handleMainSearch}>
            ${svg`<svg class="search-icon" viewBox="0 0 24 24" height="24" width="24"><path d="M10.533 1.279a1 1 0 0 0-1.066 0L3 5.795a1 1 0 0 0-.533.882V17.38a1 1 0 0 0 .533.882l6.467 4.516a1 1 0 0 0 1.066 0l6.467-4.516a1 1 0 0 0 .533-.882V5.795a1 1 0 0 0-.533-.882l-6.467-4.516zM4 6.362l6-4.202 6 4.202v10.47l-6 4.201-6-4.201V6.362z"></path><path d="M10.134 12.51a1 1 0 0 0-1.134 1.604l2.48 1.735a1 1 0 0 0 1.133-1.604l-2.48-1.735z"></path></svg>`}
        </div>
        <div id="search-results">
            <ul>
              ${this.searchResults.map(p => this.renderPromptItem(p))}
            </ul>
        </div>
      </div>
    `;
  }

  private renderQueueView() {
    if (!this.nowPlayingPromptId) return '';
    const nowPlayingPrompt = this.allPrompts.get(this.nowPlayingPromptId);
    if (!nowPlayingPrompt) return '';
    
    const nextUpPrompts = [...this.activePromptIds]
        .filter(id => id !== this.nowPlayingPromptId)
        .map(id => this.allPrompts.get(id))
        .filter(p => p !== undefined) as Prompt[];

    return html`
      <div id="queue-panel" class=${classMap({ open: this.isQueueOpen })}>
        <div id="queue-header">Queue</div>
        <div id="queue-list">
            <h3>Now Playing</h3>
            ${this.renderPromptItem(nowPlayingPrompt, true)}
            ${nextUpPrompts.length > 0 ? html`<h3>Next Up</h3>` : ''}
            ${nextUpPrompts.map(p => this.renderPromptItem(p, true))}
        </div>
      </div>
    `;
  }

  private renderPrompts() {
    return [...this.activePromptIds].map(id => {
      const prompt = this.allPrompts.get(id);
      if (!prompt) return;
      return html`<prompt-controller
        promptId=${prompt.promptId}
        ?filtered=${this.filteredPrompts.has(prompt.text)}
        cc=${prompt.cc}
        text=${prompt.text}
        weight=${prompt.weight}
        color=${prompt.color}
        category=${prompt.category}
        artist=${prompt.artist}
        imageUrl=${prompt.imageUrl}
        .midiDispatcher=${this.midiDispatcher}
        .showCC=${this.showMidi}
        @prompt-changed=${this.handlePromptChanged}>
      </prompt-controller>`;
    });
  }
}