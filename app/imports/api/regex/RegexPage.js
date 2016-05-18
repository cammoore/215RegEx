/**
 * This file is a part of 215RegEx.
 *
 * Created by Cam Moore on 5/17/16.
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

import SmartField from '/imports/api/field/SmartField';
import XRegExp from 'xregexp';

/** @module Regex */

/**
 * RegexPage represents the Regular Expression tester for ICS 215. It has a SmartField, regexField, for entering the
 * regular expression and a SmartField, dataField, for the data.  When the user enters their regular expression the
 * RegexPage highlights the matches in the dataField.
 */
class RegexPage {

  /**
   * Creates the new RegexPage setting up the SmartFields and wiring in the events.
   */
  constructor() {
    this.regexField = new SmartField('search');
    this.dataField = new SmartField('input');
    this.regexField.getTextarea().onkeydown = (e) => {
      this._onKeyDown(e);
    };
    this.regexField.getTextarea().onkeyup = (e) => {
      this._onKeyUp(e);
    };
    this.dataField.getTextarea().onkeydown = (e) => {
      this._onKeyDown(e);
    };
    this.dataField.getTextarea().onkeyup = (e) => {
      this._onKeyUp(e);
    };
    this._highlightSyntax = true;
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
  }

  /**
   * Highlights the Regular Expression syntax.
   */
  highlightSearchSyntax() {
    console.log('highlightRegexSyntax');
    if (this._highlightSyntax) {
      this.regexField.setBgHtml(this.regexField.getTextarea().value.replace(XRegExp.cache('[<&>]', 'g'), '_'));
      this.regexField.setBgHtml(this.parseRegex(this.regexField.getTextarea().value));
    } else {
      this.regexField.setBgHtml(this.regexField.getTextarea().value.replace(XRegExp.cache('[<&>]', 'g'), '_'));
    }
  }

