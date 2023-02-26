import { Conf } from "../globals/globals";
import $ from "../platform/$";
import PassMessagePage from './PassMessage/PassMessage.html';
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

const PassMessage = {
  init() {
    if (Conf['passMessageClosed']) { return; }
    const msg = $.el('div',
      { className: 'box-outer top-box' }
      ,
      { innerHTML: PassMessagePage });
    msg.style.cssText = 'padding-bottom: 0;';
    const close = $('a', msg);
    $.on(close, 'click', function () {
      $.rm(msg);
      return $.set('passMessageClosed', true);
    });
    return $.ready(function () {
      let hd;
      if (hd = $.id('hd')) {
        return $.after(hd, msg);
      } else {
        return $.prepend(document.body, msg);
      }
    });
  }
};
export default PassMessage;
