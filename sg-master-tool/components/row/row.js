/**
 * Sg Row Components — row.js
 *
 * Registers three custom elements:
 *
 *   <sg-section-header>  — Bold section label
 *     Attributes:
 *       color   "default" | "light"   default: "default"
 *     Slot: default (label text)
 *
 *   <sg-row-group>       — White card that wraps contained rows
 *     Slot: default (one or more <sg-row> elements)
 *
 *   <sg-row>             — List row with configurable action affordance
 *     Attributes:
 *       title       Label text                              default: "Title"
 *       subtext     Secondary text (omit for single-line)
 *       action      none | switch | chevron | selector |
 *                   info | menu | edit |
 *                   check-right | check-left | checkbox | radio
 *                                                           default: "none"
 *       value       Displayed value for selector action
 *       checked     Boolean — active state for switch / check / checkbox / radio
 *       no-divider  Boolean — hides the bottom rule
 *       stand-alone Boolean — transparent bg, used outside a row-group
 *
 *     Events:
 *       sg-change  fired on switch / checkbox / radio toggle, detail: { checked: bool }
 *
 *     Examples:
 *       <sg-row title="Dark Mode" action="switch" checked></sg-row>
 *       <sg-row title="Notifications" action="chevron" subtext="All allowed" onclick="..."></sg-row>
 *       <sg-row title="Language" action="selector" value="English"></sg-row>
 *       <sg-row title="Option A" action="radio" checked stand-alone no-divider></sg-row>
 *
 * Figma source: Components 2026 → node 11864-12290
 */

// ── Inline SVG icons ─────────────────────────────────────────────────────────

