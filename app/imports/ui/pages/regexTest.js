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

import { Template } from 'meteor/templating';
import RegexPage from '/imports/api/regex/RegexPage';
import SmartField from '/imports/api/field/SmartField';
import './regexTest.html';

Template.regexTest.helpers({
  // add you helpers here
});

Template.regexTest.events({
  // add your events here
});

Template.regexTest.onCreated(function () {
  // add your statement here
});

Template.regexTest.onRendered(function () {
  // add your statement here
  // const search = new SmartField('search');
  // const input = new SmartField('input');
  const page = new RegexPage();
  // console.log(search);
});

Template.regexTest.onDestroyed(function () {
  // add your statement here
});

