import type { FilterResults } from "../Filtering/Filter";
import Get from "../General/Get";
// #region tests_enabled
import Test from "../General/Test";
// #endregion
import { g, Conf } from "../globals/globals";
import ImageExpand from "../Images/ImageExpand";
import $ from "../platform/$";
import $$ from "../platform/$$";
import type Board from "./Board";
import Callbacks from "./Callbacks";
import type Thread from "./Thread";

export interface File {
  text:        string,
  link:        HTMLAnchorElement,
  thumb:       HTMLElement,
  thumbLink:   HTMLElement,
  size:        string,
  sizeInBytes: number,
  isDead:      boolean,
  url:         string,
  thumbURL?:   string,
  name:        string,
  isImage:     boolean,
  isVideo:     boolean,
  isExpanding: boolean,
  isExpanded:  boolean,
  fullImage?:  HTMLImageElement | HTMLVideoElement,
  audio?:      HTMLAudioElement,
  audioSlider?:HTMLSpanElement,
  wasPlaying?: boolean,
  dimensions?: string,
  height?:     string,
  width?:      string,
  theight:     string,
  twidth:      string,
  MD5?:        string,
  isSpoiler?:  boolean,
  aspectRatio?:string,
};

export default class Post {
  declare root:           HTMLElement;
  declare thread:         Thread;
  declare board:          Board;
  declare ID:             number;
  declare postID:         number;
  declare threadID:       number;
  declare boardID:        string;
  declare siteID:         string;
  declare fullID:         string;
  declare context:        Post;
  declare isReply:        boolean
  declare nodes:          ReturnType<Post['parseNodes']>;
  declare isDead:         boolean;
  declare isHidden:       boolean;
  declare clones:         any[];
  declare isRebuilt?:     boolean;
  declare isFetchedQuote: boolean | undefined;
  declare isClone:        boolean | undefined;
  declare quotes:         string[];
  declare file:           ReturnType<Post['parseFile']>;
  declare files:          ReturnType<Post['parseFile']>[];
  declare forBuildTest?:  boolean;
  declare normalizedOriginal?: any;
  declare highlights?:    string[];
  declare filterResults:  FilterResults;

  declare info: {
    subject:       string | undefined,
    name:          string | undefined,
    email:         string | undefined,
    tripcode:      string | undefined,
    uniqueID:      string | undefined,
    capcode:       string | undefined,
    pass:          string | undefined,
    flagCode:      string | undefined,
    flagCodeTroll: string | undefined,
    flag:          string | undefined,
    date:          Date | undefined,
    nameBlock:     string,
  };

  // because of a circular dependency $ might not be initialized, so we can't use $.el
  static deadMark = (() => {
    const el = document.createElement('span');
    // \u00A0 is nbsp
    el.textContent = '\u00A0(Dead)';
    el.className = 'qmark-dead';
    return el;
  })();

  toString() { return this.ID; }

