import DataBoard from '../classes/DataBoard';
import { Conf, g } from '../globals/globals';
import $ from '../platform/$';

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const PostSuccessful = {
  init() {
    if (!Conf['Remember Your Posts']) {
      return;
    }
    return $.ready(this.ready);
  },

  ready() {
    if (document.title !== 'Post successful!') {
      return;
    }

    let [_, threadID, postID] = $('h1').nextSibling.textContent.match(
      /thread:(\d+),no:(\d+)/
    );
    postID = +postID;
    threadID = +threadID || postID;

    const db = new DataBoard('yourPosts');
    return db.set({
      boardID: g.BOARD.ID,
      threadID,
      postID,
      val: true,
    });
  },
};
export default PostSuccessful;
