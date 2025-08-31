/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('toast-message')
export class ToastMessage extends LitElement {
  static override styles = css`
    .toast {
      line-height: 1.6;
      position: fixed;
      bottom: 100px; /* Above player bar */
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--spotify-light-gray, #282828);
      color: var(--spotify-text, #fff);
      padding: 12px 24px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: min(450px, 80vw);
      transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.5s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      font-size: 14px;
      z-index: 1000;
      text-wrap: pretty;
    }
    button {
      background: none;
      border: none;
      color: var(--spotify-text-subtle, #b3b3b3);
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      line-height: 1;
    }
    .toast:not(.showing) {
      transform: translate(-50%, 150%);
      opacity: 0;
      pointer-events: none;
    }
    a {
      color: var(--spotify-green, #1DB954);
      text-decoration: underline;
    }
  `;

  @property({ type: String }) message = '';
  @property({ type: Boolean }) showing = false;

  private renderMessageWithLinks() {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = this.message.split( urlRegex );
    return parts.map( ( part, i ) => {
      if ( i % 2 === 0 ) return part;
      return html`<a href=${part} target="_blank" rel="noopener">${part}</a>`;
    } );
  }

  override render() {
    return html`<div class=${classMap({ showing: this.showing, toast: true })}>
      <div class="message">${this.renderMessageWithLinks()}</div>
      <button @click=${this.hide}>✕</button>
    </div>`;
  }

  show(message: string) {
    this.showing = true;
    this.message = message;
  }

  hide() {
    this.showing = false;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'toast-message': ToastMessage
  }
}