  constructor(root?: HTMLElement, thread?: Thread, board?: Board, flags={}) {
    // #region tests_enabled
    if (root) this.normalizedOriginal = Test.normalize(root);
    // #endregion

    // Skip initialization for PostClone
    if (root === undefined && thread === undefined && board === undefined) return;

    this.root = root;
    this.thread = thread;
    this.board = board;
    $.extend(this, flags);
    this.ID       = +root.id.match(/\d*$/)[0];
    this.postID   = this.ID;
    this.threadID = this.thread.ID;
    this.boardID  = this.board.ID;
    this.siteID   = g.SITE.ID;
    this.fullID   = `${this.board}.${this.ID}`;
    this.context  = this;
    this.isReply  = (this.ID !== this.threadID);

    root.dataset.fullID = this.fullID;

    this.nodes = this.parseNodes(root);

    if (!this.isReply) {
      this.thread.OP = this;
      for (var key of ['isSticky', 'isClosed', 'isArchived']) {
        var selector;
        if (selector = g.SITE.selectors.icons[key]) {
          this.thread[key] = !!$(selector, this.nodes.info);
        }
      }
      if (this.thread.isArchived) {
        this.thread.isClosed = true;
        this.thread.kill();
      }
    }

    const name = this.nodes.name?.textContent;
    const tripcode = this.nodes.tripcode?.textContent;

    this.info = {
      subject:   this.nodes.subject?.textContent || undefined,
      name,
      email:     this.nodes.email ? decodeURIComponent(this.nodes.email.href.replace(/^mailto:/, '')) : undefined,
      tripcode,
      uniqueID:  this.nodes.uniqueID?.textContent,
      capcode:   this.nodes.capcode?.textContent.replace('## ', ''),
      pass:      this.nodes.pass?.title.match(/\d*$/)[0],
      flagCode:  this.nodes.flag?.className.match(/flag-(\w+)/)?.[1].toUpperCase(),
      flagCodeTroll: this.nodes.flag?.className.match(/bfl-(\w+)/)?.[1].toUpperCase(),
      flag:      this.nodes.flag?.title,
      date:      this.nodes.date ? g.SITE.parseDate(this.nodes.date) : undefined,
      nameBlock: Conf['Anonymize'] ? 'Anonymous' : `${name || ''} ${tripcode || ''}`.trim(),
    };

    if (this.info.capcode) { this.info.nameBlock += ` ## ${this.info.capcode}`; }
    if (this.info.uniqueID) { this.info.nameBlock += ` (ID: ${this.info.uniqueID})`; }

    this.parseComment();
    this.parseQuotes();
    this.parseFiles();

    this.isDead   = false;
    this.isHidden = false;

    this.clones = [];
    // #region tests_enabled
    if (this.forBuildTest)  return;
    // #endregion
    if (g.posts.get(this.fullID)) {
      this.isRebuilt = true;
      this.clones = g.posts.get(this.fullID).clones;
      for (var clone of this.clones) { clone.origin = this; }
    }

    if (!this.isFetchedQuote && (this.ID > this.thread.lastPost)) { this.thread.lastPost = this.ID; }

    if (this.ID < this.thread.lastPost && g.VIEW === 'thread') {
      this.board.posts.insert(this.ID, this);
      this.thread.posts.insert(this.ID, this);
      g.posts.insert(this.fullID, this, key => +(key.split('.')[1]) < this.ID);
    } else {
      this.board.posts.push(this.ID, this);
      this.thread.posts.push(this.ID, this);
      g.posts.push(this.fullID, this);
    }
  }

  parseNodes(root: HTMLElement) {
    const s = g.SITE.selectors;
    const post: HTMLElement = $(s.post, root) || root;
    const info: HTMLElement = $(s.infoRoot, post);

    interface Node {
      root:         HTMLElement,
      bottom:       false | HTMLElement,
      post:         HTMLElement,
      info:         HTMLElement,
      comment:      HTMLElement;
      quotelinks:   HTMLAnchorElement[],
      archivelinks: HTMLAnchorElement[],
      embedlinks:   HTMLAnchorElement[],
      backlinks:    HTMLCollectionOf<HTMLAnchorElement>;
      uniqueIDRoot: any,
      uniqueID:     any,
      stub?:        HTMLElement,
    };

    const nodes: Node & Partial<Record<keyof Post['info'], HTMLElement>> = {
      root,
      bottom:     this.isReply || !g.SITE.isOPContainerThread ? root : $(s.opBottom, root),
      post,
      info,
      comment:    $(s.comment, post),
      quotelinks: [],
      archivelinks: [],
      embedlinks:   [],
      backlinks:    post.getElementsByClassName('backlink') as HTMLCollectionOf<HTMLAnchorElement>,
      uniqueIDRoot: undefined as any,
      uniqueID:     undefined as any,
    };
    for (var key in s.info) {
      var selector = s.info[key];
      nodes[key] = $(selector, info);
    }
    g.SITE.parseNodes?.(this, nodes);
    if (!nodes.uniqueIDRoot) { nodes.uniqueIDRoot = nodes.uniqueID; }

    return nodes as Node & Record<keyof Post['info'], HTMLElement>;
  }

  parseComment() {
    // Merge text nodes and remove empty ones.
    let bq;
    this.nodes.comment.normalize();

    // Get the comment's text.
    // <br> -> \n
    // Remove:
    //   'Comment too long'...
    //   EXIF data. (/p/)
    this.nodes.commentClean = (bq = this.nodes.comment.cloneNode(true));
    g.SITE.cleanComment?.(bq);
    return this.info.comment = this.nodesToText(bq);
  }

