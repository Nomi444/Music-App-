/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { svg, css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PlaybackState } from '../types';

@customElement('play-pause-button')
export class PlayPauseButton extends LitElement {

  @property({ type: String }) playbackState: PlaybackState = 'stopped';

  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .container {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: var(--spotify-green, #1DB954);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 8px 8px rgba(0,0,0,.3);
    }
    :host(:hover) .container {
      transform: scale(1.05);
      background-color: var(--spotify-green-hover, #1ed760);
    }
    svg {
      width: 24px;
      height: 24px;
    }
    .icon {
      fill: #000;
    }
    .loader {
      stroke: #000;
      stroke-width: 3;
      stroke-linecap: round;
      animation: spin linear 1s infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(359deg); }
    }
  `;

  private renderPause() {
    return svg`<path class="icon" d="M5.7 3a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7H5.7zm10 0a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7h-2.6z"></path>`;
  }

  private renderPlay() {
    return svg`<path class="icon" d="M7.05 3.606l13.49 7.788a.7.7 0 010 1.212L7.05 20.394A.7.7 0 016 19.788V4.212a.7.7 0 011.05-.606z"></path>`;
  }

  private renderLoading() {
    return svg`<path class="loader" d="M12,2A10,10,0,0,0,2,12" fill="none" />`;
  }

  private renderIcon() {
    if (this.playbackState === 'playing') {
      return this.renderPause();
    } else if (this.playbackState === 'loading') {
      return this.renderLoading();
    } else {
      return this.renderPlay();
    }
  }

  override render() {
    return html`<div class="container">
      <svg viewBox="0 0 24 24">
        ${this.renderIcon()}
      </svg>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'play-pause-button': PlayPauseButton
  }
}
