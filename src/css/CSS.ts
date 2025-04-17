// cSpell:ignore installGentoo, webfont

import $ from '../platform/$';

import burichan from './burichan.css';
import futaba from './futaba.css';
import linkifyAudio from './linkify.audio.png';
import linkifyBitchute from './linkify.bitchute.png';
import linkifyClyp from './linkify.clyp.png';
import linkifyDailymotion from './linkify.dailymotion.png';
import linkifyGfycat from './linkify.gfycat.png';
import linkifyGist from './linkify.gist.png';
import linkifyImage from './linkify.image.png';
import linkifyInstallgentoo from './linkify.installgentoo.png';
import linkifyLiveleak from './linkify.liveleak.png';
import linkifyPastebin from './linkify.pastebin.png';
import linkifyPeertube from './linkify.peertube.png';
import linkifySoundcloud from './linkify.soundcloud.png';
import linkifyStreamable from './linkify.streamable.png';
import linkifyTwitchtv from './linkify.twitchtv.png';
import linkifyX from './linkify.x.png';
import linkifyVideo from './linkify.video.png';
import linkifyVidlii from './linkify.vidlii.png';
import linkifyVimeo from './linkify.vimeo.png';
import linkifyVine from './linkify.vine.png';
import linkifyVocaroo from './linkify.vocaroo.png';
import linkifyYoutube from './linkify.youtube.png';

import variableBase from './variableBase.css';
import photon from './photon.css';
import report from './report.css';
import spooky from './spooky.css';
import style from './style.css';
import tomorrow from './tomorrow.css';
import www from './www.css';
import yotsubaB from './yotsuba-b.css';
import yotsuba from './yotsuba.css';
import { icons } from './style';
import { g } from '../globals/globals';
import iconCss from '../Icons/icons.css';

import fxTwitterCss from '../Linkification/Embedding/FxTwitter.css';

const mainCSS = style + variableBase + yotsuba +yotsubaB+futaba+burichan+tomorrow + photon + spooky + iconCss + fxTwitterCss;
const faIcons: { name: string, data: string }[] = [
  { name: "audio", data: linkifyAudio },
  { name: "bitchute", data: linkifyBitchute },
  { name: "clyp", data: linkifyClyp },
  { name: "dailymotion", data: linkifyDailymotion },
  { name: "gfycat", data: linkifyGfycat },
  { name: "gist", data: linkifyGist },
  { name: "image", data: linkifyImage },
  { name: "installgentoo", data: linkifyInstallgentoo },
  { name: "liveleak", data: linkifyLiveleak },
  { name: "pastebin", data: linkifyPastebin },
  { name: "peertube", data: linkifyPeertube },
  { name: "soundcloud", data: linkifySoundcloud },
  { name: "streamable", data: linkifyStreamable },
  { name: "twitchtv", data: linkifyTwitchtv },
  { name: "twitter", data: linkifyX },
  { name: "video", data: linkifyVideo },
  { name: "vidlii", data: linkifyVidlii },
  { name: "vimeo", data: linkifyVimeo },
  { name: "vine", data: linkifyVine },
  { name: "vocaroo", data: linkifyVocaroo },
  { name: "youtube", data: linkifyYoutube },
];

const CSS = {

  boards: mainCSS + icons(faIcons),

  report,

  www,

  sub: function(css: string) {
    var variables = {
      site: g.SITE.selectors
    };
    return css.replace(/\$[\w\$]+/g, function(name) {
      var words = name.slice(1).split('$');
      var sel = variables;
      for (var i = 0; i < words.length; i++) {
        if (typeof sel !== 'object') return ':not(*)';
        sel = $.getOwn(sel, words[i]);
      }
      if (typeof sel !== 'string') return ':not(*)';
      return sel;
    });
  }

};

export default CSS;
