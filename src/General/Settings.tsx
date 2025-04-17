import SettingsPage from './Settings/SettingsHtml';
import FilterGuidePage from './Settings/Filter-guide.html';
import SaucePage from './Settings/Sauce.html';
import AdvancedPage from './Settings/Advanced.html';
import KeybindsPage from './Settings/Keybinds.html';
import FilterSelectPage from './Settings/Filter-select.html';
import ExportDialog from './Settings/Export.html';
import Redirect from '../Archive/Redirect';
import Config from '../config/Config';
import ImageHost from '../Images/ImageHost';
import CustomCSS from '../Miscellaneous/CustomCSS';
import FileInfo from '../Miscellaneous/FileInfo';
import Keybinds from '../Miscellaneous/Keybinds';
import Time from '../Miscellaneous/Time';
import Favicon from '../Monitoring/Favicon';
import ThreadUpdater from '../Monitoring/ThreadUpdater';
import Unread from '../Monitoring/Unread';
import $$ from '../platform/$$';
import $ from '../platform/$';
import meta from '../../package.json';
import { c, Conf, d, doc, g } from '../globals/globals';
import Header from './Header';
import h, { hFragment } from '../globals/jsx';
import { dict } from '../platform/helpers';
import Icon from '../Icons/icon';
import UI from './UI';

