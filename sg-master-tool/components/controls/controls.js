/**
 * Sg Controls — controls.js
 *
 * Registers four custom elements:
 *
 *   <sg-toggle>
 *     Attributes:
 *       checked            Boolean — on state
 *       size    "large" | "small"   default: "large"
 *       disabled           Boolean
 *     Events:
 *       sg-change   detail: { checked: bool }
 *
 *   <sg-checkbox>
 *     Attributes:
 *       checked            Boolean — selected state
 *       disabled           Boolean
 *     Events:
 *       sg-change   detail: { checked: bool }
 *
 *   <sg-radio>
 *     Attributes:
 *       checked            Boolean — selected state
 *       disabled           Boolean
 *     Events:
 *       sg-change   detail: { checked: bool }
 *     Note: radio group management (clearing siblings) is handled by the consumer.
 *
 *   <sg-seg-control>
 *     Attributes:
 *       options   Comma-separated labels         e.g. "Day,Week,Month"
 *       selected  Zero-based index of selection  default: "0"
 *     Events:
 *       sg-change   detail: { selected: number, label: string }
 *
 * Figma source: Controls page — node 1090-29713
 */

// ── SVG paths ────────────────────────────────────────────────────────────────

const CHECKBOX_EMPTY = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <rect x="1.5" y="1.5" width="17" height="17" rx="3.5" stroke="currentColor" stroke-width="2"/>
</svg>`;

const CHECKBOX_CHECKED = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <rect width="20" height="20" rx="4" fill="currentColor"/>
  <path d="M4.5 10L8.5 14L15.5 6.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const RADIO_EMPTY = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
</svg>`;

const RADIO_CHECKED = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
  <circle cx="10" cy="10" r="5" fill="currentColor"/>
