/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { css, html, LitElement, svg } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { MidiDispatcher } from '../utils/MidiDispatcher';
import type { Prompt, ControlChange } from '../types';

/** A single prompt input associated with a MIDI CC. */
@customElement('prompt-controller')
export class PromptController extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: var(--spotify-gray, #191919);
      border-radius: 8px;
      padding: 16px;
      gap: 12px;
      width: 120px;
      user-select: none;
      transition: background-color 0.3s;
      position: relative;
    }
    :host(:hover) {
      background-color: var(--spotify-light-gray, #282828);
    }
    .prompt {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    #text {
      font-weight: 500;
      font-size: 14px;
      width: 100%;
      padding: 0.1em 0.3em;
      border-radius: 4px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      border: none;
      outline: none;
      background: transparent;
      color: var(--spotify-text, #fff);
    }
    #text:not(:focus) {
      text-overflow: ellipsis;
    }
    #text:focus {
      background: #000;
      white-space: normal;
    }
    .slider-container {
      width: 12px;
      height: 120px;
      background-color: var(--spotify-light-gray, #282828);
      border-radius: 6px;
      position: relative;
      cursor: grabbing;
      display: flex;
      align-items: flex-end;
    }
    .slider-track {
      position: absolute;
      bottom: 0;
      width: 100%;
      background-color: var(--color-prop, #fff);
      border-radius: 6px;
      transition: height 0.1s;
    }
    #midi {
      font-family: monospace;
      text-align: center;
      font-size: 12px;
      border: 1px solid var(--spotify-text-subtle, #b3b3b3);
      border-radius: 4px;
      padding: 2px 5px;
      color: var(--spotify-text-subtle, #b3b3b3);
      background: transparent;
      cursor: pointer;
      visibility: hidden;
    }
    .learn-mode #midi {
        color: orange;
        border-color: orange;
    }
    .show-cc #midi {
        visibility: visible;
    }
    :host([filtered]) {
      opacity: 0.6;
    }
    :host([filtered]) #text {
        text-decoration: line-through;
        color: var(--spotify-text-subtle, #b3b3b3);
    }
    :host([filtered]) .slider-track {
      background-color: var(--spotify-text-subtle, #b3b3b3) !important;
    }

    .remove-button {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      background-color: rgba(0,0,0,0.5);
      border-radius: 50%;
      border: none;
      color: var(--spotify-text-subtle);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }
    :host(:hover) .remove-button {
      opacity: 1;
    }
    .remove-button:hover {
      color: var(--spotify-text);
      background-color: rgba(0,0,0,0.8);
    }
    .remove-button svg {
      width: 12px;
      height: 12px;
      stroke: currentColor;
      stroke-width: 2;
    }
  `;

  @property({ type: String }) promptId = '';
  @property({ type: String }) text = '';
  @property({ type: Number }) weight = 0;
  @property({ type: String }) color = '';
  @property({ type: Boolean, reflect: true }) filtered = false;
  // FIX: Add properties to hold readonly Prompt data.
  @property({ type: String }) category = '';
  @property({ type: String }) artist = '';
  @property({ type: String }) imageUrl = '';

  @property({ type: Number }) cc = 0;
  @property({ type: Number }) channel = 0; // Not currently used

  @property({ type: Boolean }) learnMode = false;
  @property({ type: Boolean }) showCC = false;

  @query('.slider-container') private sliderContainer!: HTMLDivElement;
  @query('#text') private textInput!: HTMLInputElement;

  @property({ type: Object })
  midiDispatcher: MidiDispatcher | null = null;

  @property({ type: Number }) audioLevel = 0;

  private lastValidText!: string;

  override connectedCallback() {
    super.connectedCallback();
    this.midiDispatcher?.addEventListener('cc-message', (e: Event) => {
      const customEvent = e as CustomEvent<ControlChange>;
      const { channel, cc, value } = customEvent.detail;
      if (this.learnMode) {
        this.cc = cc;
        this.channel = channel;
        this.learnMode = false;
        this.dispatchPromptChange();
      } else if (cc === this.cc) {
        this.weight = (value / 127) * 2;
        this.dispatchPromptChange();
      }
    });
  }

  override firstUpdated() {
    this.textInput.setAttribute('contenteditable', 'plaintext-only');
    this.textInput.textContent = this.text;
    this.lastValidText = this.text;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('showCC') && !this.showCC) {
      this.learnMode = false;
    }
    if (changedProperties.has('text') && this.textInput) {
      this.textInput.textContent = this.text;
    }
    super.update(changedProperties);
  }

  private dispatchPromptChange() {
    this.dispatchEvent(
      new CustomEvent<Prompt>('prompt-changed', {
        detail: {
          promptId: this.promptId,
          text: this.text,
          weight: this.weight,
          cc: this.cc,
          color: this.color,
          // FIX: The detail object must conform to the Prompt type.
          category: this.category,
          artist: this.artist,
          imageUrl: this.imageUrl,
        },
      }),
    );
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.textInput.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      this.resetText();
      this.textInput.blur();
    }
  }

  private resetText() {
    this.text = this.lastValidText;
    this.textInput.textContent = this.lastValidText;
  }

  private async updateText() {
    const newText = this.textInput.textContent?.trim();
    if (!newText) {
      this.resetText();
    } else {
      this.text = newText;
      this.lastValidText = newText;
    }
    this.dispatchPromptChange();
    this.textInput.scrollLeft = 0;
  }

  private onFocus() {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(this.textInput);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private handlePointerDown(e: PointerEvent) {
    e.preventDefault();
    this.updateSliderFromEvent(e);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    document.body.classList.add('dragging');
  }

  private handlePointerMove = (e: PointerEvent) => {
    this.updateSliderFromEvent(e);
  };

  private handlePointerUp = () => {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    document.body.classList.remove('dragging');
  };

  private updateSliderFromEvent(e: PointerEvent) {
    const rect = this.sliderContainer.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let percentage = 1 - (y / rect.height);
    percentage = Math.max(0, Math.min(1, percentage));
    this.weight = percentage * 2; // Maps 0-1 to 0-2 range
    this.dispatchPromptChange();
  }

  private toggleLearnMode() {
    this.learnMode = !this.learnMode;
  }

  private removePrompt() {
    this.dispatchEvent(
      new CustomEvent('prompt-removed', {
        detail: { promptId: this.promptId },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const containerClasses = classMap({
      'learn-mode': this.learnMode,
      'show-cc': this.showCC,
    });
    
    const trackHeight = (this.weight / 2) * 100;
    const trackStyle = styleMap({
        height: `${trackHeight}%`,
        '--color-prop': this.color,
    });

    return html`
      <button class="remove-button" @click=${this.removePrompt} aria-label="Remove prompt">
        ${svg`<svg viewBox="0 0 16 16"><line x1="1" y1="15" x2="15" y2="1" /><line x1="1" y1="1" x2="15" y2="15" /></svg>`}
      </button>
      <div class="prompt ${containerClasses}">
        <span
          id="text"
          spellcheck="false"
          @focus=${this.onFocus}
          @keydown=${this.onKeyDown}
          @blur=${this.updateText}></span>
        <div class="slider-container" @pointerdown=${this.handlePointerDown}>
          <div class="slider-track" style=${trackStyle}></div>
        </div>
        <div id="midi" @click=${this.toggleLearnMode}>
          ${this.learnMode ? 'Learn' : `CC:${this.cc}`}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'prompt-controller': PromptController;
  }
}
