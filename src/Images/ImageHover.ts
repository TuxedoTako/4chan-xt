import Callbacks from "../classes/Callbacks";
import Header from "../General/Header";
import UI from "../General/UI";
import { g, Conf, doc } from "../globals/globals";
import $ from "../platform/$";
import { SECOND } from "../platform/helpers";
import ImageCommon from "./ImageCommon";
import Volume from "./Volume";
import Post, { File } from "../classes/Post";
import CatalogThread from "../classes/CatalogThread";
import Sound from "./Sound";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var ImageHover = {
  init() {
    if (!['index', 'thread'].includes(g.VIEW)) return;

    if (Conf['Image Hover']) {
      Callbacks.Post.push({
        name: 'Image Hover',
        cb: this.node
      });
    }

    if (Conf['Image Hover in Catalog']) {
      return Callbacks.CatalogThread.push({
        name: 'Image Hover',
        cb: this.catalogNode
      });
    }
  },

  node(this: Post) {
    return this.files.filter(file => (file.isImage || file.isVideo) && file.thumb).map(file =>
      $.on(file.thumb, 'mouseover', ImageHover.mouseover(this, file)));
  },

  catalogNode(this: CatalogThread) {
    const file = this.thread.OP.files[0];
    if (!file || (!file.isImage && !file.isVideo)) return;

    return $.on(this.nodes.thumb, 'mouseover', ImageHover.mouseover(this.thread.OP, file));
  },

  mouseover(post: Post, file: File) {
    return function (e: Event) {
      if (!doc.contains(this)) return;
      if (file.isExpanding || file.isExpanded || g.SITE.isThumbExpanded?.(file)) return;

      let el: HTMLImageElement | HTMLVideoElement;
      const error = ImageHover.error(post, file);
      if (ImageCommon.cache?.dataset.fileID === `${post.fullID}.${file.index}`) {
        el = ImageCommon.popCache();
        $.on(el, 'error', error);
      } else {
        el = $.el(file.isVideo ? 'video' : 'img');
        el.dataset.fileID = `${post.fullID}.${file.index}`;
        $.on(el, 'error', error);
        el.src = file.url;
      }

      if (Conf['Restart when Opened']) {
        ImageCommon.rewind(el);
        ImageCommon.rewind(this);
      }

      el.id = 'ihover';
      $.add(Header.hover, el);
      if (el instanceof HTMLVideoElement) {
        el.loop = true;
        el.controls = false;
        Volume.setup(el);
        if (Conf['Autoplay']) {
          el.play();
          if (this.nodeName === 'VIDEO') {
            this.currentTime = el.currentTime;
          }
        }
      }

      let width: number, height: number;
      if (file.dimensions) {
        [width, height] = file.dimensions.split('x').map((x) => +x);
        const maxWidth = doc.clientWidth;
        const maxHeight = doc.clientHeight - UI.hover.padding;
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        width *= scale;
        height *= scale;
        el.style.maxWidth = `${width}px`;
        el.style.maxHeight = `${height}px`;
      }

      if (Conf['Enable sound posts'] && Conf['Allow Sound']) {
        Sound.setupSoundpost(el, file);
      }

      return UI.hover({
        root: this,
        el,
        latestEvent: e,
        endEvents: 'mouseout click',
        height,
        width,
        noRemove: true,
        cb() {
          $.off(el, 'error', error);
          ImageCommon.pushCache(el);
          ImageCommon.pause(el);
          $.rm(el);
          if (file.audio) {
            file.audio.remove();
            delete file.audio;
            if (file.audioSlider) {
              file.audioSlider.remove();
              delete file.audioSlider;
            }
          }
          return el.removeAttribute('style');
        }
      });
    };
  },

  error(post: Post, file: File) {
    return function () {
      if (ImageCommon.decodeError(this, file)) return;

      return ImageCommon.error(this, post, file, 3 * SECOND, URL => {
        if (URL) {
          return this.src = URL + (this.src === URL ? '?' + Date.now() : '');
        } else {
          return $.rm(this);
        }
      });
    };
  }
};

export default ImageHover;
