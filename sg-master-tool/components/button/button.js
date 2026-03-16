/**
 * Sg Button — <sg-button>
 *
 * Attributes:
 *   variant   "primary" | "secondary"     default: "primary"
 *   size      "large" | "small"           default: "large"
 *   state     "default" | "inactive"      default: "default"
 *   layout    "hug" | "fill"              default: "hug"
 *   floating  (boolean attr)              default: false
 *
 * Slots:
 *   default           Button label text
 *   icon-left         Icon before label
 *   icon-right        Icon after label
 *
 * Examples:
 *   <sg-button>Save</sg-button>
 *   <sg-button variant="secondary" size="small">Cancel</sg-button>
 *   <sg-button state="inactive">Submit</sg-button>
 *   <sg-button layout="fill">Continue</sg-button>
 *   <sg-button floating>
 *     <svg slot="icon-left" ...></svg>
 *     Start Recording
 *   </sg-button>
 */

class SgButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'state', 'layout', 'floating'];
  }

  connectedCallback()             { this._render(); }
  attributeChangedCallback()      { this._render(); }

  get _variant()  { return this.getAttribute('variant')  || 'primary'; }
  get _size()     { return this.getAttribute('size')     || 'large'; }
  get _state()    { return this.getAttribute('state')    || 'default'; }
  get _layout()   { return this.getAttribute('layout')   || 'hug'; }
  get _floating() { return this.hasAttribute('floating'); }

  _render() {
    // Cache label text the first time it's available.
    // attributeChangedCallback fires before children are parsed, so text nodes
    // may not exist yet — connectedCallback fires after, when they do.
    const rawLabel = Array.from(this.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent.trim())
      .filter(Boolean)
      .join(' ');
    if (rawLabel) this._cachedLabel = rawLabel;
    const labelText = this._cachedLabel || 'Button';

    const iconLeftSlot  = this.querySelector('[slot="icon-left"]');
    const iconRightSlot = this.querySelector('[slot="icon-right"]');

    const isInactive = this._state === 'inactive';

    const classes = [
      'sg-btn',
      `sg-btn--${this._variant}`,
      `sg-btn--${this._size}`,
      `sg-btn--${this._layout}`,
      isInactive       ? 'sg-btn--inactive' : '',
      this._floating   ? 'sg-btn--floating' : '',
    ].filter(Boolean).join(' ');

    // Capture onclick attribute and slotted icons before clearing innerHTML
    const onclickAttr    = this.getAttribute('onclick');
    const iconLeftClone  = iconLeftSlot  ? iconLeftSlot.cloneNode(true)  : null;
    const iconRightClone = iconRightSlot ? iconRightSlot.cloneNode(true) : null;

    this.innerHTML = '';

    // fill layout needs block so width:100% takes effect on the host
    this.style.display = this._layout === 'fill' ? 'block' : 'inline-block';

    const btn = document.createElement('button');
    btn.className = classes;
    btn.disabled  = isInactive;
    btn.setAttribute('aria-disabled', String(isInactive));

    // Forward the host's onclick attribute to the inner <button> so
    // inline handlers like onclick="goToScreen(1)" are not lost
    if (onclickAttr && !isInactive) {
      btn.setAttribute('onclick', onclickAttr);
    }

    if (iconLeftClone) {
      const wrap = document.createElement('span');
      wrap.className = 'sg-btn__icon';
      wrap.appendChild(iconLeftClone);
      btn.appendChild(wrap);
    }

    const label = document.createElement('span');
    label.textContent = labelText;
    btn.appendChild(label);

    if (iconRightClone) {
      const wrap = document.createElement('span');
      wrap.className = 'sg-btn__icon';
      wrap.appendChild(iconRightClone);
      btn.appendChild(wrap);
    }

    this.appendChild(btn);
  }
}

customElements.define('sg-button', SgButton);
