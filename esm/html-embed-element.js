import {HTMLElement} from './html-element.js';

/**
 * @implements globalThis.HTMLEmbedElement
 */
export class HTMLEmbedElement extends HTMLElement {
  constructor(ownerDocument, localName = 'embed') {
    super(ownerDocument, localName);
  }
}