var Settings = {
  dialog: undefined as HTMLDivElement | undefined,

  init() {
    // 4chan X settings link
    const link = $.el('a', {
      className: 'settings-link',
      title:     `${meta.name} Settings`,
      href:      'javascript:;'
    });
    Icon.set(link, 'wrench', 'Settings');
    $.on(link, 'click', Settings.open);

    Header.addShortcut('settings', link, 820);

    const add = this.addSection;

    add('Main',     this.main);
    add('Filter',   this.filter);
    add('Sauce',    this.sauce);
    add('Advanced', this.advanced);
    add('Keybinds', this.keybinds);

    $.on(d, 'AddSettingsSection',   Settings.addSection);
    $.on(d, 'OpenSettings', e => Settings.open(e.detail));

    if ((g.SITE.software === 'yotsuba') && Conf['Disable Native Extension']) {
      if ($.hasStorage) {
        // Run in page context to handle case where 4chan X has localStorage access but not the page.
        // (e.g. Pale Moon 26.2.2, GM 3.8, cookies disabled for 4chan only)
        $.global('disableNativeExtension');
      } else {
        $.global('disableNativeExtensionNoStorage');
      }
    }
  },

  open(openSection) {
    let dialog, sectionToOpen;
    if (Settings.dialog) { return; }
    $.event('CloseMenu');

    Settings.dialog = (dialog = $.el('div',
      { id: 'overlay' }
      , SettingsPage));

    $.on($('.export', dialog), 'click',  Settings.export);
    $.on($('.import', dialog), 'click',  Settings.import);
    $.on($('.reset',  dialog), 'click',  Settings.reset);
    $.on($('input',   dialog), 'change', Settings.onImport);

    const links = [];
    for (var section of Settings.sections) {
      var link = $.el('a', {
        className: `tab-${section.hyphenatedTitle}`,
        textContent: section.title,
        href: 'javascript:;'
      }
      );
      $.on(link, 'click', Settings.openSection.bind(section));
      links.push(link, $.tn(' | '));
      if (section.title === openSection) { sectionToOpen = link; }
    }
    links.pop();
    $.add($('.sections-list', dialog), links);
    if (openSection !== 'none') { (sectionToOpen ? sectionToOpen : links[0]).click(); }

    Icon.set($('.close', dialog), 'xmark');
    $.on($('.close', dialog), 'click', Settings.close);
    $.on(window, 'beforeunload', Settings.close);
    $.on(dialog, 'click', () => {
      // Do not close when the mouse ends up outside the modal when selecting text in an input.
      if (d.activeElement?.tagName === 'INPUT' || d.activeElement?.tagName === 'TEXTAREA') return;
      Settings.close();
    });
    $.on(dialog.firstElementChild, 'click', e => e.stopPropagation());

    $.add(d.body, dialog);
    links[0].focus();

    $.event('OpenSettings', null, dialog);
  },

  close() {
    if (!Settings.dialog) { return; }
    // Unfocus current field to trigger change event.
    d.activeElement?.blur();
    $.rm(Settings.dialog);
    delete Settings.dialog;
  },

  sections: [],

  addSection(title, open) {
    if (typeof title !== 'string') {
      ({title, open} = title.detail);
    }
    const hyphenatedTitle = title.toLowerCase().replace(/\s+/g, '-');
    Settings.sections.push({title, hyphenatedTitle, open});
  },

  openSection() {
    let selected;
    if (selected = $('.tab-selected', Settings.dialog)) {
      $.rmClass(selected, 'tab-selected');
    }
    $.addClass($(`.tab-${this.hyphenatedTitle}`, Settings.dialog), 'tab-selected');
    const section = $('section', Settings.dialog);
    $.rmAll(section);
    section.className = `section-${this.hyphenatedTitle}`;
    this.open(section, g);
    section.scrollTop = 0;
    $.event('OpenSettings', null, section);
  },

  warnings: {
    localStorage(cb) {
      if ($.cantSync) {
        const why = $.cantSet ? 'save your settings' : 'synchronize settings between tabs';
        cb($.el('li', {
          textContent: `\
${meta.name} needs local storage to ${why}.
Enable it on boards.${location.hostname.split('.')[1]}.org in your browser's privacy settings (may be listed as part of "local data" or "cookies").\
`
        }
        )
        );
      }
    },
    ads(cb) {
      $.onExists(doc, '.adg-rects > .desktop', ad => $.onExists(ad, 'iframe', function() {
        const url = Redirect.to('thread', {boardID: 'qa', threadID: 362590});
        cb($.el('li',
          <>
            To protect yourself from <a href={url} target="_blank">malicious ads</a>,
            you should <a href="https://github.com/gorhill/uBlock#ublock-origin" target="_blank">block ads</a> on 4chan.
          </>
        )
        );
      }));
    }
  },

  main(section) {
    let key;
    const warnings = $.el('fieldset',
      {hidden: true}
    ,
      {innerHTML: '<legend>Warnings</legend><ul></ul>'});
    const addWarning = function(item) {
      $.add($('ul', warnings), item);
      warnings.hidden = false;
    };
    for (key in Settings.warnings) {
      var warning = Settings.warnings[key];
      warning(addWarning);
    }
    $.add(section, warnings);

    const items  = dict();
    const inputs = dict();
    const addCheckboxes = function(root, obj) {
      const containers = [root];
      const result = [];
      for (key in obj) {
        var arr = obj[key];
        if (arr instanceof Array) {
          var description = arr[1];
          var div = $.el('div',
            { innerHTML: `<label><input type="checkbox" name="${key}">${key}</label><span class="description">: ${description}</span>` });
          div.dataset.name = key;
          var input = $('input', div);
          $.on(input, 'change', $.cb.checked);
          $.on(input, 'change', function() { this.parentNode.parentNode.dataset.checked = this.checked; });
          items[key] = Conf[key];
          inputs[key] = input;
          var level = arr[2] || 0;
          if (containers.length <= level) {
            var container = $.el('div', {className: 'suboption-list' });
            $.add(containers[containers.length-1].lastElementChild, container);
            containers[level] = container;
          } else if (containers.length > (level+1)) {
            containers.splice(level+1, containers.length - (level+1));
          }
          result.push($.add(containers[level], div));
        }
      }
      return result;
    };

    for (var keyFS in Config.main) {
      var obj = Config.main[keyFS];
      var fs = $.el('fieldset',
        { innerHTML: `<legend>${keyFS}</legend>` });
      addCheckboxes(fs, obj);
      if (keyFS === 'Posting and Captchas') {
        $.add(fs, $.el('p',
          {innerHTML: 'For more info on captcha options and issues, see the <a href="' + meta.captchaFAQ + '" target="_blank">captcha FAQ</a>.'})
        );
      }
      $.add(section, fs);
    }
    addCheckboxes($('div[data-name="JSON Index"] > .suboption-list', section), Config.Index);

    $.get(items, function(items) {
      for (key in items) {
        var val = items[key];
        inputs[key].checked = val;
        inputs[key].parentNode.parentNode.dataset.checked = val;
      }
    });

    const div = $.el('div',
      {innerHTML: '<button></button><span class="description">: Clear manually-hidden threads and posts on all boards. Reload the page to apply.'});
    const button = $('button', div);
    $.get({hiddenThreads: dict(), hiddenPosts: dict()}, function({hiddenThreads, hiddenPosts}) {
      let board, ID, site, thread;
      let hiddenNum = 0;
      for (ID in hiddenThreads) {
        site = hiddenThreads[ID];
        if (ID !== 'boards') {
          for (ID in site.boards) {
            board = site.boards[ID];
            hiddenNum += Object.keys(board).length;
          }
        }
      }
      for (ID in hiddenThreads.boards) {
        board = hiddenThreads.boards[ID];
        hiddenNum += Object.keys(board).length;
      }
      for (ID in hiddenPosts) {
        site = hiddenPosts[ID];
        if (ID !== 'boards') {
          for (ID in site.boards) {
            board = site.boards[ID];
            for (ID in board) {
              thread = board[ID];
              hiddenNum += Object.keys(thread).length;
            }
          }
        }
      }
      for (ID in hiddenPosts.boards) {
        board = hiddenPosts.boards[ID];
        for (ID in board) {
          thread = board[ID];
          hiddenNum += Object.keys(thread).length;
        }
      }
      button.textContent = `Hidden: ${hiddenNum}`;
    });
    $.on(button, 'click', function() {
      this.textContent = 'Hidden: 0';
      $.get('hiddenThreads', dict(), function({hiddenThreads}){
        if ($.hasStorage && (g.SITE.software === 'yotsuba')) {
          let boardID;
          for (boardID in hiddenThreads['4chan.org']?.boards) {
            localStorage.removeItem(`4chan-hide-t-${boardID}`);
          }
          for (boardID in hiddenThreads.boards) {
            localStorage.removeItem(`4chan-hide-t-${boardID}`);
          }
        }
        $.delete(['hiddenThreads', 'hiddenPosts']);
      });
    });
    $('input[name="Stubs"]', section).closest('fieldset').insertAdjacentElement('beforeend', div);
  },

  isExportModalOpen: false,

  async export() {
    let exportHistory = Conf['Export History'];
    let cancelled = false;

    if (Conf['Ask to Export History']) {
      if (Settings.isExportModalOpen) return;

      const dialog = UI.dialog('export-dialog', { innerHTML: ExportDialog });
      const form = $('form', dialog) as HTMLFormElement;
      const { history, ask } = form.elements as any as { history: HTMLInputElement, ask: HTMLInputElement };
      history.checked = Conf['Export History'];
      $.add(d.body, dialog);

      const exportBtnRect = ($('.export', Settings.dialog) as HTMLElement).getBoundingClientRect();
      dialog.style.top = `${exportBtnRect.y + exportBtnRect.height}px`;
      dialog.style.left = `${exportBtnRect.x}px`;

      Settings.isExportModalOpen = true;

      await new Promise<void>(resolve => {
        const close = () => {
          dialog.remove();
          resolve();
          Settings.isExportModalOpen = false;
        };

        $.on(form, 'submit', (e) => {
          e.preventDefault();
          exportHistory = history.checked
          $.set('Export History', exportHistory);
          $.set('Ask to Export History', ask.checked);
          close();
        });

        $.on($('#cancel-export', dialog), 'click', () => {
          cancelled = true;
          close();
        });
      });

      if (cancelled) return;
    }

    // Make sure to export the most recent data, but don't overwrite existing `Conf` object.
    const Conf2 = dict();
    $.extend(Conf2, Conf);
    if (!exportHistory) {
      delete Conf2.hiddenThreads;
      delete Conf2.hiddenPosts;
      delete Conf2.hiddenPosterIds;
      delete Conf2.lastReadPosts;
      delete Conf2.yourPosts;
      delete Conf2.watchedThreads;
      delete Conf2.cooldowns;
      delete Conf2['Index Sort'];
    }
    $.get(Conf2, function(Conf2) {
      // Don't export cached JSON data.
      delete Conf2['boardConfig'];
      Settings.downloadExport({version: g.VERSION, date: Date.now(), Conf: Conf2});
    });
  },

  downloadExport(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = $.el('a', {
      download: `${meta.name} v${g.VERSION}-${data.date}.json`,
      href: url
    }
    );
    const p = $('.imp-exp-result', Settings.dialog);
    $.rmAll(p);
    $.add(p, a);
    a.click();
  },

  import() {
    $('input[type=file]', this.parentNode).click();
  },

  onImport() {
    let file;
    if (!(file = this.files[0])) { return; }
    this.value = null;
    const output = $('.imp-exp-result');
    if (!confirm('Your current settings will be entirely overwritten, are you sure?')) {
      output.textContent = 'Import aborted.';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        Settings.loadSettings(dict.json(e.target.result), function (err) {
          if (err) {
            output.textContent = 'Import failed due to an error.';
          } else if (confirm('Import successful. Reload now?')) {
            window.location.reload();
          }
        });
      } catch (error) {
        const err = error;
        output.textContent = 'Import failed due to an error.';
        c.error(err.stack);
      }
    };
    reader.readAsText(file);
  },

  upgrade(data, version) {
    let corrupted, key, val;
    const changes = dict();
    const set = (key, value) => data[key] = (changes[key] = value);
    // XXX https://github.com/greasemonkey/greasemonkey/issues/2600
    if (corrupted = (version[0] === '"')) {
      try {
        version = JSON.parse(version);
      } catch (error) {}
    }
    const compareString = version.replace(/^XT /i, '').replace(/\d+/g, x => x.padStart(5, '0'));
    if (corrupted) {
      for (key in data) {
        val = data[key];
        if (typeof val === 'string') {
          try {
            var val2 = JSON.parse(val);
            set(key, val2);
          } catch (error1) {}
        }
      }
    }
    if (compareString < '00001.00014.00016.00001') {
      if (data['archiveLists'] != null) {
        set('archiveLists', data['archiveLists'].replace('https://mayhemydg.github.io/archives.json/archives.json', 'https://nstepien.github.io/archives.json/archives.json'));
      }
    }
    if (compareString < '00001.00014.00016.00007') {
      if (data['sauces'] != null) {
        set('sauces', data['sauces'].replace(
          /https:\/\/www\.deviantart\.com\/gallery\/#\/d%\$1%\$2;regexp:\/\^\\w\+_by_\\w\+\[_-\]d\(\[\\da-z\]\{6\}\)\\b\|\^d\(\[\\da-z\]\{6\}\)-\[\\da-z\]\{8\}-\//g,
          'javascript:void(open("https://www.deviantart.com/"+%$1.replace(/_/g,"-")+"/art/"+parseInt(%$2,36)));regexp:/^\\w+_by_(\\w+)[_-]d([\\da-z]{6})\\b/'
        ).replace(
          /\/\/imgops\.com\/%URL/g,
          '//imgops.com/start?url=%URL'
        )
        );
      }
    }
    if (compareString < '00001.00014.00017.00002') {
      if (data['jsWhitelist'] != null) {
        set('jsWhitelist', data['jsWhitelist'] + '\n\nhttps://hcaptcha.com\nhttps://*.hcaptcha.com');
      }
    }
    if (compareString < '00001.00014.00020.00004') {
      if (data['archiveLists'] != null) {
        set('archiveLists', data['archiveLists'].replace('https://nstepien.github.io/archives.json/archives.json', 'https://4chenz.github.io/archives.json/archives.json'));
      }
    }
    if (compareString < '00001.00014.00022.00003') {
      if (data['sauces']) {
        set('sauces', data['sauces'].replace(/^#?\s*https:\/\/www\.google\.com\/searchbyimage\?image_url=%(IMG|T?URL)&safe=off(?=$|;)/mg, 'https://www.google.com/searchbyimage?sbisrc=4chanx&image_url=%$1&safe=off'));
        if (compareString === '00001.00014.00022.00002' && !/\bsbisrc=/.test(data['sauces'])) {
          set('sauces', data['sauces'].replace(/^#?\s*https:\/\/lens\.google\.com\/uploadbyurl\?url=%(IMG|T?URL)(?=$|;)/m, 'https://www.google.com/searchbyimage?sbisrc=4chanx&image_url=%$1&safe=off'));
        }
      }
    }
    if (compareString < '00002.00003.00001.00000') {
      if (data['boardnav']) {
        set('boardnav', data['boardnav'].replace(
          '[external-text:"FAQ","4chan XT"]',
          `[external-text:"FAQ","${meta.faq}"]`
        ));
      }
    }
    if (compareString < '00002.00003.00006.00000') {
      set('RelativeTime', data['Relative Post Dates'] ? (data['Relative Date Title'] ? 'Hover' : 'Show') : 'No');
    }
    if (compareString === '00002.00009.00000.00000') {
      set('XEmbedder', data['Embed Tweets inline with fxTwitter'] ? 'fxt' : 'tf');
      set('fxtMaxReplies', data['Resolve Tweet Replies'] ? (data['Resolve all Tweet Replies'] ? 100 : 1) : 0);
      set('fxtLang', data['Translate non-English Tweets to English'] ? 'en' : '');
    }
    return changes;
  },

  loadSettings(data, cb) {
    if (data.version !== g.VERSION) {
      Settings.upgrade(data.Conf, data.version);
    }
    $.clear(function(err) {
      if (err) { return cb(err); }
      $.set(data.Conf, cb);
    });
  },

  reset() {
    if (confirm('Your current settings will be entirely wiped, are you sure?')) {
      $.clear(function(err) {
        if (err) {
          $('.imp-exp-result').textContent = 'Import failed due to an error.';
        } else if (confirm('Reset successful. Reload now?')) {
          window.location.reload();
        }
      });
    }
  },

  filter(section) {
    $.extend(section, { innerHTML: FilterSelectPage });
    const select = $('select', section);
    $.on(select, 'change', Settings.selectFilter);
    Settings.selectFilter.call(select);
  },

  selectFilter(this: HTMLSelectElement) {
    let name: string;
    const div = this.nextElementSibling as HTMLElement;
    if ((name = this.value) !== 'guide') {
      if (!$.hasOwn(Config.filter, name)) { return; }
      $.rmAll(div);
      const ta = $.el('textarea', {
        name,
        className: 'field',
        spellcheck: false
      }) as HTMLTextAreaElement;
      $.on(ta, 'change', $.cb.value);
      $.get(name, Conf[name], function(item) {
        ta.value = item[name];
        $.add(div, ta);
      });
      return;
    }
    const filterTypes = Object.keys(Config.filter)
      .filter(x => x !== 'general')
      .join(',\u200B'); // \u200B is zero width space, to control where line breaks happen on a narrow screen
    $.extend(div, { innerHTML: FilterGuidePage });
    $('#filterTypes', div).textContent = `type:\u200B${filterTypes};`;
    $('.warning', div).hidden = Conf['Filter'];
  },

  sauce(section) {
    $.extend(section, { innerHTML: SaucePage });
    $('.warning', section).hidden = Conf['Sauce'];
    const ta = $('textarea', section);
    $.get('sauces', Conf['sauces'], function(item) {
      ta.value = item['sauces'];
      ta.hidden = false;
    }); // XXX prevent Firefox from adding initialization to undo queue
    $.on(ta, 'change', $.cb.value);
  },

  advanced(section) {
    let input, name;
    $.extend(section, { innerHTML: AdvancedPage });
    for (var warning of $$('.warning', section)) { warning.hidden = Conf[warning.dataset.feature]; }

    const inputs = dict();
    for (input of $$('[name]', section)) {
      inputs[input.name] = input;
    }

    $.on(inputs['archiveLists'], 'change', function() {
      $.set('lastarchivecheck', 0);
      Conf['lastarchivecheck'] = 0;
      $.id('lastarchivecheck').textContent = 'never';
    });

    const items = dict();
    for (name in inputs) {
      input = inputs[name];
      if (!['Interval', 'Custom CSS', 'timeLocale'].includes(name)) {
        items[name] = Conf[name];
        var event = (
          (input.nodeName === 'SELECT') ||
          ['checkbox', 'radio'].includes(input.type) ||
          ((input.nodeName === 'TEXTAREA') && !(name in Settings))
        ) ? 'change' : 'input';
        $.on(input, event, $.cb[input.type === 'checkbox' ? 'checked' : 'value']);
        if (name in Settings) { $.on(input, event, Settings[name]); }
      }
    }

    $.get(items, function(items) {
      for (var key in items) {
        var val = items[key];
        input = inputs[key];
        input[input.type === 'checkbox' ? 'checked' : 'value'] = val;
        input.hidden = false; // XXX prevent Firefox from adding initialization to undo queue
        if (key in Settings) {
          Settings[key].call(input);
        }
      }
    });

    const listImageHost = $.id('list-fourchanImageHost');
    for (var textContent of ImageHost.suggestions) {
      $.add(listImageHost, $.el('option', {textContent}));
    }

    const interval  : HTMLInputElement  = inputs['Interval'];
    const customCSS : HTMLInputElement  = inputs['Custom CSS'];
    const applyCSS  : HTMLButtonElement = $('#apply-css', section);
    const timeLocale: HTMLInputElement  = inputs.timeLocale;

    interval.value             =  Conf['Interval'];
    customCSS.checked          =  Conf['Custom CSS'];
    inputs['usercss'].disabled = !Conf['Custom CSS'];
    applyCSS.disabled          = !Conf['Custom CSS'];
    timeLocale.value           =  Conf.timeLocale;

    $.on(interval,  'change', ThreadUpdater.cb.interval);
    $.on(customCSS, 'change', Settings.togglecss);
    $.on(applyCSS, 'click', () => CustomCSS.update());
    $.on(timeLocale, 'change', Settings.setTimeLocale);

    const itemsArchive = dict();
    for (name of ['archives', 'selectedArchives', 'lastarchivecheck']) { itemsArchive[name] = Conf[name]; }
    $.get(itemsArchive, function(itemsArchive) {
      $.extend(Conf, itemsArchive);
      Redirect.selectArchives();
      Settings.addArchiveTable(section);
    });

    const boardSelect    = $('#archive-board-select', section);
    const table          = $('#archive-table', section);
    const updateArchives = $('#update-archives', section);

    $.on(boardSelect, 'change', function() {
      $('tbody > :not([hidden])', table).hidden = true;
      $(`tbody > .${this.value}`, table).hidden = false;
    });

    $.on(updateArchives, 'click', () => Redirect.update(() => Settings.addArchiveTable(section)));

    $.on(inputs.beepVolume, 'change', () => { ThreadUpdater.playBeep(false); });
    $.on(inputs.beepSource, 'change', () => { ThreadUpdater.playBeep(false); });
  },

  addArchiveTable(section) {
    let boardID, o;
    $('#lastarchivecheck', section).textContent = Conf['lastarchivecheck'] === 0 ?
      'never'
    :
      new Date(Conf['lastarchivecheck']).toLocaleString();

    const boardSelect = $('#archive-board-select', section);
    const table       = $('#archive-table', section);
    const tbody       = $('tbody', section);

    $.rmAll(boardSelect);
    $.rmAll(tbody);

    const archBoards = dict();
    for (var {uid, name, boards, files, software} of Conf['archives']) {
      if (!['fuuka', 'foolfuuka'].includes(software)) { continue; }
      for (boardID of boards) {
        o = archBoards[boardID] || (archBoards[boardID] = {
          thread: [],
          threadJSON: [],
          post:   [],
          file:   []
        });
        if (!o.threadJSON) o.threadJSON = [];
        var archive = [uid ?? name, name];
        o.thread.push(archive);
        if (software === 'foolfuuka') {
          o.post.push(archive);
          o.threadJSON.push(archive);
        }
        if (files.includes(boardID)) { o.file.push(archive); }
      }
    }

    const rows = [];
    const boardOptions = [];
    for (boardID of Object.keys(archBoards).sort()) { // Alphabetical order
      var row = $.el('tr',
        {className: `board-${boardID}`});
      row.hidden = boardID !== g.BOARD.ID;

      boardOptions.push($.el('option', {
        textContent: `/${boardID}/`,
        value:       `board-${boardID}`,
        selected:    boardID === g.BOARD.ID
      }));

      o = archBoards[boardID];
      for (var item of ['thread', 'threadJSON', 'post', 'file']) {
        $.add(row, Settings.addArchiveCell(boardID, o, item));
      }
      rows.push(row);
    }

    if (rows.length === 0) {
      boardSelect.hidden = (table.hidden = true);
      return;
    }

    boardSelect.hidden = (table.hidden = false);

    if (!(g.BOARD.ID in archBoards)) {
      rows[0].hidden = false;
    }

    $.add(boardSelect, boardOptions);
    $.add(tbody, rows);

    for (boardID in Conf['selectedArchives']) {
      var data = Conf['selectedArchives'][boardID];
      for (var type in data) {
        var select;
        var id = data[type];
        if (select = $(`select[data-boardid='${boardID}'][data-type='${type}']`, tbody)) {
          select.value = JSON.stringify(id);
          if (!select.value) { select.value = select.firstChild.value; }
        }
      }
    }
  },

  addArchiveCell(boardID, data, type) {
    const {length} = data[type];
    const td = $.el('td',
      {className: 'archive-cell'});

    if (!length) {
      td.textContent = '--';
      return td;
    }

    const options = [];
    let i = 0;
    while (i < length) {
      var archive = data[type][i++];
      options.push($.el('option', {
        value: JSON.stringify(archive[0]),
        textContent: archive[1]
      }));
    }

    $.extend(td, {innerHTML: '<select></select>'});
    const select = td.firstElementChild;
    if (!(select.disabled = length === 1)) {
      // XXX GM can't into datasets
      select.setAttribute('data-boardid', boardID);
      select.setAttribute('data-type', type);
      $.on(select, 'change', Settings.saveSelectedArchive);
    }
    $.add(select, options);

    return td;
  },

  saveSelectedArchive() {
    $.get('selectedArchives', Conf['selectedArchives'], ({selectedArchives}) => {
      (selectedArchives[this.dataset.boardid] || (selectedArchives[this.dataset.boardid] = dict()))[this.dataset.type] = JSON.parse(this.value);
      $.set('selectedArchives', selectedArchives);
      Conf['selectedArchives'] = selectedArchives;
      Redirect.selectArchives();
    });
  },

  boardnav() {
    Header.generateBoardList(this.value);
  },

  time() {
    this.nextElementSibling.textContent = Time.format(new Date(), this.value);
  },

  timeLocale() {
    Settings.time.call($('[name=time]', Settings.dialog));
  },

  backlink() {
    this.nextElementSibling.textContent = this.value.replace(/%(?:id|%)/g, x => ({'%id': '123456789', '%%': '%'})[x]);
  },

  fileInfo() {
    const data = {
      isReply: true,
      file: {
        url: `//${ImageHost.host()}/g/1334437723720.jpg`,
        name: 'd9bb2efc98dd0df141a94399ff5880b7.jpg',
        size: '276 KB',
        sizeInBytes: 276 * 1024,
        dimensions: '1280x720',
        isImage: true,
        isVideo: false,
        isSpoiler: true,
        tag: 'Loop'
      }
    };
    FileInfo.format(this.value, data, this.nextElementSibling);
  },

  favicon() {
    Favicon.switch();
    if ((g.VIEW === 'thread') && Conf['Unread Favicon']) { Unread.update(); }
    const img = this.nextElementSibling.children;
    const f = Favicon;
    const iterable = [f.SFW, f.unreadSFW, f.unreadSFWY, f.NSFW, f.unreadNSFW, f.unreadNSFWY, f.dead, f.unreadDead, f.unreadDeadY];
    for (let i = 0; i < iterable.length; i++) {
      var icon = iterable[i];
      if (!img[i]) { $.add(this.nextElementSibling, $.el('img')); }
      img[i].src = icon;
    }
  },

  togglecss() {
    if (($('textarea[name=usercss]', $.x('ancestor::fieldset[1]', this)).disabled = ($.id('apply-css').disabled = !this.checked))) {
      CustomCSS.rmStyle();
    } else {
      CustomCSS.addStyle();
    }
    $.cb.checked.call(this);
  },

  setTimeLocale(e: InputEvent) {
    const input = e.target as HTMLInputElement;
    try {
      if (input.value !== '') new Intl.DateTimeFormat(input.value);
      input.setCustomValidity('');
      Time.formatterCache.clear();
      $.cb.value.call(input);
      Settings.timeLocale.call(input);
    } catch (e) {
      input.setCustomValidity('Locale not recognized');
      input.reportValidity();
    }
  },

  keyBindInputs: (dict() as Record<string, HTMLInputElement>),

  keybinds(section) {
    let key;
    $.extend(section, { innerHTML: KeybindsPage });
    $('.warning', section).hidden = Conf['Keybinds'];

    const tbody  = $('tbody', section);
    const items  = dict();
    const inputs = Settings.keyBindInputs;
    for (key in Config.hotkeys) {
      var arr = Config.hotkeys[key];
      var tr = $.el('tr',
        { innerHTML: `<td>${arr[1]}</td><td><input class="field"></td>` });
      var input = $('input', tr);
      input.name = key;
      input.spellcheck = false;
      items[key]  = Conf[key];
      inputs[key] = input;
      $.on(input, 'keydown', Settings.keybind);
      $.add(tbody, tr);
    }

    $.get(items, function (items) {
      for (key in items) {
        var val = items[key];
        inputs[key].value = val;
      }
    });
    $.on($('#reset-keys', section), 'click', Settings.resetKeybinds);
  },

  keybind(e) {
    if (e.keyCode === 9) return; // tab
    e.preventDefault();
    e.stopPropagation();
    const key = Keybinds.keyCode(e);
    if (key == null) return; // empty string is backspace
    this.value = key;
    $.cb.value.call(this);
  },

  resetKeybinds() {
    if (!confirm('Are you sure you want to reset the keybinds?')) return;

    const defaults = Object.fromEntries(Object.entries(Config.hotkeys).map(([key, value]) => [key, value[0]]));
    $.set(defaults, () => {
      Object.assign(Conf, defaults);
      for (const [key, value] of Object.entries(defaults)) {
        Settings.keyBindInputs[key].value = value;
      }
    });
  },
};
export default Settings;