  commentDisplay() {
    // Get the comment's text for display purposes (e.g. notifications, excerpts).
    // In addition to what's done in generating `@info.comment`, remove:
    //   Spoilers. (filter to '[spoiler]')
    //   Rolls. (/tg/, /qst/)
    //   Fortunes. (/s4s/)
    //   Preceding and following new lines.
    //   Trailing spaces.
    const bq = this.nodes.commentClean.cloneNode(true);
    if (!Conf['Remove Spoilers'] && !Conf['Reveal Spoilers']) { this.cleanSpoilers(bq); }
    g.SITE.cleanCommentDisplay?.(bq);
    return this.nodesToText(bq).trim().replace(/\s+$/gm, '');
  }

  commentOrig() {
    // Get the comment's text for reposting purposes.
    const bq = this.nodes.commentClean.cloneNode(true);
    g.SITE.insertTags?.(bq);
    return this.nodesToText(bq);
  }

  nodesToText(bq) {
    let node;
    let text = "";
    const nodes = $.X('.//br|.//text()', bq);
    let i = 0;
    while ((node = nodes.snapshotItem(i++))) {
      text += node.data || '\n';
    }
    return text;
  }

  cleanSpoilers(bq) {
    const spoilers = $$(g.SITE.selectors.spoiler, bq);
    for (var node of spoilers) {
      $.replace(node, $.tn('[spoiler]'));
    }
  }

  parseQuotes() {
    this.quotes = [];
    for (var quotelink of $$(g.SITE.selectors.quotelink, this.nodes.comment)) {
      this.parseQuote(quotelink);
    }
  }

  parseQuote(quotelink) {
    // Only add quotes that link to posts on an imageboard.
    // Don't add:
    //  - board links. (>>>/b/)
    //  - catalog links. (>>>/b/catalog or >>>/b/search)
    //  - rules links. (>>>/a/rules)
    //  - text-board quotelinks. (>>>/img/1234)
    const match = quotelink.href.match(g.SITE.regexp.quotelink);
    if (!match && (!this.isClone || !quotelink.dataset.postID)) { return; } // normal or resurrected quote

    this.nodes.quotelinks.push(quotelink);

    if (this.isClone) { return; }

    // ES6 Set when?
    const fullID = `${match[1]}.${match[3]}`;
    if (!this.quotes.includes(fullID)) this.quotes.push(fullID);
  }

  parseFiles() {
    let file;
    this.files = [];
    const fileRoots = this.fileRoots();
    let index = 0;
    for (let docIndex = 0; docIndex < fileRoots.length; docIndex++) {
      var fileRoot = fileRoots[docIndex];
      if (file = this.parseFile(fileRoot)) {
        file.index = (index++);
        file.docIndex = docIndex;
        this.files.push(file);
      }
    }
    if (this.files.length) {
      return this.file = this.files[0];
    }
  }

  fileRoots() {
    if (g.SITE.selectors.multifile) {
      const roots = $$(g.SITE.selectors.multifile, this.nodes.root);
      if (roots.length) { return roots; }
    }
    return [this.nodes.root];
  }

