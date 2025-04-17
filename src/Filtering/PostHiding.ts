import Callbacks from "../classes/Callbacks";
import DataBoard from "../classes/DataBoard";
import type Post from "../classes/Post";
import BoardConfig from "../General/BoardConfig";
import Get from "../General/Get";
import UI from "../General/UI";
import { g, Conf, doc } from "../globals/globals";
import Menu from "../Menu/Menu";
import $ from "../platform/$";
import { dict } from "../platform/helpers";
import Recursive from "./Recursive";
import Icon from '../Icons/icon';

/** Used in DataBoards data */
interface HideOptions {
  thisPost?: boolean;
  makeStub: boolean;
  hideRecursively: boolean;
  byId?: boolean;
};

var PostHiding = {
  db: undefined as DataBoard,
  /** poster Ids to filter */
  posterIdDb: undefined as DataBoard,

  init() {
    if (!['index', 'thread'].includes(g.VIEW) || (!Conf['Reply Hiding Buttons'] && !(Conf['Menu'] && Conf['Reply Hiding Link']))) { return; }

    if (Conf['Reply Hiding Buttons']) {
      $.addClass(doc, "reply-hide");
    }

    this.db = new DataBoard('hiddenPosts');
    this.posterIdDb = new DataBoard('hiddenPosterIds');
    Callbacks.Post.push({
      name: 'Reply Hiding',
      cb:   this.node
    });
  },

  isHidden(boardID, threadID, postID) {
    return !!(PostHiding.db && PostHiding.db.get({boardID, threadID, postID}));
  },

  node(this: Post) {
    if (!this.isReply || this.isClone || this.isFetchedQuote) return;

    let data: HideOptions = PostHiding.db.get({boardID: this.board.ID, threadID: this.thread.ID, postID: this.ID});
    if (!data && this.info.uniqueID) {
      const hiddenPosterIds: Record<string, HideOptions> = PostHiding.posterIdDb.get(
        { boardID: this.board.ID, threadID: this.thread.ID }
      );
      if (hiddenPosterIds && this.info.uniqueID in hiddenPosterIds) {
        data = hiddenPosterIds[this.info.uniqueID];
        // thisPost is only on the first hidden posts, it shouldn't apply when hiding on poster ID
        data.thisPost = true;
      }
    }

    if (data) {
      if (data.thisPost) {
        PostHiding.hide(this, data.makeStub, data.hideRecursively, 'Hidden manually');
      } else {
        PostHiding.hideRecursive(this, data.makeStub);
      }
    }

    if (!Conf['Reply Hiding Buttons']) { return; }

    const button = PostHiding.makeButton(this, 'hide');
    const sa = g.SITE.selectors.sideArrows;
    if (sa) {
      const sideArrows = $(sa, this.nodes.root);
      $.replace(sideArrows.firstChild, button);
      sideArrows.className = 'replacedSideArrows';
    } else {
      $.prepend(this.nodes.info, button);
    }
  },

  menu: {
    post: undefined as Post,

    async init() {
      if (!['index', 'thread'].includes(g.VIEW) || !Conf['Menu'] || !Conf['Reply Hiding Link']) return;

      await new Promise(res => BoardConfig.ready(res));

      // Hide
      let applyHide = $.el('a', {
        textContent: 'Apply',
        href: 'javascript:;'
      });
      $.on(applyHide, 'click', PostHiding.menu.hide);

      const hideOptions = [
        { el: applyHide },
        { el: UI.checkbox('thisPost', 'This post', true) },
        { el: UI.checkbox('replies', 'Hide replies', Conf['Recursive Hiding']) },
        { el: UI.checkbox('makeStub', 'Make stub', Conf['Stubs']) },
      ];
      if (g.BOARD.config.user_ids) {
        hideOptions.push({ el: UI.checkbox('byId', 'By poster id', false) });
      }

      Menu.menu.addEntry({
        el: $.el('div', {
          className: 'hide-reply-link',
          textContent: 'Hide'
        }),
        order: 20,
        open(post) {
          if (!post.isReply || post.isClone || post.isHidden) {
            return false;
          }
          PostHiding.menu.post = post;
          return true;
        },
        subEntries: hideOptions
      });

      // Show
      const applyShow = $.el('a', {
        textContent: 'Apply',
        href: 'javascript:;'
      });
      $.on(applyShow, 'click', PostHiding.menu.show);

      const thisPost = UI.checkbox('thisPost', 'This post',    false);
      const replies  = UI.checkbox('replies',  'Show replies', false);
      const hideStubLink = $.el('a', {
        textContent: 'Hide stub',
        href: 'javascript:;'
      });
      $.on(hideStubLink, 'click', PostHiding.menu.hideStub);

      const showOptions = [
        { el: applyShow },
        { el: thisPost },
        { el: replies },
      ];
      let byId: HTMLElement;
      if (g.BOARD.config.user_ids) {
        byId = UI.checkbox('byId', 'By poster id', false);
        showOptions.push({ el: byId });
      }

      Menu.menu.addEntry({
        el: $.el('div', {
          className: 'show-reply-link',
          textContent: 'Show'
        }),
        order: 20,
        open(post: Post) {
          if (!post.isReply || post.isClone || !post.isHidden) {
            return false;
          }
          const data = PostHiding.db.get({boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID});
          if (!data) return false;

          PostHiding.menu.post = post;
          thisPost.firstChild.checked = post.isHidden;
          replies.firstChild.checked = data.hideRecursively ?? Conf['Recursive Hiding'];
          if (byId) byId.firstChild.checked = data.byId;
          return true;
        },
        subEntries: showOptions
      });

      Menu.menu.addEntry({
        el: hideStubLink,
        order: 15,
        open(post) {
          let data;
          if (!post.isReply || post.isClone || !post.isHidden) {
            return false;
          }
          if (!(data = PostHiding.db.get({boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID}))) {
            return false;
          }
          return PostHiding.menu.post = post;
        }
      });
    },

    hide() {
      const parent   = this.parentNode;
      const thisPost = $('input[name=thisPost]', parent).checked;
      const replies  = $('input[name=replies]',  parent).checked;
      const makeStub = $('input[name=makeStub]', parent).checked;
      const byId     = $('input[name=byId]', parent)?.checked;
      const {post}   = PostHiding.menu as { post: Post };

      if (!thisPost && !replies && !byId) return;

      if (thisPost) {
        PostHiding.hide(post, makeStub, replies, 'Hidden manually');
      } else if (replies) {
        PostHiding.hideRecursive(post, makeStub);
      }
      if (byId) {
        const msg = `Hidden because of poster ID ${post.info.uniqueID}`;
        g.posts.forEach((p) => {
          if (p.info.uniqueID === post.info.uniqueID && p !== post) {
            PostHiding.hide(p, makeStub, replies, msg);
            PostHiding.saveHiddenState(p, true, thisPost, makeStub, replies, byId);
          }
        });
        const data: Record<string, HideOptions> = PostHiding.posterIdDb.get(
          { boardID: post.boardID, threadID: post.threadID, defaultValue: dict() }
        );
        if (!(post.info.uniqueID in data)) {
          data[post.info.uniqueID] = { makeStub, hideRecursively: replies };
          PostHiding.posterIdDb.set({ boardID: post.boardID, threadID: post.threadID, val: data });
        }
      }

      PostHiding.saveHiddenState(post, true, thisPost, makeStub, replies, byId);
      $.event('CloseMenu');
    },

    show() {
      const parent   = this.parentNode;
      const thisPost = $('input[name=thisPost]', parent).checked;
      const replies  = $('input[name=replies]',  parent).checked;
      const byId     = $('input[name=byId]', parent)?.checked;
      const { post } = PostHiding.menu as { post: Post };
      const { boardID, threadID, postID } = post;

      if (!thisPost && !replies && !byId) return;

      if (thisPost) {
        PostHiding.show(post, replies);
      } else if (replies) {
        Recursive.apply(PostHiding.show, post, true);
        Recursive.rm(PostHiding.hide, post);
      }
      if (byId) {
        g.posts.forEach((p) => {
          if (p.info.uniqueID === post.info.uniqueID && p !== post) {
            PostHiding.show(p, replies);
            const data = PostHiding.db.get({ boardID, threadID, postID });
            if (data) {
              PostHiding.saveHiddenState(post, !(thisPost && replies), !thisPost, data.makeStub, !replies, byId);
            }
          }
        });
        const byIdState: Record<string, HideOptions> = PostHiding.posterIdDb.get({ boardID, threadID });
        if (byIdState && post.info.uniqueID in byIdState) {
          delete byIdState[post.info.uniqueID];
          PostHiding.posterIdDb.set({ boardID, threadID, val: byIdState });
        }
      }

      const data = PostHiding.db.get({ boardID, threadID, postID })
      if (data) {
        PostHiding.saveHiddenState(post, !(thisPost && replies), !thisPost, data.makeStub, !replies, byId);
      }
      $.event('CloseMenu');
    },
    hideStub() {
      let data;
      const {post} = PostHiding.menu;
      if (data = PostHiding.db.get({boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID})) {
        PostHiding.show(post, data.hideRecursively);
        PostHiding.hide(post, false, data.hideRecursively);
        PostHiding.saveHiddenState(post, true, true, false, data.hideRecursively, data.byId);
      }
      $.event('CloseMenu');
    }
  },

  makeButton(post, type) {
    const span = $.el('span', {
      className: 'stub-icon',
    });
    const a = $.el('a', {
      className: `${type}-post-button ${type}-reply-button`,
      href:      'javascript:;'
    });
    Icon.set(span, type === 'hide' ? 'squareMinus' : 'squarePlus');
    $.add(a, span);
    $.on(a, 'click', PostHiding.toggle);
    return a;
  },

  saveHiddenState(
    post: Post,
    isHiding: boolean,
    thisPost?: boolean,
    makeStub?: boolean,
    hideRecursively?: boolean,
    byId?: boolean
  ) {
    const data = {
      boardID:  post.board.ID,
      threadID: post.thread.ID,
      postID:   post.ID
    };
    if (isHiding) {
      data.val = {
        thisPost: thisPost !== false, // undefined -> true
        makeStub,
        hideRecursively,
        byId
      } satisfies HideOptions;
      PostHiding.db.set(data);
    } else {
      PostHiding.db.delete(data);
    }
  },

  toggle() {
    const post: Post = Get.postFromNode(this);
    post.isHidden ? PostHiding.show(post) : PostHiding.hide(post, undefined, undefined, 'Hidden manually');
    PostHiding.saveHiddenState(post, post.isHidden);
  },

  hide(
    post: Post,
    makeStub: boolean = Conf['Stubs'],
    hideRecursively: boolean = Conf['Recursive Hiding'],
    reason?: string
  ) {
    if (post.isHidden) return;
    post.isHidden = true;

    if (hideRecursively) {
      PostHiding.hideRecursive(post, makeStub);
    }

    for (var quotelink of Get.allQuotelinksLinkingTo(post)) {
      $.addClass(quotelink, 'filtered');
    }

    if (!makeStub) {
      post.nodes.root.hidden = true;
      return;
    }

    post.nodes.stub = $.el('div', { className: 'stub' });
    const a = PostHiding.makeButton(post, 'show');
    $.add(a, $.el('span', { className: 'stub-name', textContent: post.info.nameBlock}));

    let reasons = post.filterResults?.reasons || [];
    if (reason) reasons = [...reasons, reason];
    if (Conf['Filter Reason'] && reasons.length) {
      const reasonsSpan = $.el('span', { className: 'stub-reasons' });
      $.add(reasonsSpan, reasons.map(re => $.el('span', { className: 'stub-reason', textContent: re })));
      a.appendChild(reasonsSpan);
    }

    $.add(post.nodes.stub, a);

    if (!Conf['Filter Reason'] && reasons) post.nodes.stub.title = reasons.join(' & ');
    if (Conf['Menu']) {
      $.add(post.nodes.stub, Menu.makeButton(post));
    }
    $.prepend(post.nodes.root, post.nodes.stub);
  },

  hideRecursive(post: Post, makeStub: boolean) {
    Recursive.applyAndAdd(PostHiding.hide, post, makeStub, true, `Hidden recursively from ${post.ID}`);
  },

  show(post: Post, showRecursively: boolean = Conf['Recursive Hiding']) {
    if (post.nodes.stub) {
      $.rm(post.nodes.stub);
      delete post.nodes.stub;
    } else {
      post.nodes.root.hidden = false;
    }
    post.isHidden = false;
    if (showRecursively) {
      Recursive.apply(PostHiding.show, post, true);
      Recursive.rm(PostHiding.hide, post);
    }
    for (var quotelink of Get.allQuotelinksLinkingTo(post)) {
      $.rmClass(quotelink, 'filtered');
    }
  }
};
export default PostHiding;
