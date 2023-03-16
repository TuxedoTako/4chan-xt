import Get from '../General/Get';
import Header from '../General/Header';
import { g, Conf } from '../globals/globals';
import $ from '../platform/$';
import $$ from '../platform/$$';

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Nav = {
  init() {
    switch (g.VIEW) {
      case 'index':
        if (!Conf['Index Navigation']) {
          return;
        }
        break;
      case 'thread':
        if (!Conf['Reply Navigation']) {
          return;
        }
        break;
      default:
        return;
    }

    const span = $.el('span', { id: 'navlinks' });
    const prev = $.el('a', {
      textContent: '▲',
      href: 'javascript:;',
    });
    const next = $.el('a', {
      textContent: '▼',
      href: 'javascript:;',
    });

    $.on(prev, 'click', this.prev);
    $.on(next, 'click', this.next);

    $.add(span, [prev, $.tn(' '), next]);
    var append = function () {
      $.off(document, '4chanXInitFinished', append);
      return $.add(document.body, span);
    };
    return $.on(document, '4chanXInitFinished', append);
  },

  prev() {
    if (g.VIEW === 'thread') {
      return window.scrollTo(0, 0);
    } else {
      return Nav.scroll(-1);
    }
  },

  next() {
    if (g.VIEW === 'thread') {
      return window.scrollTo(0, document.body.scrollHeight);
    } else {
      return Nav.scroll(+1);
    }
  },

  getThread() {
    if (g.VIEW === 'thread') {
      return g.threads.get(`${g.BOARD}.${g.THREADID}`).nodes.root;
    }
    if ($.hasClass(document.documentElement, 'catalog-mode')) {
      return;
    }
    for (var threadRoot of $$(g.SITE.selectors.thread)) {
      var thread = Get.threadFromRoot(threadRoot);
      if (thread.isHidden && !thread.stub) {
        continue;
      }
      if (
        Header.getTopOf(threadRoot) >=
        -threadRoot.getBoundingClientRect().height
      ) {
        // not scrolled past
        return threadRoot;
      }
    }
  },

  scroll(delta) {
    let next;
    document.activeElement?.blur();
    let thread = Nav.getThread();
    if (!thread) {
      return;
    }
    const axis = delta === +1 ? 'following' : 'preceding';
    if (
      (next = $.x(
        `${axis}-sibling::${g.SITE.xpath.thread}[not(@hidden)][1]`,
        thread
      ))
    ) {
      // Unless we're not at the beginning of the current thread,
      // and thus wanting to move to beginning,
      // or we're above the first thread and don't want to skip it.
      const top = Header.getTopOf(thread);
      if ((delta === +1 && top < 5) || (delta === -1 && top > -5)) {
        thread = next;
      }
    }
    // Add extra space to the end of the page if necessary so that all threads can be selected by keybinds.
    const extra =
      Header.getTopOf(thread) +
      document.documentElement.clientHeight -
      document.body.getBoundingClientRect().bottom;
    if (extra > 0) {
      document.body.style.marginBottom = `${extra}px`;
    }

    Header.scrollTo(thread);

    if (extra > 0 && !Nav.haveExtra) {
      Nav.haveExtra = true;
      return $.on(document, 'scroll', Nav.removeExtra);
    }
  },

  removeExtra() {
    const extra =
      document.documentElement.clientHeight -
      document.body.getBoundingClientRect().bottom;
    if (extra > 0) {
      return (document.body.style.marginBottom = `${extra}px`);
    } else {
      document.body.style.marginBottom = '';
      delete Nav.haveExtra;
      return $.off(document, 'scroll', Nav.removeExtra);
    }
  },
};
export default Nav;