  parseFile(fileRoot: HTMLElement) {

    const file: Partial<File> = { isDead: false };
    for (var key in g.SITE.selectors.file) {
      var selector = g.SITE.selectors.file[key];
      file[key] = $(selector, fileRoot);
    }
    file.thumbLink = file.thumb?.parentNode as HTMLElement;

    if (!(file.text && file.link)) { return; }
    if (!g.SITE.parseFile(this, file)) { return; }

    $.extend(file, {
      url:     file.link.href,
      isImage: $.isImage(file.link.href),
      isVideo: $.isVideo(file.link.href)
    }
    );
    let size  = +file.size.match(/[\d.]+/)[0];
    let unit  = ['B', 'KB', 'MB', 'GB'].indexOf(file.size.match(/\w+$/)[0]);
    while (unit-- > 0) { size *= 1024; }
    file.sizeInBytes = size;
    (function determineAspectRatio() {
      // If a file has no dimensions (e.g. PDF)
      if (!file.dimensions) {
        file.aspectRatio = '?';
        return;
      }
      const popularRatios = {
        '1:1':   1 / 1, // Square
        '4:3':   4 / 3, // 1024x768, 1600x1200
        '5:4':   5 / 4, // 1280x1024
        '3:2':   3 / 2, // 2160x1440, Surface devices
        '8:5':   8 / 5, // 1280x800, 1920x1200, 2560x1600, 3840x2400
        '16:9':  16 / 9, // ~1366x768, 1920x1080, 2560x1440, 3840x2160 (4K)
        '21:9':  21 / 9, // Ultrawide-ish
      };
      let tolerance = 0.01;
      let [fileWidth, fileHeight] = file.dimensions.split('x').map(Number);
      let orientation: 'Landscape' | 'Portrait' | 'Square';
      let aspectRatio: number;
      if (fileWidth > fileHeight) {
        orientation = 'Landscape';
        aspectRatio = fileWidth / fileHeight;
      } else if (fileWidth < fileHeight) {
        orientation = 'Portrait';
        aspectRatio = fileHeight / fileWidth;
      } else {
        orientation = 'Square';
        aspectRatio = 1;
      }
      let closestMatch = '';
      let smallestDifference = Infinity;
      for (const [label, ratio] of Object.entries(popularRatios)) {
        const difference = Math.abs(aspectRatio - ratio);
        if (difference <= tolerance) {
          return file.aspectRatio = `${label} (${orientation})`;
        }
        if (difference < smallestDifference) {
          closestMatch = label;
          smallestDifference = difference;
        }
      }
      return file.aspectRatio = `~${closestMatch} (${orientation})`;
    })();
    return file as File;
  }

  kill(file = false, index = 0) {
    let strong;
    if (file) {
      if (this.isDead || this.files[index].isDead) { return; }
      this.files[index].isDead = true;
      $.addClass(this.nodes.root, 'deleted-file');
    } else {
      if (this.isDead) { return; }
      this.isDead = true;
      $.rmClass(this.nodes.root, 'deleted-file');
      $.addClass(this.nodes.root, 'deleted-post');
    }

    if (!(strong = $('strong.warning', this.nodes.info))) {
      strong = $.el('strong',
        {className: 'warning'});
      $.after($('input', this.nodes.info), strong);
    }
    strong.textContent = file ? '[File deleted]' : '[Deleted]';

    if (this.isClone) { return; }
    for (var clone of this.clones) {
      clone.kill(file, index);
    }

    if (file) { return; }
    // Get quotelinks/backlinks to this post
    // and paint them (Dead).
    for (var quotelink of Get.allQuotelinksLinkingTo(this)) {
      if (!$.hasClass(quotelink, 'deadlink')) {
        $.add(quotelink, Post.deadMark.cloneNode(true));
        $.addClass(quotelink, 'deadlink');
      }
    }
  }

  markAsFromArchive() {
    let strong = $('strong.warning', this.nodes.info);
    if (!strong) {
      strong = $.el('strong', { className: 'warning' });
      $.after($('input', this.nodes.info), strong);
    }
    strong.textContent = '[Deleted, restored from external archive]';
    $.addClass(this.nodes.root, 'from-archive');

    if (this.isClone) { return; }
    for (var clone of this.clones) {
      clone.markAsFromArchive();
    }
    for (var quotelink of Get.allQuotelinksLinkingTo(this) as HTMLAnchorElement[]) {
      $.addClass(quotelink, 'from-archive-link');
    }
  }

  // XXX Workaround for 4chan's racing condition
  // giving us false-positive dead posts.
  resurrect() {
    this.isDead = false;
    $.rmClass(this.nodes.root, 'deleted-post', 'from-archive');
    const strong = $('strong.warning', this.nodes.info);
    // no false-positive files
    if (this.files.some(file => file.isDead)) {
      $.addClass(this.nodes.root, 'deleted-file');
      strong.textContent = '[File deleted]';
    } else {
      $.rm(strong);
    }

    if (this.isClone) { return; }
    for (var clone of this.clones) {
      clone.resurrect();
    }

    for (var quotelink of Get.allQuotelinksLinkingTo(this) as HTMLAnchorElement[]) {
      if ($.hasClass(quotelink, 'deadlink')) {
        $.rm($('.qmark-dead', quotelink));
      }
      $.rmClass(quotelink, 'deadlink', 'from-archive-link');
    }
  }

