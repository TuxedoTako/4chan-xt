import Callbacks from '../classes/Callbacks';
import { Conf, g } from '../globals/globals';
import $ from '../platform/$';
import $$ from '../platform/$$';

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const RemoveSpoilers = {
  init() {
    if (Conf['Reveal Spoilers']) {
      $.addClass(document.documentElement, 'reveal-spoilers');
    }

    if (!Conf['Remove Spoilers']) {
      return;
    }

    Callbacks.Post.push({
      name: 'Reveal Spoilers',
      cb: this.node,
    });

    if (g.VIEW === 'archive') {
      return $.ready(() => RemoveSpoilers.unspoiler($.id('arc-list')));
    }
  },

  node() {
    return RemoveSpoilers.unspoiler(this.nodes.comment);
  },

  unspoiler(el) {
    const spoilers = $$(g.SITE.selectors.spoiler, el);
    for (var spoiler of spoilers) {
      var span = $.el('span', { className: 'removed-spoiler' });
      $.replace(spoiler, span);
      $.add(span, spoiler.childNodes);
    }
  },
};
export default RemoveSpoilers;
