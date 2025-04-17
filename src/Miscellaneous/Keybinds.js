import Notice from "../classes/Notice";
import Config from "../config/Config";
import Filter from "../Filtering/Filter";
import ThreadHiding from "../Filtering/ThreadHiding";
import BoardConfig from "../General/BoardConfig";
import Get from "../General/Get";
import Header from "../General/Header";
import Index from "../General/Index";
import Settings from "../General/Settings";
import { Conf, d, g } from "../globals/globals";
import FappeTyme from "../Images/FappeTyme";
import Gallery from "../Images/Gallery";
import ImageExpand from "../Images/ImageExpand";
import Embedding from "../Linkification/Embedding";
import ThreadUpdater from "../Monitoring/ThreadUpdater";
import ThreadWatcher from "../Monitoring/ThreadWatcher";
import UnreadIndex from "../Monitoring/UnreadIndex";
import $ from "../platform/$";
import $$ from "../platform/$$";
import QR from "../Posting/QR";
import QuoteThreading from "../Quotelinks/QuoteThreading";
import QuoteYou from "../Quotelinks/QuoteYou";
import CatalogLinks from "./CatalogLinks";
import ExpandThread from "./ExpandThread";
import Nav from "./Nav";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Keybinds = {
  init() {
    if (!Conf['Keybinds']) { return; }

    for (var hotkey in Config.hotkeys) {
      $.sync(hotkey, Keybinds.sync);
    }

    var init = function() {
      $.off(d, '4chanXInitFinished', init);
      $.on(d, 'keydown', Keybinds.keydown);
      for (var node of $$('[accesskey]')) {
        node.removeAttribute('accesskey');
      }
    };
    return $.on(d, '4chanXInitFinished', init);
  },

  sync(key, hotkey) {
    return Conf[hotkey] = key;
  },

  keydown(e) {
    let key, thread, threadRoot;
    let catalog, notifications;
    if (!(key = Keybinds.keyCode(e))) { return; }
    const {target} = e;
    if (['INPUT', 'TEXTAREA'].includes(target.nodeName)) {
      if (!/(Esc|Alt|Ctrl|Meta|Shift\+\w{2,})/.test(key) || !!/^Alt\+(\d|Up|Down|Left|Right)$/.test(key)) { return; }
    }
    if (['index', 'thread'].includes(g.VIEW)) {
      threadRoot = Nav.getThread();
      thread = Get.threadFromRoot(threadRoot);
    }
    let hasAction = false;
    // QR & Options
    if (key === Conf['Toggle board list'] && Conf['Custom Board Navigation']) {
      Header.toggleBoardList();
      hasAction = true;
    }
    if (key === Conf['Toggle header']) {
      Header.toggleBarVisibility();
      hasAction = true;
    }
    if (key === Conf['Open empty QR'] && QR.postingIsEnabled) {
      Keybinds.qr();
      hasAction = true;
    }
    if (key === Conf['Open QR'] && QR.postingIsEnabled && threadRoot) {
      Keybinds.qr(threadRoot);
      hasAction = true;
    }
    if (key === Conf['Open settings']) {
      Settings.open();
      hasAction = true;
    }
    if (key === Conf['Close']) {
      if (Settings.dialog) {
        Settings.close();
      } else if ((notifications = $$('.notification')).length) {
        for (var notification of notifications) {
          $('.close', notification).click();
        }
      } else if (QR.nodes?.preview) {
        QR.closePreview();
      } else if (QR.nodes && !(QR.nodes.el.hidden || (window.getComputedStyle(QR.nodes.form).display === 'none'))) {
        if (Conf['Persistent QR']) {
          QR.hide();
        } else {
          QR.close();
        }
      } else if (Embedding.lastEmbed) {
        Embedding.closeFloat();
      }
      hasAction = true;
    }
    if (key === Conf['Spoiler tags'] && target.nodeName === 'TEXTAREA') {
      Keybinds.tags('spoiler', target);
      hasAction = true;
    }
    if (key === Conf['Code tags'] && target.nodeName === 'TEXTAREA') {
      Keybinds.tags('code', target);
      hasAction = true;
    }
    if (key === Conf['Eqn tags'] && target.nodeName === 'TEXTAREA') {
      Keybinds.tags('eqn', target);
      hasAction = true;
    }
    if (key === Conf['Math tags'] && target.nodeName === 'TEXTAREA') {
      Keybinds.tags('math', target);
      hasAction = true;
    }
    if (key === Conf['SJIS tags'] && target.nodeName === 'TEXTAREA') {
      Keybinds.tags('sjis', target);
      hasAction = true;
    }
    if (key === Conf['Toggle sage'] && QR.nodes && !QR.nodes.el.hidden) {
      Keybinds.sage();
      hasAction = true;
    }
    if (key === Conf['Toggle Cooldown'] && QR.nodes && !QR.nodes.el.hidden
      && $.hasClass(QR.nodes.fileSubmit, 'custom-cooldown')) {
      QR.toggleCustomCooldown();
      hasAction = true;
    }
    if (key === Conf['Post from URL'] && QR.postingIsEnabled) {
      QR.handleUrl('');
      hasAction = true;
    }
    if (key === Conf['Add new post'] && QR.postingIsEnabled) {
      QR.addPost();
      hasAction = true;
    }
    if (key === Conf['Submit QR'] && QR.nodes && !QR.nodes.el.hidden && !QR.status()) {
      QR.submit();
      hasAction = true;
    }
    // Index/Thread related
    if (key === Conf['Update']) {
      switch (g.VIEW) {
        case 'thread':
          if (ThreadUpdater.enabled) ThreadUpdater.update();
          hasAction = true;
        break;
        case 'index':
          if (Index.enabled) Index.update();
          hasAction = true;
      }
    }
    if (key === Conf['Watch'] && ThreadWatcher.enabled && thread) {
      ThreadWatcher.toggle(thread);
      hasAction = true;
    }
    if (key === Conf['Update thread watcher'] && ThreadWatcher.enabled) {
      ThreadWatcher.buttonFetchAll();
      hasAction = true;
    }
    if (key === Conf['Toggle thread watcher'] && ThreadWatcher.enabled) {
      ThreadWatcher.toggleWatcher();
      hasAction = true;
    }
    if (key === Conf['Toggle threading'] && QuoteThreading.ready) {
      QuoteThreading.toggleThreading();
      hasAction = true;
    }
    if (key === Conf['Mark thread read'] && g.VIEW === 'index' && thread && UnreadIndex.enabled) {
      UnreadIndex.markRead.call(threadRoot);
      hasAction = true;
    }
    // Images
    if (key === Conf['Expand image'] && ImageExpand.enabled && threadRoot) {
      var post = Get.postFromNode(Keybinds.post(threadRoot));
      if (post.file) {
        ImageExpand.toggle(post);
        hasAction = true;
      }
    }
    if (key === Conf['Expand images'] && ImageExpand.enabled) {
      ImageExpand.cb.toggleAll();
      hasAction = true;
    }
    if (key === Conf['Open Gallery'] && Gallery.enabled) {
      Gallery.cb.toggle();
      hasAction = true;
    }
    if (key === Conf['fappeTyme'] && FappeTyme.nodes?.fappe) {
      FappeTyme.toggle('fappe');
      hasAction = true;
    }
    if (key === Conf['werkTyme'] && FappeTyme.nodes?.werk) {
      FappeTyme.toggle('werk');
      hasAction = true;
    }
    // Board Navigation
    if (key === Conf['Front page']) {
      if (Index.enabled) {
        Index.userPageNav(1);
      } else {
        location.href = `/${g.BOARD}/`;
      }
      hasAction = true;
    }
    if (key === Conf['Open front page']) {
      $.open(`${location.origin}/${g.BOARD}/`);
      hasAction = true;
    }
    if (key === Conf['Next page'] && g.VIEW === 'index' && !g.SITE.isOnePage?.(g.BOARD)) {
      if (Index.enabled) {
        if (!['paged', 'infinite'].includes(Conf['Index Mode'])) { return; }
        $('.next button', Index.pagelist).click();
      } else {
        $(g.SITE.selectors.nav.next)?.click();
      }
      hasAction = true;
    }
    if (key === Conf['Previous page'] && g.VIEW === 'index' && !g.SITE.isOnePage?.(g.BOARD)) {
      if (Index.enabled) {
        if (!['paged', 'infinite'].includes(Conf['Index Mode'])) { return; }
        $('.prev button', Index.pagelist).click();
      } else {
        $(g.SITE.selectors.nav.prev)?.click();
      }
      hasAction = true;
    }
    if (key === Conf['Search form'] && g.VIEW === 'index') {
      var searchInput = Index.enabled ?
        Index.searchInput
      : g.SITE.selectors.searchBox ?
        $(g.SITE.selectors.searchBox)
      :
        undefined;
      if (searchInput) {
        Header.scrollToIfNeeded(searchInput);
        searchInput.focus();
        hasAction = true;
      }
    }
    if (key === Conf['Paged mode'] && Index.enabledOn(g.BOARD)) {
      location.href = g.VIEW === 'index' ? '#paged' : `/${g.BOARD}/#paged`;
    }
    if (key === Conf['Infinite scrolling mode'] && Index.enabledOn(g.BOARD)) {
      location.href = g.VIEW === 'index' ? '#infinite' : `/${g.BOARD}/#infinite`;
    }
    if (key === Conf['All pages mode'] && Index.enabledOn(g.BOARD)) {
      location.href = g.VIEW === 'index' ? '#all-pages' : `/${g.BOARD}/#all-pages`;
    }
    if (key === Conf['Open catalog'] && (catalog = CatalogLinks.catalog())) {
      location.href = catalog;
    }
    if (key === Conf['Cycle sort type'] && Index.enabled) {
      Index.cycleSortType();
      hasAction = true;
    }
    // Thread Navigation
    if (key === Conf['Next thread'] && g.VIEW === 'index' && threadRoot) {
      Nav.scroll(+1);
      hasAction = true;
    }
    if (key === Conf['Previous thread'] && g.VIEW === 'index' && threadRoot) {
      Nav.scroll(-1);
      hasAction = true;
    }
    if (key === Conf['Expand thread'] && g.VIEW === 'index' && threadRoot) {
      ExpandThread.toggle(thread);
      // Keep thread from moving off screen when contracted.
      Header.scrollTo(threadRoot);
      hasAction = true;
    }
    if (key === Conf['Open thread'] && g.VIEW === 'index' && threadRoot) {
      Keybinds.open(thread);
      hasAction = true;
    }
    if (key === Conf['Open thread tab'] && g.VIEW === 'index' && threadRoot) {
      Keybinds.open(thread, true);
      hasAction = true;
    }
    // Reply Navigation
    if (key === Conf['Next reply'] && threadRoot) {
      Keybinds.hl(+1, threadRoot);
      hasAction = true;
    }
    if (key === Conf['Previous reply'] && threadRoot) {
      Keybinds.hl(-1, threadRoot);
      hasAction = true;
    }
    if (key === Conf['Deselect reply'] && threadRoot) {
      Keybinds.hl(0, threadRoot);
      hasAction = true;
    }
    if (key === Conf['Hide'] && thread && ThreadHiding.db) {
      Header.scrollTo(threadRoot);
      ThreadHiding.toggle(thread);
      hasAction = true;
    }
    if (key === Conf['Quick Filter MD5'] && threadRoot) {
      post = Keybinds.post(threadRoot);
      Keybinds.hl(+1, threadRoot);
      Filter.quickFilterMD5.call(post, e);
      hasAction = true;
    }
    if (key === Conf['Previous Post Quoting You'] && threadRoot && QuoteYou.db) {
      QuoteYou.cb.seek('preceding');
      hasAction = true;
    }
    if (key === Conf['Next Post Quoting You'] && threadRoot && QuoteYou.db) {
      QuoteYou.cb.seek('following');
      hasAction = true;
    }
    if (hasAction) {
      e.preventDefault();
      e.stopPropagation();
    }
  },

  keyCode(e) {
    let key = (() => { let kc;
    switch ((kc = e.keyCode)) {
      case 8: // return
        return '';
      case 13:
        return 'Enter';
      case 27:
        return 'Esc';
      case 32:
        return 'Space';
      case 37:
        return 'Left';
      case 38:
        return 'Up';
      case 39:
        return 'Right';
      case 40:
        return 'Down';
      case 188:
        return 'Comma';
      case 190:
        return 'Period';
      case 191:
        return 'Slash';
      case 59: case 186:
        return 'Semicolon';
      default:
        if ((48 <= kc && kc <= 57) || (65 <= kc && kc <= 90)) { // 0-9, A-Z
          return String.fromCharCode(kc).toLowerCase();
        } else if (96 <= kc && kc <= 105) { // numpad 0-9
          return String.fromCharCode(kc - 48);
        } else {
          return null;
        }
    } })();
    if (key) {
      if (e.altKey) {   key = 'Alt+'   + key; }
      if (e.ctrlKey) {  key = 'Ctrl+'  + key; }
      if (e.metaKey) {  key = 'Meta+'  + key; }
      if (e.shiftKey) { key = 'Shift+' + key; }
    }
    return key;
  },

  post(thread) {
    const s = g.SITE.selectors;
    return (
      $(`${s.postContainer}${s.highlightable.reply}.${g.SITE.classes.highlight}`, thread) ||
      $(`${g.SITE.isOPContainerThread ? s.thread : s.postContainer}${s.highlightable.op}`, thread)
    );
  },

  qr(thread) {
    QR.open();
    if (thread != null) {
      QR.quote.call(Keybinds.post(thread));
    }
    return QR.nodes.com.focus();
  },

  tags(tag, ta) {
    BoardConfig.ready(function() {
      const {config} = g.BOARD;
      const supported = (() => { switch (tag) {
        case 'spoiler':     return !!config.spoilers;
        case 'code':        return !!config.code_tags;
        case 'math': case 'eqn': return !!config.math_tags;
        case 'sjis':        return !!config.sjis_tags;
      } })();
      if (!supported) { return new Notice('warning', `[${tag}] tags are not supported on /${g.BOARD}/.`, 20); }
    });

    const {
      value
    } = ta;
    const selStart = ta.selectionStart;
    const selEnd   = ta.selectionEnd;

    ta.value =
      value.slice(0, selStart) +
      `[${tag}]` + value.slice(selStart, selEnd) + `[/${tag}]` +
      value.slice(selEnd);

    // Move the caret to the end of the selection.
    const range = (`[${tag}]`).length + selEnd;
    ta.setSelectionRange(range, range);

    // Fire the 'input' event
    return $.event('input', null, ta);
  },

  sage() {
    const isSage  = /sage/i.test(QR.nodes.email.value);
    return QR.nodes.email.value = isSage ?
      ""
    : "sage";
  },

  open(thread, tab) {
    if (g.VIEW !== 'index') { return; }
    const url = Get.url('thread', thread);
    if (tab) {
      return $.open(url);
    } else {
      return location.href = url;
    }
  },

  hl(delta, thread) {
    const replySelector = `${g.SITE.selectors.postContainer}${g.SITE.selectors.highlightable.reply}`;
    const {highlight} = g.SITE.classes;

    const postEl = $(`${replySelector}.${highlight}`, thread);

    if (!delta) {
      if (postEl) { $.rmClass(postEl, highlight); }
      return;
    }

    if (postEl) {
      const {height} = postEl.getBoundingClientRect();
      if ((Header.getTopOf(postEl) >= -height) && (Header.getBottomOf(postEl) >= -height)) { // We're at least partially visible
        let next;
        const {root} = Get.postFromNode(postEl).nodes;
        const axis = delta === +1 ?
          'following'
        :
          'preceding';
        if (!(next = $.x(`${axis}-sibling::${g.SITE.xpath.replyContainer}[not(@hidden) and not(child::div[@class='stub'])][1]`, root))) { return; }
        if (!next.matches(replySelector)) { next = $(replySelector, next); }
        Header.scrollToIfNeeded(next, delta === +1);
        $.addClass(next, highlight);
        $.rmClass(postEl, highlight);
        return;
      }
      $.rmClass(postEl, highlight);
    }

    const replies = $$(replySelector, thread);
    if (delta === -1) { replies.reverse(); }
    for (var reply of replies) {
      if (((delta === +1) && (Header.getTopOf(reply) > 0)) || ((delta === -1) && (Header.getBottomOf(reply) > 0))) {
        $.addClass(reply, highlight);
        return;
      }
    }
  }
};
export default Keybinds;