</svg>`;

// ── <sg-toggle> ─────────────────────────────────────────────────────────────

class SgToggle extends HTMLElement {
  static get observedAttributes() { return ['checked', 'size', 'disabled']; }
  connectedCallback()        { this._render(); }
  attributeChangedCallback() { if (this._mounted) this._render(); }

  get _checked()  { return this.hasAttribute('checked'); }
  get _size()     { return this.getAttribute('size') || 'large'; }
  get _disabled() { return this.hasAttribute('disabled'); }

  _render() {
    this._mounted = true;
    this.innerHTML = '';

    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', String(this._checked));
    if (this._disabled) btn.setAttribute('disabled', '');

    btn.className = [
      'sg-toggle',
      `sg-toggle--${this._size}`,
      this._checked  ? 'sg-toggle--on'       : 'sg-toggle--off',
      this._disabled ? 'sg-toggle--disabled'  : '',
    ].filter(Boolean).join(' ');

    const track = document.createElement('div');
    track.className = 'sg-toggle__track';

    const thumb = document.createElement('div');
    thumb.className = 'sg-toggle__thumb';
    track.appendChild(thumb);

    btn.appendChild(track);
    this.appendChild(btn);

    if (!this._disabled) {
      btn.addEventListener('click', () => {
        const nowChecked = !this._checked;
        if (nowChecked) {
          this.setAttribute('checked', '');
        } else {
          this.removeAttribute('checked');
        }
        this.dispatchEvent(new CustomEvent('sg-change', { detail: { checked: nowChecked }, bubbles: true }));
      });
    }

    this.style.display = 'inline-block';
  }
}

customElements.define('sg-toggle', SgToggle);

// ── <sg-checkbox> ───────────────────────────────────────────────────────────

class SgCheckbox extends HTMLElement {
  static get observedAttributes() { return ['checked', 'disabled']; }
  connectedCallback()        { this._render(); }
  attributeChangedCallback() { if (this._mounted) this._render(); }

  get _checked()  { return this.hasAttribute('checked'); }
  get _disabled() { return this.hasAttribute('disabled'); }

  _render() {
    this._mounted = true;
    this.innerHTML = '';

    const el = document.createElement('div');
    el.className = [
      'sg-checkbox',
      this._checked  ? 'sg-checkbox--checked'  : '',
      this._disabled ? 'sg-checkbox--disabled' : '',
    ].filter(Boolean).join(' ');
    el.setAttribute('role', 'checkbox');
    el.setAttribute('aria-checked', String(this._checked));
    el.setAttribute('tabindex', this._disabled ? '-1' : '0');

    el.innerHTML = this._checked ? CHECKBOX_CHECKED : CHECKBOX_EMPTY;

    if (!this._disabled) {
      el.addEventListener('click', () => {
        const nowChecked = !this._checked;
        if (nowChecked) {
          this.setAttribute('checked', '');
        } else {
          this.removeAttribute('checked');
        }
        this.dispatchEvent(new CustomEvent('sg-change', { detail: { checked: nowChecked }, bubbles: true }));
      });
    }

    this.appendChild(el);
    this.style.display = 'inline-block';
  }
}

customElements.define('sg-checkbox', SgCheckbox);

// ── <sg-radio> ──────────────────────────────────────────────────────────────

class SgRadio extends HTMLElement {
  static get observedAttributes() { return ['checked', 'disabled']; }
  connectedCallback()        { this._render(); }
  attributeChangedCallback() { if (this._mounted) this._render(); }

  get _checked()  { return this.hasAttribute('checked'); }
  get _disabled() { return this.hasAttribute('disabled'); }

  _render() {
    this._mounted = true;
    this.innerHTML = '';

    const el = document.createElement('div');
    el.className = [
      'sg-radio',
      this._checked  ? 'sg-radio--checked'  : '',
      this._disabled ? 'sg-radio--disabled' : '',
    ].filter(Boolean).join(' ');
    el.setAttribute('role', 'radio');
    el.setAttribute('aria-checked', String(this._checked));
    el.setAttribute('tabindex', this._disabled ? '-1' : '0');

    el.innerHTML = this._checked ? RADIO_CHECKED : RADIO_EMPTY;

    if (!this._disabled) {
      el.addEventListener('click', () => {
        if (!this._checked) {
          this.setAttribute('checked', '');
          this.dispatchEvent(new CustomEvent('sg-change', { detail: { checked: true }, bubbles: true }));
        }
      });
    }

    this.appendChild(el);
    this.style.display = 'inline-block';
  }
}

customElements.define('sg-radio', SgRadio);

// ── <sg-seg-control> ────────────────────────────────────────────────────────

class SgSegControl extends HTMLElement {
  static get observedAttributes() { return ['options', 'selected']; }
  connectedCallback()        { this._render(); }
  attributeChangedCallback() { if (this._mounted) this._render(); }

  get _options() {
    return (this.getAttribute('options') || 'Option 1,Option 2')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  get _selected() { return parseInt(this.getAttribute('selected') || '0', 10); }

  _render() {
    this._mounted = true;
    this.innerHTML = '';
    this.style.display = 'block';

    const options  = this._options;
    const selected = Math.max(0, Math.min(this._selected, options.length - 1));

    const outer = document.createElement('div');
    outer.className = 'sg-seg-control';

    const content = document.createElement('div');
    content.className = 'sg-seg-control__content';

    options.forEach((label, i) => {
      // Separator between non-adjacent-selected items
      if (i > 0) {
        const prevSelected = (i - 1) === selected;
        const currSelected = i === selected;
        if (!prevSelected && !currSelected) {
          const sep = document.createElement('div');
          sep.className = 'sg-seg-control__separator';
          content.appendChild(sep);
        } else {
          // No visible separator when adjacent to selection, but add a spacer for layout
          const spacer = document.createElement('div');
          spacer.style.width = '0';
          content.appendChild(spacer);
        }
      }

      const item = document.createElement('button');
      item.setAttribute('type', 'button');
      item.className = [
        'sg-seg-control__item',
        i === selected ? 'sg-seg-control__item--selected' : '',
      ].filter(Boolean).join(' ');

      const lbl = document.createElement('span');
      lbl.className = 'sg-seg-control__label';
      lbl.textContent = label;
      item.appendChild(lbl);

      item.addEventListener('click', () => {
        this.setAttribute('selected', String(i));
        this.dispatchEvent(new CustomEvent('sg-change', { detail: { selected: i, label }, bubbles: true }));
      });

      content.appendChild(item);
    });

    outer.appendChild(content);
    this.appendChild(outer);
  }
}

customElements.define('sg-seg-control', SgSegControl);
