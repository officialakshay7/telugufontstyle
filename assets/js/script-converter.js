/* script-converter.js — convert text between Telugu and other Indian scripts.
   TeluguFontStyle.co.in — runs entirely in the browser.
   Indian scripts in Unicode share the same internal layout (inherited from ISCII), so most letters
   convert by position. Letters a target script does not have use the closest available letter. */
(function (global) {
  'use strict';
  var BASE = { deva: 0x0900, beng: 0x0980, guru: 0x0A00, gujr: 0x0A80, orya: 0x0B00, taml: 0x0B80, telu: 0x0C00, knda: 0x0C80, mlym: 0x0D00 };
  /* 1 = code point assigned in that script (Unicode 15), index = offset 0x00–0x7F */
  var ASSIGNED = {
    deva: '11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
    beng: '11110111111110011001111111111111111111111011111110100011110011111111100110011110000000010000110111110011111111111111111111111110',
    guru: '01110111111000011001111111111111111111111011111110110110110010111110000110011100010000000111101000000011111111111111111000000000',
    gujr: '01110111111111011101111111111111111111111011111110110111110011111111110111011100100000000000000011110011111111111100000001111111',
    orya: '01110111111110011001111111111111111111111011111110110111110011111111100110011100000001110000110111110011111111111111111100000000',
    taml: '00110111111000111011110001101011000110001110001111111111110000111110001110111100100000010000000000000011111111111111111111100000',
    telu: '11111111111110111011111111111111111111111011111111111111110011111111101110111100000001101110010011110011111111110000000111111111',
    knda: '11111111111110111011111111111111111111111011111111110111110011111111101110111100000001100000011011110011111111110111000000000000',
    mlym: '11111111111110111011111111111111111111111111111111111111111111111111101110111111000011111111111111110011111111111111111111111111'
  };
  var DRAVIDIAN = { telu: 1, knda: 1, taml: 1, mlym: 1 };
  var VIRAMA = 0x4D;

  /* offset → list of fallback offsets (tried in order) when the target lacks a letter */
  var FALLBACK = {
    0x00: [0x01, 0x02], 0x01: [0x02],
    0x0E: [0x0F], 0x12: [0x13], 0x46: [0x47], 0x4A: [0x4B],
    0x31: [0x30], 0x33: [0x32], 0x34: [0x33, 0x32], 0x35: [0x2C],
    0x37: [0x36, 0x38], 0x36: [0x38], 0x19: [0x28], 0x1E: [0x28], 0x23: [0x28],
    0x16: [0x15], 0x17: [0x15], 0x18: [0x15], 0x1B: [0x1A], 0x1D: [0x1C],
    0x20: [0x1F], 0x21: [0x1F], 0x22: [0x1F], 0x25: [0x24], 0x26: [0x24], 0x27: [0x24],
    0x2B: [0x2A], 0x2C: [0x2A], 0x2D: [0x2A], 0x39: [0x15],
    0x10: [0x0F], 0x14: [0x13], 0x48: [0x47], 0x4C: [0x4B],
    0x3D: [], 0x3C: [], 0x03: []
  };
  /* sequences for letters that need more than one code point in the target */
  var SEQ = {
    0x0B: [0x30, 0x41], 0x60: [0x30, 0x42],                 /* ṛ ṝ → ra + u / uu */
    0x43: [VIRAMA, 0x30, 0x41], 0x44: [VIRAMA, 0x30, 0x42]  /* ృ ౄ signs → virama + ra + u */
  };
  /* script-specific letters outside the shared layout: [script, offset] → base offsets */
  var SPECIAL = {
    'telu:58': [0x1A], 'telu:59': [0x1C], 'telu:5A': [0x31], 'telu:5D': [0x28, VIRAMA],
    'knda:5D': [0x28, VIRAMA], 'knda:5E': [0x34],
    'beng:4E': [0x24, VIRAMA], 'beng:70': [0x30], 'beng:71': [0x2C],
    'guru:70': [0x02], 'guru:71': [], 'guru:72': [0x05], 'guru:73': [0x09], 'guru:75': [0x2F],
    'orya:71': [0x35], 'gujr:79': [],
    'mlym:7A': [0x23, VIRAMA], 'mlym:7B': [0x28, VIRAMA], 'mlym:7C': [0x30, VIRAMA],
    'mlym:7D': [0x32, VIRAMA], 'mlym:7E': [0x33, VIRAMA], 'mlym:7F': [0x15, VIRAMA], 'mlym:54': [0x2E, VIRAMA],
    'mlym:55': [0x2F, VIRAMA], 'mlym:56': [0x34, VIRAMA]
  };
  /* precomposed nukta letters — split into base + nukta before converting */
  var DECOMPOSE = /[\u0958-\u095F\u09DC\u09DD\u09DF\u0A33\u0A36\u0A59-\u0A5B\u0A5E\u0B5C\u0B5D]/g;

  function has(script, off) { return off >= 0 && off < 0x80 && ASSIGNED[script].charAt(off) === '1'; }

  function scriptOf(cp) {
    for (var k in BASE) if (cp >= BASE[k] && cp < BASE[k] + 0x80) return k;
    return null;
  }

  /* Telugu/Kannada short e and o: north-Indian readers expect the ordinary e/o letters */
  var NORTH = { deva: 1, beng: 1, gujr: 1, guru: 1, orya: 1 };
  var SHORT_TO_LONG = { 0x0E: 0x0F, 0x12: 0x13, 0x46: 0x47, 0x4A: 0x4B };

  function emit(target, off) {
    /* returns string for one offset in target script, with fallbacks */
    if (NORTH[target] && SHORT_TO_LONG[off]) off = SHORT_TO_LONG[off];
    if (off === 0x3C && DRAVIDIAN[target]) return ''; /* nukta is not used in South Indian scripts */
    if (target === 'taml' && off === 0x02) return String.fromCharCode(BASE.taml + 0x2E, BASE.taml + VIRAMA); /* ం → ம் */
    if (has(target, off)) return String.fromCharCode(BASE[target] + off);
    if (SEQ[off]) {
      var seq = SEQ[off], r = '';
      for (var i = 0; i < seq.length; i++) r += emit(target, seq[i]);
      return r;
    }
    var fb = FALLBACK[off] || [];
    for (var j = 0; j < fb.length; j++) if (has(target, fb[j])) return String.fromCharCode(BASE[target] + fb[j]);
    return '';
  }

  function convert(text, target) {
    if (!text || !BASE[target]) return text || '';
    text = String(text).replace(DECOMPOSE, function (c) { return c.normalize('NFD'); });
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var cp = text.charCodeAt(i), src = scriptOf(cp);
      if (!src) { out += text[i]; continue; }
      var off = cp - BASE[src];
      if (src === target) { out += text[i]; continue; }
      if (off === 0x64 || off === 0x65) { /* danda / double danda */
        out += DRAVIDIAN[target] ? '.' : String.fromCharCode(0x0964 + (off - 0x64));
        continue;
      }
      var key = src + ':' + off.toString(16).toUpperCase();
      if (SPECIAL[key]) {
        var sp = SPECIAL[key];
        for (var s = 0; s < sp.length; s++) out += emit(target, sp[s]);
        continue;
      }
      if (off >= 0x70 && !(off >= 0x66 && off <= 0x6F)) { out += text[i]; continue; } /* script-only symbols */
      if (off >= 0x58 && off <= 0x5F) { out += text[i]; continue; }
      out += emit(target, off);
    }
    return out;
  }

  function detect(text) {
    var counts = {};
    for (var i = 0; i < (text || '').length; i++) { var s = scriptOf(text.charCodeAt(i)); if (s) counts[s] = (counts[s] || 0) + 1; }
    var best = null; for (var k in counts) if (!best || counts[k] > counts[best]) best = k;
    return best;
  }

  global.IndicScript = { convert: convert, detect: detect, BASE: BASE };
})(typeof window !== 'undefined' ? window : this);