const ICONS = {
  chevron: `<svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
    <path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  selectorArrows: `<svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true">
    <path d="M6 1L2 6h8L6 1Z" fill="currentColor"/>
    <path d="M6 15l4-5H2l4 5Z" fill="currentColor"/>
  </svg>`,

  info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
    <path d="M10 9v5M10 6.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  menuDots: `<svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor" aria-hidden="true">
    <circle cx="2" cy="2" r="1.5"/>
    <circle cx="8" cy="2" r="1.5"/>
    <circle cx="14" cy="2" r="1.5"/>
  </svg>`,

  edit: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M12.5 2.5l3 3L5 16H2v-3L12.5 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.5 4.5l3 3" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  checkRight: `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
    <path d="M1.5 6L6 10.5L14.5 1.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  checkboxEmpty: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="17" height="17" rx="3.5" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  checkboxChecked: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect width="20" height="20" rx="4" fill="currentColor"/>
    <path d="M4.5 10L8.5 14L15.5 6.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  radioEmpty: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  radioChecked: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
    <circle cx="10" cy="10" r="5" fill="currentColor"/>
  </svg>`,
};

// ── <sg-section-header> ─────────────────────────────────────────────────────

class SgSectionHeader extends HTMLElement {
  static get observedAttributes() { return ['color']; }
  connectedCallback()        { this._render(); }
  attributeChangedCallback() { this._render(); }

  get _color() { return this.getAttribute('color') || 'default'; }

  _render() {
    const text = this.textContent.trim() || 'Section header';
    this.innerHTML = '';
    this.style.display = 'block';

    const el = document.createElement('div');
    el.className = `sg-section-header${this._color === 'light' ? ' sg-section-header--light' : ''}`;

    const span = document.createElement('span');
    span.className = 'sg-section-header__text';
    span.textContent = text;
    el.appendChild(span);
    this.appendChild(el);
  }
}

customElements.define('sg-section-header', SgSectionHeader);

// ── <sg-row-group> ──────────────────────────────────────────────────────────

class SgRowGroup extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.classList.add('sg-row-group');
  }
}

customElements.define('sg-row-group', SgRowGroup);

// ── <sg-row> ────────────────────────────────────────────────────────────────

class SgRow extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'subtext', 'action', 'value', 'checked', 'no-divider', 'stand-alone'];
  }

  connectedCallback()        { this._render(); }
  attributeChangedCallback() { if (this._mounted) this._render(); }

  get _title()      { return this.getAttribute('title')   || 'Title'; }
  get _subtext()    { return this.getAttribute('subtext') || ''; }
  get _action()     { return this.getAttribute('action')  || 'none'; }
  get _value()      { return this.getAttribute('value')   || ''; }
  get _checked()    { return this.hasAttribute('checked'); }
  get _noDivider()  { return this.hasAttribute('no-divider'); }
  get _standAlone() { return this.hasAttribute('stand-alone'); }

  // Actions that make the whole row tappable
  get _isClickable() {
    return ['chevron', 'none', 'menu', 'info', 'edit'].includes(this._action);
  }

  _render() {
    this._mounted = true;
    const onclickAttr = this.getAttribute('onclick');
    this.removeAttribute('onclick'); // prevent double-firing
    this.innerHTML = '';
    this.style.display = 'block';

    const action  = this._action;
    const hasSubtext = Boolean(this._subtext);

    // Root div
    const row = document.createElement('div');
    row.className = [
      'sg-row',
      this._standAlone  ? 'sg-row--stand-alone' : '',
      hasSubtext        ? 'sg-row--has-subtext'  : '',
      `sg-row--action-${action}`,
      this._isClickable && onclickAttr ? 'sg-row--clickable' : '',
    ].filter(Boolean).join(' ');

    if (onclickAttr && this._isClickable) {
      row.setAttribute('onclick', onclickAttr);
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
    }

    // Inner layout
    const inner = document.createElement('div');
    inner.className = 'sg-row__inner';

    // Check-left goes before the text
    if (action === 'check-left') {
      const wrap = document.createElement('div');
      wrap.className = 'sg-row__check-left';
      wrap.style.color = this._checked ? 'var(--color-primary)' : 'transparent';
      wrap.innerHTML = ICONS.checkRight;
      inner.appendChild(wrap);
    }

    // Checkbox goes before text (left side)
    if (action === 'checkbox') {
      const wrap = document.createElement('div');
      wrap.className = 'sg-row__action';
      wrap.style.color = 'var(--color-primary)';
      wrap.innerHTML = this._checked ? ICONS.checkboxChecked : ICONS.checkboxEmpty;
      wrap.style.cursor = 'pointer';
      wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAttribute('checked');
        this.dispatchEvent(new CustomEvent('sg-change', { detail: { checked: this._checked }, bubbles: true }));
        this._render();
      });
      inner.appendChild(wrap);
    }

    // Radio (left side)
    if (action === 'radio') {
      const wrap = document.createElement('div');
      wrap.className = 'sg-row__action';
      wrap.style.color = 'var(--color-primary)';
      wrap.innerHTML = this._checked ? ICONS.radioChecked : ICONS.radioEmpty;
      wrap.style.cursor = 'pointer';
      wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        // For radio, typically you'd handle selection at the group level,
        // but we emit the event so the consumer can manage it
        if (!this._checked) {
          this.setAttribute('checked', '');
          this.dispatchEvent(new CustomEvent('sg-change', { detail: { checked: true }, bubbles: true }));
          this._render();
        }
      });
      inner.appendChild(wrap);
    }

    // Text block
    const textWrap = document.createElement('div');
    textWrap.className = 'sg-row__text';

    const title = document.createElement('div');
    title.className = 'sg-row__title';
    title.textContent = this._title;
    textWrap.appendChild(title);

    // Switch has subtext below the inner row (different layout)
    const isSwitch = action === 'switch';
    if (hasSubtext && !isSwitch) {
      const sub = document.createElement('div');
      sub.className = 'sg-row__subtext';
      sub.textContent = this._subtext;
      textWrap.appendChild(sub);
    }

    inner.appendChild(textWrap);

    // Right-side action affordances
    switch (action) {
      case 'switch': {
        const toggle = this._buildToggle(this._checked, 'small');
        inner.appendChild(toggle);
        break;
      }
      case 'chevron': {
        const ch = document.createElement('div');
        ch.className = 'sg-row__chevron';
        ch.innerHTML = ICONS.chevron;
        inner.appendChild(ch);
        break;
      }
      case 'selector': {
        const sel = document.createElement('div');
        sel.className = 'sg-row__selector';
        if (this._value) {
          const val = document.createElement('span');
          val.textContent = this._value;
          sel.appendChild(val);
        }
        const arrows = document.createElement('span');
        arrows.innerHTML = ICONS.selectorArrows;
        sel.appendChild(arrows);
        inner.appendChild(sel);
        break;
      }
      case 'info': {
        const info = document.createElement('div');
        info.className = 'sg-row__info';
        info.innerHTML = ICONS.info;
        inner.appendChild(info);
        break;
      }
      case 'menu': {
        const menu = document.createElement('div');
        menu.className = 'sg-row__menu';
        menu.innerHTML = ICONS.menuDots;
        inner.appendChild(menu);
        break;
      }
      case 'edit': {
        const edit = document.createElement('div');
        edit.className = 'sg-row__edit';
        edit.innerHTML = ICONS.edit;
        inner.appendChild(edit);
        break;
      }
      case 'check-right': {
        const check = document.createElement('div');
        check.className = 'sg-row__check';
        check.style.color = this._checked ? 'var(--color-primary)' : 'transparent';
        check.innerHTML = ICONS.checkRight;
        inner.appendChild(check);
        break;
      }
    }

    row.appendChild(inner);

    // Switch subtext lives below the inner row
    if (isSwitch && hasSubtext) {
      const subWrap = document.createElement('div');
      subWrap.className = 'sg-row__subtext-wrap';
      const sub = document.createElement('div');
      sub.className = 'sg-row__subtext';
      sub.textContent = this._subtext;
      subWrap.appendChild(sub);
      row.appendChild(subWrap);
    }

    // Divider
    if (!this._noDivider) {
      const div = document.createElement('div');
      div.className = 'sg-row__divider';
      row.appendChild(div);
    }

    this.appendChild(row);
  }

  _buildToggle(checked, size) {
    // small = 32×20, large = 52×32
    const isSmall = size === 'small';
    const trackW  = isSmall ? 32 : 52;
    const trackH  = isSmall ? 20 : 32;
    const thumbSz = isSmall ? 20 : 31;

    const track = document.createElement('button');
    track.setAttribute('type', 'button');
    track.setAttribute('role', 'switch');
    track.setAttribute('aria-checked', String(checked));
    track.style.cssText = [
      `display: inline-flex`,
      `align-items: center`,
      `width: ${trackW}px`,
      `height: ${trackH}px`,
      `border-radius: 40px`,
      `border: none`,
      `padding: 0`,
      `cursor: pointer`,
      `transition: background var(--transition-fast), justify-content var(--transition-fast)`,
      `justify-content: ${checked ? 'flex-end' : 'flex-start'}`,
      `background: ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
      `flex-shrink: 0`,
    ].join(';');

    const thumb = document.createElement('div');
    thumb.style.cssText = [
      `width: ${thumbSz}px`,
      `height: ${thumbSz}px`,
      `border-radius: 40px`,
      `background: white`,
      `border: 2px solid ${checked ? 'var(--color-primary)' : 'rgba(29,29,29,0.4)'}`,
      `box-sizing: border-box`,
      `flex-shrink: 0`,
      `transition: border-color var(--transition-fast)`,
    ].join(';');

    track.appendChild(thumb);

    track.addEventListener('click', (e) => {
      e.stopPropagation();
      const nowChecked = !this._checked;
      if (nowChecked) {
        this.setAttribute('checked', '');
      } else {
        this.removeAttribute('checked');
      }
      this.dispatchEvent(new CustomEvent('sg-change', { detail: { checked: nowChecked }, bubbles: true }));
      this._render();
    });

    return track;
  }
}

customElements.define('sg-row', SgRow);
