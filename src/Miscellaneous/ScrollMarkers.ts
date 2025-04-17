import Header from "../General/Header";
import { Conf, doc, g } from "../globals/globals";
import $ from "../platform/$";
import { debounce } from "../platform/helpers";

interface MarkerData {
  el?: HTMLButtonElement,
  classList: string,
  ariaLabel: string,
  top: string,
  height: string;
}

const ScrollMarkers = {
  init() {
    ScrollMarkers.container = $.el('div', { classList: 'scroll-marker-container' });
    doc.insertAdjacentElement('afterbegin', ScrollMarkers.container);
    $.on(ScrollMarkers.container, 'click', (e) => {
      const { postId } = (e.target as HTMLElement).dataset;
      if (postId) Header.scrollTo(g.posts[postId].nodes.root);
    });
    new ResizeObserver(ScrollMarkers.markScroll).observe(doc)
  },

  container: undefined as HTMLElement,

  // Keep instead of redoing so renewing doesn't lose keyboard focus
  markers: undefined as Map<string, MarkerData>,

  markScroll: debounce(100, () => {
    if (!Conf['Scroll Markers']) {
      ScrollMarkers.container.innerText = '';
      ScrollMarkers.markers = undefined;
      return;
    }

    const newMarkers = new Map<string, MarkerData>();

    g.posts?.forEach((post) => {
      const postEl = post.nodes.root;
      let isReply = false;
      if ($.hasClass(postEl, 'quotesYou')) {
        isReply = true;
      } else if (!$.hasClass(postEl, 'yourPost')) {
        return;
      }

      const postPosition = postEl.getBoundingClientRect();

      newMarkers.set(`${post.boardID}.${post.ID}`, {
        classList: `post-scroll-marker ${isReply ? 'reply' : 'you'}-scroll-marker`,
        ariaLabel: `Jump to ${isReply ? 'reply to ' : ''} my post`,
        top: (((postPosition.top + window.scrollY) / doc.scrollHeight) * 100).toFixed(1),
        height: Math.max(1, (postPosition.height / doc.scrollHeight) * 100).toFixed(1),
      })
    });

    let previousEl: HTMLButtonElement;

    for (const [key, marker] of newMarkers) {
      const existing = ScrollMarkers.markers?.get(key);
      let el = existing?.el;
      if (!el) {
        el = $.el('button', { type: 'button' });
        if (previousEl) {
          previousEl.insertAdjacentElement('afterend', el);
        } else {
          $.add(ScrollMarkers.container, el);
        }
      }
      el.classList = marker.classList;
      el.style.setProperty('--top', marker.top);
      el.style.setProperty('--height', marker.height);
      el.dataset.postId = key;
      marker.el = el;

      previousEl = el;

      document.createElement('button')
    }

    // Remove those that don't exist anymore
    if (ScrollMarkers.markers) {
      for (const [key, { el }] of ScrollMarkers.markers) {
        if (!newMarkers.has(key)) el.remove();
      }
    }
    ScrollMarkers.markers = newMarkers;
  }, false),
};

export default ScrollMarkers;