  /**
   * Highlights the matching text.
   */
  highlightMatches() {
    // console.log('highlightMatches');
    const re = {
      /* If the matchPair regex seems a little crazy, the theory behind it is that it will be faster than using lazy quantification */
      matchPair: /`~\{((?:[^}]+|\}(?!~`))*)\}~`((?:[^`]+|`(?!~\{(?:[^}]+|\}(?!~`))*\}~`))*)(?:`~\{((?:[^}]+|\}(?!~`))*)\}~`)?/g,
      sansTrailingAlternator: /^(?:[^\\|]+|\\[\S\s]?|\|(?=[\S\s]))*/
    };
    const search = String(this.regexField.getTextarea().value);
    const input = String(this.dataField.getTextarea().value);
    // console.log(`regex = ${search}`);
    // console.log(`data = ${input}`);
    /* Abort if the user's regex contains an error (the test regex accounts for IE's changes to innerHTML).
     The syntax highlighting catches a number of mistakes and cross-browser issues which might not cause the
     browser to throw an error. Also abort if the search is empty and not using the invert results option, or
     if match highlighting is disabled. */
    if (
      XRegExp.cache('<[bB] class="?err"?>').test(this.regexField.bg.innerHTML) ||
      (!search.length && true) || false
    ) {
      // console.log('error in regex');
      this.dataField.setBgHtml(this.dataField.getTextarea().value.replace(XRegExp.cache('[<&>]', 'g'), '_'));
      return;
    }
    try {
      /* If existing, a single trailing vertical bar (|) is removed from the regex which is to be applied
       to the input text. This behavior is copied from RegexBuddy, and offers faster results and a less
       surprising experience while the user is in the middle of creating a regex. */
      const searchRegex = new XRegExp(re.sansTrailingAlternator.exec(search)[0], 'g');
      /* An error should never be thrown if syntax highlighting and XRegExp are working correctly, but the
       potential is avoided nonetheless. Safari in particular has several strange bugs which cause its regex
       engine's parser to barf during compilation. */

      // Matches are never looped over, for performance reasons...

      /* Initially, "`~{...}~`" is used as a safe string to encapsulate matches. Note that if such an
       unlikely sequence appears in the text, you might receive incorrect results. */
      let output = input.replace(searchRegex, '`~{$&}~`');
      /* Put all matches within alternating <b> and <i> elements (short element names speed up markup
       generation). Angled brackets and ampersands are first replaced, to avoid unintended HTML markup
       within the background <pre> element. */
      output = output
        .replace(XRegExp.cache('[<&>]', 'g'), '_')
        .replace(re.matchPair, '<b>$1</b>$2<i>$3</i>');
      // console.log(output);
      this.dataField.setBgHtml(output);
    } catch (err) {
      // console.log(err);
      this.dataField.setBgHtml(this.dataField.getTextarea().value.replace(XRegExp.cache('[<&>]', 'g'), '_'));
      return;
    }
  }

  /**
   * parses the given regular expression
   * @param value
   */
  parseRegex(value) {
    // console.log(`parseRegex(${value})`);
    const re = {
      regexToken: /\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,
      // characterClassParts: new XRegExp('^(?<opening>[^?)(?<contents>]?(?:[^\\]]+|\\[Ss]?)*)(?<closing>]?)$'),
      characterClassParts: /^(<opening>\[\^?)(<contents>]?(?:[^\\\]]+|\\[\S\s]?)*)(<closing>]?)$/,
      characterClassToken: /[^\\-]+|-|\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)/g,
      quantifier: /^(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??$/,
    };
    const type = {
      NONE: 0,
      RANGE_HYPHEN: 1,
      METACLASS: 2,
      ALTERNATOR: 3,
    };
    let output = '';
    let lastToken = {
      quantifiable: false,
      type: type.NONE,
    };
    let match;
    let m;
    let capturingGroupCount = 0;
    let groupStyleDepth = 0;
    const openGroups = [];

    function errorStr(str) {
      return `<b class="err">${str}</b>`;
    }

    function groupStyleStr(str, groupStyleDepth) {
      return `<b class="g${groupStyleDepth}">${str}</b>`;
    }

    function parseCharacterClass(val) {
      /* Character classes have their own syntax rules which are different (sometimes quite subtly)
       from surrounding regex syntax. Hence, they're treated as a single token and parsed separately. */

      let output2 = '';
      const parts = re.characterClassParts.exec(val);
      console.log(`parseCharacterClass ${val} parts = ${parts}`);
      // const parts = new XRegExp(re.characterClassParts, 'n').exec(val);
      const parser = re.characterClassToken;
      let lastToken2 = {
        rangeable: false,
        type: type.NONE,
      };
      let match2;
      let m2;
      if (parts !== null) {
        output2 += parts.closing ? parts.opening : errorStr(parts.opening);
        // } else {
        //   output2 += errorStr(val.charAt(0));
        // }

        // The characterClassToken regex does most of the tokenization grunt work
        match2 = parser.exec(parts.contents);
        console.log(match2);
        while (match2) {
          m2 = match2[0];
          // Escape
          if (m2.charAt(0) === '\\') {
            /* Inside character classes, browsers differ on how they handle the following:
             - Any representation of character index zero (\0, \00, \000, \x00, \u0000)
             - "\c", when not followed by A-Z or a-z
             - "\x", when not followed by two hex characters
             - "\u", when not followed by four hex characters
             However, although representations of character index zero within character classes don't work on their
             own in Firefox, they don't throw an error, they work when used with ranges, and it's highly unlikely
             that the user will actually have such a character in their test data, so such tokens are highlighted
             normally. The remaining metasequences are flagged as errors. */
            if (XRegExp.cache('^\\\\[cux]$').test(m2)) {
              output2 += errorStr(m2);
              lastToken2 = { rangeable: lastToken2.type !== type.RANGE_HYPHEN };
              // Metaclass (matches more than one character index)
            } else if (XRegExp.cache('^\\\\[dsw]$', 'i').test(m2)) {
              output2 += `<b>${m2}</b>`;
              /* Traditional regex behavior is that a metaclass should be unrangeable (RegexPal terminology).
               Hence, [-\dz], [\d-z], and [z-\d] should all be equivalent. However, at least some browsers
               handle this inconsistently. E.g., Firefox 2 throws an invalid range error for [z-\d] and [\d--]. */
              lastToken2 = {
                rangeable: lastToken2.type !== type.RANGE_HYPHEN,
                type: type.METACLASS,
              };
              // Unescaped "\" at the end of the regex
            } else if (m2 === '\\') {
              output2 += errorStr(m2);
              // Metasequence representing a single character index, or escaped literal character
            } else {
              output2 += "<b>" + m2.replace(XRegExp.cache('[<&>]'), '_') + "</b>";
              lastToken2 = {
                rangeable: lastToken2.type !== type.RANGE_HYPHEN,
                charCode: getTokenCharCode(m2),
              };
            }
            // Hyphen (might indicate a range)
          } else if (m2 === '-') {
            if (lastToken2.rangeable) {
              // Save the regex's lastIndex so we can reset it after checking the next token
              const lastIndex = parser.lastIndex;
              const nextToken = parser.exec(parts.contents);

              if (nextToken) {
                const nextTokenCharCode = getTokenCharCode(nextToken[0]);
                // Hypen for a reverse range (e.g., z-a) or metaclass (e.g., \d-x or x-\S)
                if (
                  (nextTokenCharCode !== false && lastToken2.charCode > nextTokenCharCode) ||
                  lastToken2.type === type.METACLASS ||
                  XRegExp.cache('^\\\\[dsw]$', 'i').test(nextToken[0])
                ) {
                  output2 += errorStr('-');
                  // Hyphen creating a valid range
                } else {
                  output2 += '<u>-</u>';
                }
                lastToken2 = {
                  rangeable: false,
                  type: type.RANGE_HYPHEN,
                };
              } else {
                // Hyphen at the end of a properly closed character class (literal character)
                if (parts.closing) {
                  output2 += '-'; // Since this is a literal, it's technically "rangeable," but that doesn't matter
                  // Hyphen at the end of an unclosed character class (i.e., the end of the regex)
                } else {
                  //output += errorStr("-"); // Previous RB handling
                  output2 += '<u>-</u>';
                  break; // Might as well break
                }
              }

              // Reset the regex's lastIndex so the next while loop iteration will continue appropriately
              parser.lastIndex = lastIndex2;
              // Hyphen at the beginning of a character class or after a non-rangeable token
            } else {
              output2 += '-';
              lastToken2 = { rangeable: lastToken2.type !== type.RANGE_HYPHEN };
            }
            // Literal character sequence
          } else {
            console.log(m2);
            output2 += m2.replace(XRegExp.cache('[<&>]', 'g'), '_');
            lastToken2 = {
              rangeable: (m2.length > 1 || lastToken2.type !== type.RANGE_HYPHEN),
              charCode: m2.charCodeAt(m2.length - 1),
            };
          }
          match2 = parser.exec(parts.contents);
        } // End characterClassToken loop

        output2 += parts.closing;
      } else {
        output2 += errorStr(val.charAt(0));
      }
      return output2;
    }

    // The regexToken regex does most of the tokenization grunt work
    match = re.regexToken.exec(value);
    while (match) {
      m = match[0];
      switch (m.charAt(0)) {
        // Character class
        case '[':
          output += '<i>' + parseCharacterClass(m) + '</i>';
          lastToken = { quantifiable: true };
          break;
        // Group opening
        case '(':
          // If this is an invalid group type, mark the error and don't count it towards group depth or total count
          if (m.length === 2) { // m is '(?'
            output += errorStr(m);
          } else {
            if (m.length === 1) capturingGroupCount++;
            groupStyleDepth = groupStyleDepth === 5 ? 1 : groupStyleDepth + 1;
            /* Record the group opening's position and character sequence so we can later mark it as invalid if
             it turns out to be unclosed in the remainder of the regex. The value of index is the position plus
             the length of the opening <b> element with group class ('<b class='gN'>'.length). */
            openGroups.push({
              index: output.length + 14,
              opening: m,
            });
            // Add markup to the group-opening character sequence
            output += groupStyleStr(m, groupStyleDepth);
          }
          lastToken = { quantifiable: false };
          break;
        // Group closing
        case ')':
          // If this is an invalid group closing
          if (!openGroups.length) {
            output += errorStr(')');
            lastToken = { quantifiable: false };
          } else {
            output += groupStyleStr(')', groupStyleDepth);
            /* Although at least in some browsers it is possible to quantify lookaheads, this adds no value
             and is an error with some regex flavors such as PCRE, so flag them as unquantifiable. */
            lastToken = {
              quantifiable: !XRegExp.cache('^[=!]').test(openGroups[openGroups.length - 1].opening.charAt(2)),
              style: `g${groupStyleDepth}`,
            };
            groupStyleDepth = groupStyleDepth === 1 ? 5 : groupStyleDepth - 1;
            // Drop the last opening paren from depth tracking
            openGroups.pop();
          }
          break;
        // Escape or backreference
        case '\\':
          // Backreference or octal character code without a leading zero
          if (XRegExp.cache('^[1-9]').test(m.charAt(1))) {
            /* What does '\10' mean?
             - Backreference 10, if 10 or more capturing groups were opened before this point.
             - Backreference 1 followed by '0', if 1-9 capturing groups were opened before this point.
             - Otherwise, it's octal character index 10 (since 10 is inside the octal range 0-377).

             In the case of \8 or \9 when as many capturing groups weren't opened before this point, they're
             highlighted as special tokens. However, they should probably be marked as errors since the handling
             is browser-specific. E.g., in Firefox 2 they seem to be equivalent to '(?!)', while in IE 7 they
             match the literal characters '8' and '9', which is correct handling. I don't mark them as errors
             because it would seem inconsistent to users who don't understand the highlighting rules for octals,
             etc. In fact, octals are not included in ECMA-262v3, but since all the big browsers support them
             and RegexPal does not implement its own regex engine, it needs to highlight the regex as the
             browsers interpret them. */
            let nonBackrefDigits = '';
            let num = +m.slice(1);
            while (num > capturingGroupCount) {
              nonBackrefDigits = XRegExp.cache('[0-9]$').exec(num)[0] + nonBackrefDigits;
              num = Math.floor(num / 10); // Drop the last digit
            }
            if (num > 0) {
              output += `<b>\\${num}</b>${nonBackrefDigits}`;
            } else {
              const parts = XRegExp.cache('^\\\\([0-3][0-7]{0,2}|[4-7][0-7]?|[89])([0-9]*)').exec(m);
              output += '<b>\\' + parts[1] + '</b>' + parts[2];
            }
            // Metasequence
          } else if (XRegExp.cache('^[0bBcdDfnrsStuvwWx]').test(m.charAt(1))) {
            /* Browsers differ on how they handle:
             - '\c', when not followed by A-Z or a-z
             - '\x', when not followed by two hex characters
             - '\u', when not followed by four hex characters
             Hence, such metasequences are flagged as errors. */
            if (XRegExp.cache('^\\\\[cux]$').test(m)) {
              output += errorStr(m);
              lastToken = { quantifiable: false };
              break;
            }
            output += `<b>${m}</b>`;
            // Non-quantifiable metasequence
            if ('bB'.indexOf(m.charAt(1)) > -1) {
              lastToken = { quantifiable: false };
              break;
            }
            // Unescaped '\' at the end of the regex
          } else if (m === '\\') {
            output += errorStr(m);
            // Escaped literal character
          } else {
            output += m.replace(XRegExp.cache('[<&>]'), '_');
          }
          lastToken = { quantifiable: true };
          break;
        // Not a character class, group opening/closing, escape sequence, or backreference
        default:
          // Quantifier
          if (re.quantifier.test(m)) {
            if (lastToken.quantifiable) {
              const interval = XRegExp.cache('^\\{([0-9]+)(?:,([0-9]*))?').exec(m);
              // Interval quantifier in reverse numeric order or out of range
              if (interval &&
                (
                  (interval[1] > 65535) ||
                  (
                    interval[2] &&
                    ((interval[2] > 65535) || (+interval[1] > +interval[2]))
                  )
                )
              ) {
                output += errorStr(m);
              } else {
                // Quantifiers for groups are shown in the style of the (preceeding) group's depth
                output += (lastToken.style ? '<b class="' + lastToken.style + '">' : '<b>') + m + '</b>';
              }
            } else {
              output += errorStr(m);
            }
            lastToken = { quantifiable: false };
            // Vertical bar (alternator)
          } else if (m === '|') {
            /* If there is a vertical bar at the very start of the regex, flag it as an error since it
             effectively truncates the regex at that point. If two top-level vertical bars are next to
             each other, flag it as an error for similar reasons. These behaviors copied from RegexBuddy. */
            if (lastToken.type === type.NONE || (lastToken.type === type.ALTERNATOR && !openGroups.length)) {
              output += errorStr(m);
            } else {
              // Alternators within groups are shown in the style of the (containing) group's depth
              output += openGroups.length ? groupStyleStr('|', groupStyleDepth) : '<b>|</b>';
            }
            lastToken = {
              quantifiable: false,
              type: type.ALTERNATOR
            };
            // ^ or $ anchor
          } else if ('^$'.indexOf(m) > -1) {
            output += `<b>${m}</b>`;
            lastToken = { quantifiable: false };
            // Dot (.)
          } else if (m === '.') {
            output += '<b>.</b>';
            lastToken = { quantifiable: true };
            // Literal character sequence
          } else {
            output += m.replace(XRegExp.cache('[<&>]', 'g'), '_');
            lastToken = { quantifiable: true };
          }
        // End default case
      } // End switch m.charAt(0)

      match = re.regexToken.exec(value);
    }

    return output;
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
    const srcEl = e.srcElement || e.target;
    switch (srcEl) {
      case this.regexField.getTextarea():
        // Since the textbox's value doesn't change until the keydown event finishes, run the match after 0ms
        // setTimeout(() => {this.highlightSearchSyntax();}, 0);
        break;
      // There might be other elements to handle in the future (e.g., replacement)
      default:
    }
    this._testKeyHold(e);

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
    // const srcEl = evt.srcElement || evt.target;
    this._keydownCount = 0; // Reset
    if (this._matchOnKeyUp) {
      this._matchOnKeyUp = false; // Reset
      console.log('onkeyup');
    }
    this.highlightMatches();
    // this.highlightSearchSyntax();
  }

  _testKeyHold(e) {
    const srcEl = e.srcElement || e.target;
    this._keydownCount++;
    /* If this is the third keydown before a keyup fires, remove real-time matches until keyup. Allowing a
     couple keydowns before removing the matches offers a balanace between reducing performance issues when
     holding down keys, and keeping performance up for fast typists. */
    if (this._keydownCount > 2) {
      this.regexField.clearBg();
      this._matchOnKeyUp = true;
    } else {
      /* Since we're running this on keydown but the textbox's value doesn't change until code for the
       event finishes, run the match after 0ms as a workaround. */
      switch (srcEl) {
        case this.regexField.getTextarea(): // fallthru
        case this.dataField.getTextarea():
          setTimeout(this.highlightMatches(), 0);
          break;
        default:
        // There might be other elements to handle in the future
      }
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

export default RegexPage;
