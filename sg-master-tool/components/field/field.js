/**
 * Sg Field — <sg-field>
 *
 * Attributes:
 *   type          "text" | "email" | "password"   default: "text"
 *   label         Field label text
 *   placeholder   Input placeholder
 *   value         Current value
 *   state         "default" | "inactive"           default: "default"
 *   action-label  Optional right-side label link (e.g. "Forgot password")
 *   required      Boolean — marks field required
 *   message       Helper or error message below the field
 *
 * Properties:
 *   .value        Get / set the current input value
 *
 * Methods:
 *   .setError(msg)   Show error state with message
 *   .clearError()    Clear error state
 *   .focus()         Focus the inner input
 *
 * Events fired on host element:
 *   sg-input        { detail: { value } }  — on every keystroke
 *   sg-change       { detail: { value } }  — on blur
 *   sg-action       {}                     — action-label clicked
 *
 * Examples:
 *   <sg-field type="email" label="Email" placeholder="you@example.com"></sg-field>
 *   <sg-field type="password" label="Password" action-label="Forgot password"></sg-field>
 *   <sg-field label="Name" required message="Required"></sg-field>
 */

class SgField extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'label', 'placeholder', 'value', 'state', 'action-label', 'required', 'message'];
  }

  connectedCallback()        { this._render(); }
  attributeChangedCallback() { if (this._rendered) this._sync(); }

  // ── Public API ──────────────────────────────
  get value()      { return this._input ? this._input.value : (this.getAttribute('value') || ''); }
  set value(v)     { if (this._input) { this._input.value = v; this._updateState(); } }

  setError(msg) {
    this._errorMsg = msg;
    this._wrap.classList.add('sg-field--error');
    this._wrap.classList.remove('sg-field--focused');
    if (this._msgEl) {
      this._msgEl.textContent = msg;
      this._msgEl.style.display = 'block';
    }
  }

  clearError() {
    this._errorMsg = null;
    this._wrap.classList.remove('sg-field--error');
    if (this._msgEl) {
      const base = this.getAttribute('message');
      this._msgEl.textContent = base || '';
      this._msgEl.style.display = base ? 'block' : 'none';
    }
  }

  focus() { this._input && this._input.focus(); }

  // ── Render ──────────────────────────────────
  _render() {
    this._rendered = true;

    const type        = this.getAttribute('type')         || 'text';
    const label       = this.getAttribute('label')        || '';
    const placeholder = this.getAttribute('placeholder')  || '';
    const initValue   = this.getAttribute('value')        || '';
    const state       = this.getAttribute('state')        || 'default';
    const actionLabel = this.getAttribute('action-label') || '';
    const message     = this.getAttribute('message')      || '';
    const isPassword  = type === 'password';
    const isInactive  = state === 'inactive';

    this.innerHTML = '';

    // ── Wrapper
    const wrap = document.createElement('div');
    wrap.className = 'sg-field' + (isInactive ? ' sg-field--inactive' : '');
    this._wrap = wrap;

    // ── Header row (label + optional action)
    const header = document.createElement('div');
    header.className = 'sg-field__header';

    if (label) {
      const lbl = document.createElement('label');
      lbl.className = 'sg-field__label';
      lbl.textContent = label;
      if (this.hasAttribute('required')) {
        const asterisk = document.createElement('span');
        asterisk.textContent = '*';
        asterisk.style.cssText = 'margin-left:1px;color:inherit;font-weight:inherit;';
        lbl.appendChild(asterisk);
      }
      header.appendChild(lbl);
    }

    if (actionLabel) {
      const btn = document.createElement('button');
      btn.type        = 'button';
      btn.className   = 'sg-field__action';
      btn.textContent = actionLabel;
      btn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('sg-action', { bubbles: true }));
      });
      header.appendChild(btn);
    }

    wrap.appendChild(header);

    // ── Input shell
    const shell = document.createElement('div');
    shell.className = 'sg-field__shell';

    const input = document.createElement('input');
    input.className   = 'sg-field__input';
    input.type        = isPassword ? 'password' : type;
    input.placeholder = placeholder;
    input.value       = initValue;
    input.disabled    = isInactive;
    if (this.hasAttribute('required')) input.required = true;
    this._input = input;

    input.addEventListener('focus', () => {
      if (isInactive) return;
      this._wrap.classList.add('sg-field--focused');
    });

    input.addEventListener('blur', () => {
      this._wrap.classList.remove('sg-field--focused');
      this.dispatchEvent(new CustomEvent('sg-change', {
        bubbles: true,
        detail: { value: input.value }
      }));
    });

    input.addEventListener('input', () => {
      this._updateState();
      this.dispatchEvent(new CustomEvent('sg-input', {
        bubbles: true,
        detail: { value: input.value }
      }));
    });

    shell.appendChild(input);

    // ── Icon area (clear + password toggle)
    const icons = document.createElement('div');
    icons.className = 'sg-field__icons';

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.type      = 'button';
    clearBtn.className = 'sg-field__icon-btn sg-field__clear';
    clearBtn.setAttribute('aria-label', 'Clear');
    clearBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <circle cx="10" cy="10" r="8"/>
      <path d="M7.5 7.5l5 5M12.5 7.5l-5 5"/>
    </svg>`;
    clearBtn.addEventListener('click', () => {
      input.value = '';
      this._updateState();
      input.focus();
      this.dispatchEvent(new CustomEvent('sg-input', { bubbles: true, detail: { value: '' } }));
    });
    icons.appendChild(clearBtn);
    this._clearBtn = clearBtn;

    // Error icon — shown when in error state
    const errorIcon = document.createElement('span');
    errorIcon.className = 'sg-field__error-icon';
    errorIcon.setAttribute('aria-hidden', 'true');
    errorIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#d93025" stroke-width="1.5"/>
      <path d="M10 6v5" stroke="#d93025" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="10" cy="14" r="0.75" fill="#d93025"/>
    </svg>`;
    icons.appendChild(errorIcon);
    this._errorIcon = errorIcon;

    // Password show/hide
    if (isPassword) {
      let visible = false;
      const toggleBtn = document.createElement('button');
      toggleBtn.type      = 'button';
      toggleBtn.className = 'sg-field__icon-btn';
      toggleBtn.setAttribute('aria-label', 'Show password');
      toggleBtn.innerHTML = this._eyeIcon(false);
      toggleBtn.addEventListener('click', () => {
        visible      = !visible;
        input.type   = visible ? 'text' : 'password';
        toggleBtn.innerHTML = this._eyeIcon(visible);
      });
      icons.appendChild(toggleBtn);
    }

    shell.appendChild(icons);
    wrap.appendChild(shell);

    // ── Message
    const msgEl = document.createElement('span');
    msgEl.className    = 'sg-field__message';
    msgEl.textContent  = message;
    msgEl.style.display = message ? 'block' : 'none';
    this._msgEl = msgEl;
    wrap.appendChild(msgEl);

    this.appendChild(wrap);
    this._updateState();
  }

  _sync() {
    // Lightweight attribute sync after first render
    const state = this.getAttribute('state') || 'default';
    if (this._wrap) {
      this._wrap.classList.toggle('sg-field--inactive', state === 'inactive');
      if (this._input) this._input.disabled = state === 'inactive';
    }
    const message = this.getAttribute('message') || '';
    if (this._msgEl && !this._errorMsg) {
      this._msgEl.textContent  = message;
      this._msgEl.style.display = message ? 'block' : 'none';
    }
  }

  _updateState() {
    if (!this._wrap) return;
    const hasValue = this._input && this._input.value.length > 0;
    this._wrap.classList.toggle('sg-field--has-value', hasValue);
  }

  _eyeIcon(visible) {
    return visible
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>
         </svg>`
      : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>
         </svg>`;
  }
}

customElements.define('sg-field', SgField);
