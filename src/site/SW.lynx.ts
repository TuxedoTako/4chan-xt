import $ from "../platform/$";
import $$ from "../platform/$$"
import { g, Conf, d, doc } from "../globals/globals";
import { isEscaped } from "../globals/jsx";
import { dict } from "../platform/helpers";

const SwLynx = {
  isOPContainerThread: true,

  disabledFeatures: [
    'Resurrect Quotes',
    'Quick Reply Personas',
    'Quick Reply',
    'Cooldown',
    'Report Link',
    'Delete Link',
    'Edit Link',
    'Quote Inlining',
    'Quote Previewing',
    'Quote Backlinks',
    'File Info Formatting',
    'Image Expansion',
    'Image Expansion (Menu)',
    'Comment Expansion',
    'Thread Expansion',
    'Favicon',
    'Quote Threading',
    'Thread Updater',
    'Banner',
    'Flash Features',
    'Reply Pruning'
  ],

  detect() {
    if($$('#settingsMenu.floatingMenu') && $$('#watchedMenu.floatingMenu')) {
      const properties = dict();
      properties.root = location.origin + '/';
      return properties;
    }

    return false;
  },

  urls: {
    thread({ siteID, boardID, threadID }, isArchived) {
      return `${Conf['siteProperties'][siteID]?.root || `http://${siteID}/`}${boardID}/res/${threadID}.html`;
    },
    post({ postID }) { return `#${postID}`; },
    index({ siteID, boardID }) { return `${Conf['siteProperties'][siteID]?.root || `http://${siteID}/`}${boardID}/`; },
    catalog({ siteID, boardID }) { return `${Conf['siteProperties'][siteID]?.root || `http://${siteID}/`}${boardID}/catalog.html`; },
    threadJSON({ siteID, boardID, threadID }, isArchived) {
      const root = Conf['siteProperties'][siteID]?.root;
      if (root) { return `${root}${boardID}/res/${threadID}.json`; } else { return ''; }
    },
    catalogJSON({ siteID, boardID }) {
      const root = Conf['siteProperties'][siteID]?.root;
      if (root) { return `${root}${boardID}/catalog.json`; } else { return ''; }
    },
    file({ siteID, boardID }, filename) {
      return `${Conf['siteProperties'][siteID]?.root || `http://${siteID}/`}${boardID}/${filename}`;
    },
    thumb(board, filename) {
      return SwLynx.urls.file(board, filename);
    },
  },

  selectors: {
    thread: '#divThreads',
    // threadDivider
    summary: '.labelOmission',
    postContainer: '.postCell',
    replyOriginal: '.postCell',
    opBottom: '.innerOP',
    infRoot: '.opHead',
    info: {
      subject: '.labelSubject',
      name: '.linkName',
      // email
      // tripcode
      uniqueID: '.spanId',
      // flag
      date: '.labelCreated',
      quote: 'a.quoteLink',
      // reply
    },
    icons: {
      isSticky: '.pinIndicator',
      isClosed: '.lockIndicator'
    },
    file: {
      text: '.uploadDetails',
      link: '.originalNameLink',
      thumb: '.imgLink > img:not(.imgExpanded)'
    },
    thumbLink: '.imgLink',
    multifile: '.uploadCell',
    highlightable: {
      op: '.innerOP',
      reply: '.innerPost',
    },
    comment: '.divMessage',
    spoiler: '.spoiler',
    quotelink: '.quoteLink',
    catalog: {
      board: '.divThreads',
      thread: '.catalogCell',
      thumb: '.linkThumb',
    },
    boardList: '#navTopBoardsSpan',
    boardListBottom: '#navBottomBoardsSpan', // don't know if this exists
    styleSheet: '#themeLink',
    searchBox: '#catalogSearchField',
    nav: {
      prev: '#linkPrevious',
      next: '#linkNext',
    },
  },

  classes: {
    highlight: 'markedPost'
  },

  xpath: {
    thread: 'div[contains(concat(" ",@class," ")," thread ")]',
    postContainer: 'div[contains(@class,"postCell")]',
    replyContainer: 'div[contains(@class,"postCell")]'
  },

  regexp: {
    quotelink: new RegExp(`/([^/]+)/res/(\\d+)(?:\\.\\w+)?#(\\d+)$`),
    quotelinkHTML:
      /<a [^>]*\bhref="[^"]*\/([^\/]+)\/res\/(\d+)(?:\.\w+)?#(\d+)"/g
  },

  Build: {
    parseJSON(data, { siteID, boardID }) {
      const o = {
        // id
        ID: data.id,
        postID: data.postId,
        threadID: data.threadId || data.no,
        boardID,
        siteID,
        isReply: !!data.threadId,
        // thread status
        isSticky: !!data.pinned,
        isClosed: !!data.closed,
        isArchived: !!data.archived,
        threadReplies: data.omittedPosts,
        threadImages: data.omittedFiles,
        // file status
        // fileDeleted: !!data.filedeleted,
        // filesDeleted: data.filedeleted ? [0] : [],
        info: {
          subject: $.unescape(data.subject),
          email: $.unescape(data.email),
          name: $.unescape(data.name) || '',
          // tripcode: data.trip,
          // pass: (data.since4pass != null) ? `${data.since4pass}` : undefined,
          uniqueID: data.id,
          // flagCode: data.country,
          // flagCodeTroll: data.board_flag,
          // flag: $.unescape((data.country_name || data.flag_name)),
          dateUTC: data.creation,
          dateText: data.creation,
          // Yes, we use the raw string here
          commentHTML: { innerHTML: data.markdown || '', [isEscaped]: true }
        },
        files: [],
      };
      // if (data.capcode) {
      //   o.info.capcode = data.capcode.replace(/_highlight$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      //   o.capcodeHighlight = /_highlight$/.test(data.capcode);
      //   delete o.info.uniqueID;
      // }
      // o.files = [];
      o.files = data.files.map(f => this.parseJSONFile(f, { siteID, boardID }));

      return o;
    },
    parseJSONFile(data, { siteID, boardID }) {
      const site = g.sites[siteID];
      // const filename = (site.software === 'yotsuba') && (boardID === 'f') ?
      //   `${encodeURIComponent(data.filename)}${data.ext}`
      //   :
      //   `${data.tim}${data.ext}`;
      const o = {
        name: data.originalName,
        url: site.urls.file({ siteID, boardID }, data.path),
        height: data.height,
        width: data.width,
        // MD5: data.md5,
        size: $.bytesToString(data.size),
        thumbURL: site.urls.thumb({ siteID, boardID }, data.thumb),
        // theight: data.tn_h,
        // twidth: data.tn_w,
        isSpoiler: data.thumb.match(/^\/\w+\/custom\.spoiler$/),
        // tag: data.tag,
        // hasDownscale: !!data.m_img
      };
      // if ((data.h != null) && !/\.pdf$/.test(o.url)) { o.dimensions = `${o.width}x${o.height}`; }
      return o;
    },
  },

  isFileURL(url) {
    return url.pathname.startsWith('/.media/')
  },

  bgColoredEl() {
    return $.el('div', { className: '.innerPost' });
  },

  // parseFile(post, file) {
  //   let info, infoNode;
  //   const { text, link, thumb } = file;
  //   if ($.x(`ancestor::${this.xpath.postContainer}[1]`, text) !== post.nodes.root) { return false; } // file belongs to a reply
  //   if (!(infoNode = link.nextSibling?.textContent.includes('(') ? link.nextSibling : link.nextElementSibling)) { return false; }
  //   if (!(info = infoNode.textContent.match(/\((.*,\s*)?([\d.]+ ?[KMG]?B).*\)/))) { return false; }
  //   const nameNode = $('.postfilename', text);
  //   $.extend(file, {
  //     name: nameNode ? (nameNode.title || nameNode.textContent) : link.pathname.match(/[^/]*$/)[0],
  //     size: info[2],
  //     dimensions: info[0].match(/\d+x\d+/)?.[0]
  //   });
  //   if (thumb) {
  //     $.extend(file, {
  //       thumbURL: /\/static\//.test(thumb.src) && $.isImage(link.href) ? link.href : thumb.src,
  //       isSpoiler: /^Spoiler/i.test(info[1] || '') || (link.textContent === 'Spoiler Image')
  //     }
  //     );
  //   }
  //   return true;
  // },
}
export default SwLynx;