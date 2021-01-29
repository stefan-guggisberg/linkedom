# 🔗 linkedom

[![Build Status](https://travis-ci.com/WebReflection/linkedom.svg?branch=main)](https://travis-ci.com/WebReflection/linkedom) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/linkedom/badge.svg?branch=main)](https://coveralls.io/github/WebReflection/linkedom?branch=main)

<sup>**Social Media Photo by [JJ Ying](https://unsplash.com/@jjying) on [Unsplash](https://unsplash.com/)**</sup>

A triple-linked lists based DOM with the following goals:

  * **avoid** maximum callstack/recursion or **crashes**, even under heaviest conditions.
  * guarantee **linear performance** from small to big documents.
  * be **close to the** current **DOM standard**, but not too close.
  * replace [basicHTML](https://github.com/WebReflection/basicHTML#readme) (long term goal).



## Work in progress

Until there is a badge with 100% code coverage, and *npm* version is `0.1.x`, consider this project highly experimental, or a playground, to see where and how a linked-list based DOM can shine, and how difficult it would be to reach at least feature-parity with *basicHTML*.

```js
import {DOMParser} from 'linkedom';

const document = (new DOMParser).parseFromString(`
  <!doctype html>
  <html lang="en">
    <head>
      <title>Hello SSR</title>
    </head>
    <body>
      <form>
        <input name="user">
        <button>
          Submit
        </button>
      </form>
    </body>
  </html>
  `,
  'text/html'
);

// retrieve the document.defaultView, a global proxy that does *not*
// pollute the global environment (you are in charge of doing it)
const {defaultView: window} = document;

// the window proxy exposes all globals + classes from this module
const {
  // provided by this module, could be native too
  Event, CustomEvent,
  // all HTML classes, such as HTMLButtonElement and others, are available
  HTMLElement,
  // the CustomElementRegistry is defined once *per document*
  // multiple documents require multiple custom elements definition
  // but classes can be reused
  customElements
} = window;

// builtin extends compatible too 👍
customElements.define('custom-element', class extends HTMLElement {
  connectedCallback() {
    console.log('it works 🥳');
  }
});

document.body.appendChild(
  document.createElement('custom-element')
);

document.toString();
// the SSR ready document

document.querySelectorAll('form, input[name], button');
// the NodeList of elements
// CSS Selector via CSSselect
```



## Parsing VS Node Types

This module parses, and works, only with the following `nodeType`:

  * `ELEMENT_NODE`
  * `ATTRIBUTE_NODE`
  * `TEXT_NODE`
  * `COMMENT_NODE`
  * `DOCUMENT_NODE`
  * `DOCUMENT_FRAGMENT_NODE`

Everything else, at least for the time being, is considered *YAGNI*, and it won't likely ever land in this project, as there's no goal to replicate deprecated features of this aged Web.



## Benchmarks

To run the benchmark locally, please follow these commands:

```sh
git clone https://github.com/WebReflection/linkedom.git

cd linkedom/test
npm i

cd ..
npm i

npm run benchmark
```

### benchmark:dom
![benchmark output example](./linkedom-benchmark-dom.jpg)

### benchmark:html
![benchmark output example](./linkedom-benchmark-html.jpg)



## How does it work?

All nodes are linked on both sides, and all elements consist of 2 nodes, also linked in between.

Attributes are always at the beginning of an element, while zero or more extra nodes can be found before the end.

A fragment is a special element without boundaries, or parent node.

```
Node:             ← node →
Attr<Node>:       ← attr →          ↑ ownerElement
Text<Node>:       ← text →          ↑ parentNode
Comment<Node>:    ← comment →       ↑ parentNode
Element<Node>:    ← start ↔ end →   ↑ parentNode

Fragment<Element>:  start ↔ end

Element example:

          parentNode?
              ↑
              ├────────────────────────────────────────────┐
              │                                            ↓
    node? ← start → attr* → text* → comment* → element* → end → node?
              ↑                                            │
              └────────────────────────────────────────────┘


Fragment example:

              ┌────────────────────────────────────────────┐
              │                                            ↓
            start → attr* → text* → comment* → element* → end
              ↑                                            │
              └────────────────────────────────────────────┘
```

### Why is this better?

Moving *N* nodes from a container, being it either an *Element* or a *Fragment*, requires the following steps:

  * update the first *left* link of the moved segment
  * update the last *right* link of the moved segment
  * connect the *left* side, if any, of the moved node at the beginning of the segment, with the *right* side, if any, of the node at the end of such segment
  * update the *parentNode* of the segment to either *null*, or the new *parentNode*

As result, there are no array operations, and no memory operations, and everything is kept in sync by updating a few properties, so that removing `3714` sparse `<div>` elements in a *12M* document, as example, takes as little as *3ms*, while appending a whole fragment takes close to *0ms*.

Try `npm run benchmark:html` to see it yourself.

This structure also allows programs to avoid issues such as "*Maximum call stack size exceeded*", or "*JavaScript heap out of memory*" crashes, thanks to its reduced usage of memory and zero stacks involved, hence scaling better from small to very big documents.

### Are *childNodes* and *children* always computed?

At this point, even if this module is ready to cache results when no mutations happen, and since repeated crawling is not a too common pattern, but it can always be cached in user-land, the core always crawl *left* to *right* or *right* to *left* so that it guarantees it's always in sync with the current DOM state.

