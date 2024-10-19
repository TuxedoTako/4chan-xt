import { Conf } from "../globals/globals";
import $$ from "../platform/$$"

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
    return !!($$('#settingsMenu.floatingMenu') && $$('#watchedMenu.floatingMenu'));
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
  }

    regexp: {
    quotelink: new RegExp(`/([^/]+)/res/(\\d+)(?:\\.\\w+)?#(\\d+)$`),
    quotelinkHTML:
      /<a [^>]*\bhref="[^"]*\/([^\/]+)\/res\/(\d+)(?:\.\w+)?#(\d+)"/g
  },
}