  collect() {
    g.posts.rm(this.fullID);
    this.thread.posts.rm(this);
    this.board.posts.rm(this);
  }

  addClone(context, contractThumb) {
    // Callbacks may not have been run yet due to anti-browser-lock delay in Main.callbackNodesDB.
    Callbacks.Post.execute(this);
    return new PostClone(this, context, contractThumb);
  }

  rmClone(index) {
    this.clones.splice(index, 1);
    for (var clone of this.clones.slice(index)) {
      clone.nodes.root.dataset.clone = index++;
    }
  }

  setCatalogOP(isCatalogOP) {
    this.nodes.root.classList.toggle('catalog-container', isCatalogOP);
    this.nodes.root.classList.toggle('opContainer', !isCatalogOP);
    this.nodes.post.classList.toggle('catalog-post', isCatalogOP);
    this.nodes.post.classList.toggle('op', !isCatalogOP);
    this.nodes.post.style.left = (this.nodes.post.style.right = null);
  }
};

export class PostClone extends Post {
  declare origin: Post;

  static suffix = 0;

  constructor(origin, context, contractThumb) {
    super();
    this.isClone = true;

    let file, fileRoots, key;
    this.origin = origin;
    this.context = context;
    for (key of ['ID', 'postID', 'threadID', 'boardID', 'siteID', 'fullID', 'board', 'thread', 'info', 'quotes', 'isReply']) {
      // Copy or point to the origin's key value.
      this[key] = this.origin[key];
    }

    const { nodes } = this.origin;
    const root = contractThumb ? this.cloneWithoutVideo(nodes.root) : nodes.root.cloneNode(true);
    for (var node of [root, ...$$('[id]', root)]) {
      node.id += `_${PostClone.suffix}`;
    }
    PostClone.suffix++;

    // Remove inlined posts inside of this post.
    for (var inline of $$('.inline', root)) {
      $.rm(inline);
    }
    for (var inlined of $$('.inlined', root)) {
      $.rmClass(inlined, 'inlined');
    }

    this.nodes = this.parseNodes(root);

    root.hidden = false; // post hiding
    $.rmClass(root, 'forwarded'); // quote inlining
    $.rmClass(this.nodes.post, 'highlight'); // keybind navigation, ID highlighting

    // Remove catalog stuff.
    if (!this.isReply) {
      this.setCatalogOP(false);
      $.rm($('.catalog-link', this.nodes.post));
      $.rm($('.catalog-stats', this.nodes.post));
      $.rm($('.catalog-replies', this.nodes.post));
    }

    this.parseQuotes();
    this.quotes = [...this.origin.quotes];

    this.files = [];
    if (this.origin.files.length) { fileRoots = this.fileRoots(); }
    for (var originFile of this.origin.files) {
      // Copy values, point to relevant elements.
      file = { ...originFile };
      var fileRoot = fileRoots[file.docIndex];
      for (key in g.SITE.selectors.file) {
        var selector = g.SITE.selectors.file[key];
        file[key] = $(selector, fileRoot);
      }
      file.thumbLink = file.thumb?.parentNode;
      if (file.thumbLink) { file.fullImage = $('.full-image', file.thumbLink); }
      file.videoControls = $('.video-controls', file.text);
      if (file.videoThumb) { file.thumb.muted = true; }
      this.files.push(file);
    }

    if (this.files.length) {
      this.file = this.files[0];

      // Contract thumbnails in quote preview
      if (this.file.thumb && contractThumb) { ImageExpand.contract(this); }
    }

    if (this.origin.isDead) { this.isDead = true; }
    root.dataset.clone = this.origin.clones.push(this) - 1;
    return this;
  }

  cloneWithoutVideo(node) {
    if ((node.tagName === 'VIDEO') && !node.dataset.md5) { // (exception for WebM thumbnails)
      return [];
    } else if ((node.nodeType === Node.ELEMENT_NODE) && $('video', node)) {
      const clone = node.cloneNode(false);
      for (var child of node.childNodes) { $.add(clone, this.cloneWithoutVideo(child)); }
      return clone;
    } else {
      return node.cloneNode(true);
    }
  }
};
