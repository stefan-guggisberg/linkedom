import {HTMLElement} from './html-element.js';

/**
 * @implements globalThis.HTMLMeterElement
 */
export class HTMLMeterElement extends HTMLElement {
  constructor(ownerDocument, localName = 'meter') {
    super(ownerDocument, localName);
  }
}
