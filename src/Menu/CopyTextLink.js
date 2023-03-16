import { g, Conf } from '../globals/globals';
import $ from '../platform/$';
import Menu from './Menu';

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const CopyTextLink = {
  init() {
    if (
      !['index', 'thread'].includes(g.VIEW) ||
      !Conf['Menu'] ||
      !Conf['Copy Text Link']
    ) {
      return;
    }

    const a = $.el('a', {
      className: 'copy-text-link',
      href: 'javascript:;',
      textContent: 'Copy Text',
    });
    $.on(a, 'click', CopyTextLink.copy);

    return Menu.menu.addEntry({
      el: a,
      order: 12,
      open(post) {
        CopyTextLink.text = (post.origin || post).commentOrig();
        return true;
      },
    });
  },

  copy() {
    const el = $.el('textarea', {
      className: 'copy-text-element',
      value: CopyTextLink.text,
    });
    $.add(document.body, el);
    el.select();
    try {
      document.execCommand('copy');
    } catch (error) {}
    return $.rm(el);
  },
};
export default CopyTextLink;
