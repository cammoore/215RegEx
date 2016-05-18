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
 are essentially &lt;div&gt; container elements enclosing &lt;textarea&gt; elements
 on top of &lt;pre&gt; elements, combined with some CSS and JavaScript to
 facilitate seemless scrolling (the only scrollbar actually belongs to the
 container). The code for smart fields is occasionally browser-specific
 and is extremely hacky in general. However, it offers major speed
 benefits over traditional JavaScript-based rich text editors, although
 with more limited capabilities."
 */
class SmartField {

  /**
   * Creates a new SmartField around the element or element Id. It should be a &lt;div&gt; with a textarea inside it.
   * @param {Object} el the element or element Id with a textarea.
   */
  constructor(el) {
    this._el = this._foobar(el);
    if (el !== null) {
      this._textboxEl = this._el.getElementsByTagName('textarea')[0];
      this._bgEl = document.createElement('pre');
      this._textboxEl.id = `${this._el.id}Text`;
      this._bgEl.id = `${this._el.id}Bg`;
      this._el.insertBefore(this._bgEl, this._textboxEl);
      this.field = this._el;
      this.textbox = this._textboxEl;
      this.bg = this._bgEl;
    } else {
      this.field = el;
      this.textbox = null;
      this.bg = null;
    }
  }

  /**
   * Gets the inner textarea so we can attach listeners to it.
   * @returns {*|null}
   */
  getTextarea() {
    return this.textbox;
  }
  

  /**
   * Sets the background HTML.
   * @param html the replacement HTML.
   */
  setBgHtml(html) {
    // Workaround an IE text-normaliztion bug where a leading newline is removed (causing highlighting to be misaligned)
    // if (isIE) html = html.replace(XRegExp.cache("^\\r\\n"), "\r\n\r\n");
    const varHtml = html.replace('^\\n', '\n\n');
    // The trailing characters improve seemless scrolling
    this.bg = this.replaceOuterHtml(this.bg, `${varHtml}<br>&nbsp;`);
    this.setDimensions();
  }

  /**
   * Replaces the HTML in the given element.
   * This is much faster than simple use of innerHTML in some browsers.
   * See http://blog.stevenlevithan.com/archives/faster-than-innerhtml
   * @param el the element or element Id.
   * @param html the HTML.
   * @returns {Node} the modified Node.
   */
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

  /**
   * replaceOuterHTML is used to work around the fact that IE applies text normalization when using innerHTML,
   which can cause problems with whitespace, etc. Note that even this approach doesn't work with some
   elements such as &lt;div&gt;. However, it mostly works with &lt;pre&gt; elements, at least.
   * @param el the element or element Id.
   * @param html the replacement HTML.
   * @returns {Node} the modified Node.
   */
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

  /**
   * Sets the dimensions of the SmartField.
   * Set the width of the textarea to its scrollWidth. Note that although the background content autoexpands, its
   * offsetWidth isn't dynamically updated as is its offsetHeight (at least in Firefox 2). The pixel adjustments avoid
   * an unnecessary horizontal scrollbar and keep the last character to the right in view when the container element
   * has a horizontal scrollbar.
   */
  setDimensions() {
    this.textbox.style.width = '';
    const scrollWidth = this.textbox.scrollWidth;
    const offsetWidth = this.textbox.offsetWidth;
    const width = (scrollWidth === offsetWidth ? offsetWidth - 1 : scrollWidth + 8);
    this.textbox.style.width = `${width}px`;

    /* Set the height of the absolute-positioned textarea to its background content's offsetHeight. Since the background
     content autoexpands, this allows the elements to be scrolled simultaneously using the parent element's scrollbars.
     Setting it to textbox.scrollHeight instead of bg.offsetHeight would also work, but that would require us to first
     blank style.height. It would also prevent us from improving seemless scrolling by adding trailing characters to the
     background content (which is done outside this method) before testing its height. Comparing bg.offsetHeight to the
     container's offsetHeight (minus 2 for borders) is done for the sake of IE6, since CSS min-height doesn't work
     there. */
    const height = Math.max(this.bg.offsetHeight, this.field.offsetHeight - 2);
    this.textbox.style.height = `${height}px`;
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
}

export default SmartField;
