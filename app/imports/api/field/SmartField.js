/**
 * This file is a part of 215RegEx.
 *
 * Created by Cam Moore on 5/16/16.
 *
 * Copyright (C) 2016 Cam Moore.
 *
 * The MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy , modify, merge, publish, deistribute, sublicense, and/or sell
 * copies of the Software, and to permit person to whom the Software is
 * furnished to do so, subject to the following condtions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHOERS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETER IN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISIGN FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE
 */

/** @module Field */

/**
 * SmartFields wrap a textarea. This is my attempt at reproducing Steven Levithan's <http://stevenlevithan.com>
 * RegexPal in meteor. From the original:
 *  "SmartField is my name for the rich text boxes RegexPal creates, which
 are essentially <div> container elements enclosing <textarea> elements
 on top of <pre> elements, combined with some CSS and JavaScript to
 facilitate seemless scrolling (the only scrollbar actually belongs to the
 container). The code for smart fields is occasionally browser-specific
 and is extremely hacky in general. However, it offers major speed
 benefits over traditional JavaScript-based rich text editors, although
 with more limited capabilities."
 */
class SmartField {

  /**
   * Creates a new SmartField around the el, textarea.
   * @param {Object} el the element a textarea.
   */
  constructor(el) {
    this._el = this._foobar(el);
    if (el !== null) {
      this._textboxEl = this._el.getElementsByTagName('textarea')[0];
      this._bgEl = document.createElement('pre');
      this._textboxEl.id = `${this._el.id}Text`;
      this._bgEl.id = `${this._el.id}Bg`;
      this._el.insertBefore(this._bgEl, this._textboxEl);

      this._textboxEl.onkeydown = (e) => {
        this._onKeyDown(e);
      };
      this._textboxEl.onkeyup = (e) => {
        this._onKeyUp(e);
      };

      this._keydownCount = 0;
      this._matchOnKeyUp = false;
      /* Killed key codes:
       16:  shift          17:  ctrl           18:  alt            19:  pause          20:  caps lock
       27:  escape         33:  page up        34:  page down      35:  end            36:  home
       37:  left           38:  up             39:  right          40:  down           44:  print screen
       45:  insert         112: f1             113: f2             114: f3             115: f4
       116: f5             117: f6             118: f7             119: f8             120: f9
       121: f10            122: f11            123: f12            144: num lock       145: scroll lock
       These could be included, but Opera handles them incorrectly:
       91:  Windows (Opera reports both the Windows key and "[" as 91.)
       93:  context menu (Opera reports the context menu key as 0, and "]" as 93.) */
      this._deadKeys = [16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 112, 113, 114, 115, 116, 117,
        118, 119, 120, 121, 122, 123, 144, 145];
      this.field = this._el;
      this.textbox = this._textboxEl;
      this.bg = this._bgEl;
    } else {
      this.field = el;
      this.textbox = null;
      this.bg = null;
    }
  }

  setBgHtml(html) {
    // Workaround an IE text-normaliztion bug where a leading newline is removed (causing highlighting to be misaligned)
    // if (isIE) html = html.replace(XRegExp.cache("^\\r\\n"), "\r\n\r\n");
    const varHtml = html.replace('^\\n', '\n\n');
    // The trailing characters improve seemless scrolling
    this.bg = this.replaceOuterHtml(this.bg, `${varHtml}<br>&nbsp;`);
    this.setDimensions();
  }

  // This is much faster than simple use of innerHTML in some browsers
  // See <http://blog.stevenlevithan.com/archives/faster-than-innerhtml>
  replaceHtml(el, html) {
    // console.log("replaceHtml(" + el + ", " + html + ")");
    const oldEl = this._foobar(el);
    /* @cc_on // Pure innerHTML is slightly faster in IE
     oldEl.innerHTML = html;
     return oldEl;
     @ */
    const newEl = oldEl.cloneNode(false);
    newEl.innerHTML = html;
    oldEl.parentNode.replaceChild(newEl, oldEl);
    /* Since we just removed the old element from the DOM, return a reference
     to the new element, which can be used to restore variable references. */
    return newEl;
  }

  /* outerHTML is used to work around the fact that IE applies text normalization when using innerHTML,
   which can cause problems with whitespace, etc. Note that even this approach doesn't work with some
   elements such as <div>. However, it mostly works with <pre> elements, at least. */
  replaceOuterHtml(el, html) {
    let varEl = this.replaceHtml(el, '');
    if (varEl.outerHTML) { // If IE
      const id = el.id;
      const className = el.className;
      const nodeName = el.nodeName;
      varEl.outerHTML = `<${nodeName} id='${id}' class='${className}'>${html}</${nodeName}>`;
      varEl = this._foobar(id); // Reassign, since we just overwrote the element in the DOM
    } else {
      varEl.innerHTML = html;
    }
    return varEl;
  }

  setDimensions() {
    /* Set the width of the textarea to its scrollWidth. Note that although the background content autoexpands, its
     offsetWidth isn't dynamically updated as is its offsetHeight (at least in Firefox 2). The pixel adjustments avoid
     an unnecessary horizontal scrollbar and keep the last character to the right in view when the container element
     has a horizontal scrollbar. */
    this.textbox.style.width = '';
    const scrollWidth = this.textbox.scrollWidth;
    const offsetWidth = this.textbox.offsetWidth;

    this.textbox.style.width = (scrollWidth === offsetWidth ? offsetWidth - 1 : scrollWidth + 8) + 'px';

    /* Set the height of the absolute-positioned textarea to its background content's offsetHeight. Since the background
     content autoexpands, this allows the elements to be scrolled simultaneously using the parent element's scrollbars.
     Setting it to textbox.scrollHeight instead of bg.offsetHeight would also work, but that would require us to first
     blank style.height. It would also prevent us from improving seemless scrolling by adding trailing characters to the
     background content (which is done outside this method) before testing its height. Comparing bg.offsetHeight to the
     container's offsetHeight (minus 2 for borders) is done for the sake of IE6, since CSS min-height doesn't work
     there. */
    this.textbox.style.height = Math.max(this.bg.offsetHeight, this.field.offsetHeight - 2) + 'px';
  }

  /**
   * Returns the document node for the given id.
   * @param el either the document node or the id of a document node.
   * @returns {*} the document node.
   * @private
   */
  _foobar(el) {
    if (el.nodeName) {
      return el;
    }
    if (typeof el === 'string') {
      return document.getElementById(el);
    }
    return false;
  }

  /**
   * KeyDown event handler.
   * @param e
   * @private
   */
  _onKeyDown(e) {
    const evt = e || event;
    // console.log(`keyDown: ${evt}`);
    if (!this._filterKeys(evt)) {
      return false;
    }
    return true;
  }

  /**
   * KeyUp event handler.
   * @param e
   * @private
   */
  _onKeyUp(e) {
    const evt = e || event;
    // console.log(`keyUp: ${evt}`);
    const srcEl = evt.srcElement || evt.target;
    this._keydownCount = 0; // Reset
    if (this._matchOnKeyUp) {
      this._matchOnKeyUp = false; // Reset
      // RegexPal.highlightMatches();
    }
  }

  /**
   *
   * @param e
   * @returns {boolean}
   * @private
   */
  _filterKeys(e) {
    // console.log(`_filterKeys(${e.keyCode})`);
    // If the user pressed a key which does not change the input, return false to prevent running a match
    if (this._deadKeys.indexOf(e.keyCode) > -1) {
      return false;
    }
    return true;
  }

}

export default SmartField;
