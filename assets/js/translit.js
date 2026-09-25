/* translit.js — English (phonetic) ⇄ Telugu Unicode transliteration engine
   TeluguFontStyle.co.in — runs 100% in the browser, nothing is sent anywhere.

   Scheme (RTS / Lekhini style, the one most Telugu typists already know):
     Vowels   a aa/A i ii/ee/I u uu/oo/U Ru e E ai o O au
     Stops    k kh g gh | c/ch Ch/chh j jh | T Th D Dh N | t th d dh n | p ph/f b bh m
     Others   y r l L v/w S/sh Sh s h x/ksh
     Signs    M = ం (sunna)   H = ః (visarga)   ~ = virama without vowel   . = full stop
*/
(function (global) {
  'use strict';

  var VIRAMA = '\u0C4D';

  /* Independent vowel , dependent sign (matra) */
  var VOWELS = [
    ['aa', 'ఆ', 'ా'], ['A', 'ఆ', 'ా'],
    ['ai', 'ఐ', 'ై'], ['au', 'ఔ', 'ౌ'], ['ou', 'ఔ', 'ౌ'],
    ['ii', 'ఈ', 'ీ'], ['ee', 'ఈ', 'ీ'], ['I', 'ఈ', 'ీ'],
    ['uu', 'ఊ', 'ూ'], ['oo', 'ఊ', 'ూ'], ['U', 'ఊ', 'ూ'],
    ['Ru', 'ఋ', 'ృ'], ['RU', 'ౠ', 'ౄ'],
    ['E', 'ఏ', 'ే'], ['O', 'ఓ', 'ో'],
    ['a', 'అ', ''], ['i', 'ఇ', 'ి'], ['u', 'ఉ', 'ు'], ['e', 'ఎ', 'ె'], ['o', 'ఒ', 'ొ']
  ];

  var CONSONANTS = [
    ['ksh', 'క్ష'], ['chh', 'ఛ'], ['Ch', 'ఛ'],
    ['kh', 'ఖ'], ['gh', 'ఘ'], ['ch', 'చ'], ['jh', 'ఝ'],
    ['Th', 'ఠ'], ['Dh', 'ఢ'], ['th', 'థ'], ['dh', 'ధ'],
    ['ph', 'ఫ'], ['bh', 'భ'], ['Sh', 'ష'], ['sh', 'శ'],
    ['~n', 'ఞ'], ['~g', 'ఙ'],
    ['K', 'ఖ'], ['G', 'ఘ'], ['J', 'ఝ'], ['P', 'ఫ'], ['B', 'భ'],
    ['k', 'క'], ['g', 'గ'], ['c', 'చ'], ['j', 'జ'],
    ['T', 'ట'], ['D', 'డ'], ['N', 'ణ'],
    ['t', 'త'], ['d', 'ద'], ['n', 'న'],
    ['p', 'ప'], ['f', 'ఫ'], ['b', 'బ'], ['m', 'మ'],
    ['y', 'య'], ['r', 'ర'], ['R', 'ఱ'], ['l', 'ల'], ['L', 'ళ'],
    ['v', 'వ'], ['w', 'వ'], ['S', 'శ'], ['s', 'స'], ['h', 'హ'], ['x', 'క్ష'],
    ['z', 'జ'], ['q', 'క']
  ];

  /* Common words typed casually — checked before phonetic rules */
  var WORDS = {
    'namaste': 'నమస్తే', 'namaskaram': 'నమస్కారం', 'namaskaaram': 'నమస్కారం',
    'telugu': 'తెలుగు', 'andhra': 'ఆంధ్ర', 'telangana': 'తెలంగాణ', 'hyderabad': 'హైదరాబాద్',
    'india': 'భారత్', 'bharat': 'భారత్', 'bharatha': 'భారత',
    'sankranti': 'సంక్రాంతి', 'sankranthi': 'సంక్రాంతి', 'ugadi': 'ఉగాది', 'dasara': 'దసరా',
    'deepavali': 'దీపావళి', 'diwali': 'దీపావళి', 'bathukamma': 'బతుకమ్మ', 'vinayaka': 'వినాయక',
    'prema': 'ప్రేమ', 'love': 'ప్రేమ', 'amma': 'అమ్మ', 'nanna': 'నాన్న', 'anna': 'అన్న',
    'akka': 'అక్క', 'thammudu': 'తమ్ముడు', 'chelli': 'చెల్లి', 'friend': 'స్నేహితుడు',
    'sneham': 'స్నేహం', 'illu': 'ఇల్లు', 'pelli': 'పెళ్లి', 'bangaram': 'బంగారం',
    'jai': 'జై', 'sri': 'శ్రీ', 'shri': 'శ్రీ', 'sree': 'శ్రీ', 'rama': 'రామ', 'ram': 'రామ్',
    'krishna': 'కృష్ణ', 'sita': 'సీత', 'hanuman': 'హనుమాన్', 'venkateswara': 'వెంకటేశ్వర',
    'subhakankshalu': 'శుభాకాంక్షలు', 'shubhakankshalu': 'శుభాకాంక్షలు',
    'dhanyavadalu': 'ధన్యవాదాలు', 'thanks': 'ధన్యవాదాలు', 'santosham': 'సంతోషం',
    'andamaina': 'అందమైన', 'jeevitham': 'జీవితం', 'kutumbam': 'కుటుంబం', 'guru': 'గురు',
    'happy': 'హ్యాపీ', 'birthday': 'బర్త్‌డే', 'welcome': 'స్వాగతం', 'swagatam': 'స్వాగతం',
    'nenu': 'నేను', 'meeru': 'మీరు', 'manam': 'మనం', 'avunu': 'అవును', 'kaadu': 'కాదు'
  };

  function matchAt(list, s, i) {
    for (var k = 0; k < list.length; k++) {
      var key = list[k][0];
      if (s.substr(i, key.length) === key) return list[k];
    }
    return null;
  }

  /* Consonants that turn a preceding n / m into sunna (ం) */
  var SUNNA_BEFORE = /^(k|kh|g|gh|c|ch|chh|j|jh|T|Th|D|Dh|t|th|d|dh|s|S|sh|Sh|x|ksh|f|ph|p|b|bh)/;

  function wordToTelugu(word) {
    if (!word) return '';
    var lw = word.toLowerCase();
    if (WORDS.hasOwnProperty(lw)) return WORDS[lw];
    /* "Ravi", "Hyderabad" — a capitalised name is not a request for ఱ / హ-variants */
    if (/^[A-Z][a-z]+$/.test(word) || /^[A-Z]{2,}$/.test(word)) word = lw;
    /* capitals that have no special meaning in the scheme are treated as lowercase */
    word = word.replace(/[FQVWXYZ]/g, function (c) { return c.toLowerCase(); });

    var out = '';
    var i = 0;
    var afterConsonant = false;
    var len = word.length;

    while (i < len) {
      /* explicit sunna / visarga / virama */
      var ch = word[i];
      if (ch === 'M') { out += 'ం'; afterConsonant = false; i++; continue; }
      if (ch === 'H') { out += 'ః'; afterConsonant = false; i++; continue; }
      if (ch === '~' && word[i + 1] !== 'n' && word[i + 1] !== 'g') {
        if (afterConsonant) out += VIRAMA;
        afterConsonant = false; i++; continue;
      }

      /* casual sunna: vowel + n/m + stop consonant  (sundaram, pandaga, santosham) */
      if ((ch === 'n' || ch === 'm') && !afterConsonant && i > 0 && SUNNA_BEFORE.test(word.slice(i + 1))) {
        out += 'ం'; i++; continue;
      }
      /* casual sunna: word-final "am" in longer words (santosham, prapancham) */
      if (ch === 'm' && i === len - 1 && i >= 4 && !afterConsonant && word[i - 1] === 'a' && word[i - 2] !== 'a') {
        out += 'ం'; i++; continue;
      }

      var v = matchAt(VOWELS, word, i);
      if (v) {
        /* word-final short e / o are almost always long in Telugu (namaste → నమస్తే, lo → లో) */
        if (afterConsonant && i === len - 1 && (v[0] === 'e' || v[0] === 'o')) v = matchAt(VOWELS, v[0].toUpperCase(), 0);
        out += afterConsonant ? v[2] : v[1];
        afterConsonant = false;
        i += v[0].length;
        continue;
      }
      var c = matchAt(CONSONANTS, word, i);
      if (c) {
        if (afterConsonant) out += VIRAMA;
        out += c[1];
        afterConsonant = true;
        i += c[0].length;
        continue;
      }
      /* anything else (digits, punctuation) */
      if (afterConsonant) { out += VIRAMA; afterConsonant = false; }
      out += ch === '.' ? '.' : ch;
      i++;
    }
    if (afterConsonant) out += VIRAMA;
    return out;
  }

  function toTelugu(text) {
    if (!text) return '';
    return String(text).replace(/[A-Za-z~]+/g, function (w) { return wordToTelugu(w); });
  }

  /* ── Telugu → Latin (simple phonetic romanisation) ── */
  var R_IND = {
    'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo', 'ఋ': 'ru', 'ౠ': 'roo',
    'ఎ': 'e', 'ఏ': 'e', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'o', 'ఔ': 'au'
  };
  var R_CONS = {
    'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng', 'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
    'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n', 'త': 't', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
    'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm', 'య': 'y', 'ర': 'r', 'ఱ': 'r', 'ల': 'l', 'ళ': 'l',
    'వ': 'v', 'శ': 'sh', 'ష': 'sh', 'స': 's', 'హ': 'h', 'ౘ': 'ts', 'ౙ': 'dz'
  };
  var R_MATRA = {
    'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru', 'ౄ': 'roo',
    'ె': 'e', 'ే': 'e', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au'
  };
  var R_DIGIT = { '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9' };

  function toLatin(text) {
    if (!text) return '';
    var s = String(text), out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], nx = s[i + 1];
      if (R_CONS[ch]) {
        out += R_CONS[ch];
        if (nx === VIRAMA) { i++; }
        else if (R_MATRA[nx]) { out += R_MATRA[nx]; i++; }
        else { out += 'a'; }
      } else if (R_IND[ch]) out += R_IND[ch];
      else if (R_MATRA[ch]) out += R_MATRA[ch];
      else if (ch === 'ం') out += (!nx || /[పఫబభమ\s]/.test(nx) || !R_CONS[nx]) ? 'm' : 'n';
      else if (ch === 'ః') out += 'h';
      else if (ch === 'ఁ') out += 'n';
      else if (R_DIGIT[ch]) out += R_DIGIT[ch];
      else if (ch === VIRAMA || ch === '\u200C' || ch === '\u200D') { /* skip */ }
      else out += ch;
    }
    return out;
  }

  function hasTelugu(text) { return /[\u0C00-\u0C7F]/.test(text || ''); }

  global.TeluguTranslit = { toTelugu: toTelugu, wordToTelugu: wordToTelugu, toLatin: toLatin, hasTelugu: hasTelugu, WORDS: WORDS };
})(typeof window !== 'undefined' ? window : this);
