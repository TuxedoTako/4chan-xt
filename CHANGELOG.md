## 4chan XT changelog

4chan XT uses a different user script namespace than 4chan X, so to migrate you need to export settings from 4chan X,
and import them in XT.

### 2.15.4 (2024-10-19)

- Do not run on the home page, to fix the cloudflare error. [#113](https://github.com/TuxedoTako/4chan-xt/pull/113)
- Fixed crash on sauce urls using `%hMD5`. [#115](https://github.com/TuxedoTako/4chan-xt/issues/115)

### 2.15.3 (2024-10-12)

- Fixed parsing of filter entries where options are used before the regex.
  [#112](https://github.com/TuxedoTako/4chan-xt/issues/112)

### 2.15.2 (2024-10-11)

- Added discernible classes and names to stubs. [#111](https://github.com/TuxedoTako/4chan-xt/pull/111)
- Removed alt-chans that no longer exist from the `@include` list.

### 2.15.1 (2024-10-09)

- Fixed filter for poster ID not hiding new posts of that poster.
- [#108 \(comment\)](https://github.com/TuxedoTako/4chan-xt/issues/108#issuecomment-2398058231)
  - Put filter reasons in spans for easier customization with user styles.
  - Fixed thread stubs in the index not showing the reason.
  - Added subject to thread stubs. [ccd0#3371](https://github.com/ccd0/4chan-x/pull/3371)

### 2.15.0 (2024-10-07)

- Filter updates
  - Stubs will now show the reason a post was hidden. You can set a custom reason per filter.
    [#108](https://github.com/TuxedoTako/4chan-xt/issues/108), [ccd0#126](https://github.com/ccd0/4chan-x/issues/126)
  - You can hide all posts of a poster ID that hit a filter. [#94](https://github.com/TuxedoTako/4chan-xt/issues/94)
  - Filters can now hide posts recursively, like manually hidden posts.
  - You can now apply a hide and highlight on the same filter. The highlight class will apply to the stub.
- You can now export the settings without exporting your history.
  [#69](https://github.com/TuxedoTako/4chan-xt/issues/69)

### 2.14.1 (2024-09-29)

- Notification sound fixes:
  - Fixed wrong default value for the volume.
  - The volume is now corrected when set to the audio in case a wrong value is given.
  - Preview in the settings now works on pages that aren't a thread, like the catalog.

### 2.14.0 (2024-09-28)

- Added `anonymous: true` to cross-origin gmOptions to fix failing requests when first-party isolation is enabled on
  Firefox. [#105](https://github.com/TuxedoTako/4chan-xt/issues/105)
- Allow setting a custom thread update sound and volume in the advanced settings.
  [#103](https://github.com/TuxedoTako/4chan-xt/issues/103)
- Cleaned up code related importing settings from older versions, in this case from versions before 1.14.15 (released at
  the end of 2019), and the loadLetter fork. If you want to import setting from there, use an older version as an
  intermediate.

### 2.13.3 (2024-09-07)

- Fixed thread expansion in the index again.
  [#97 \(comment\)](https://github.com/TuxedoTako/4chan-xt/issues/97#issuecomment-2322505527)
- Fixed keybinds not working the first time. [#101](https://github.com/TuxedoTako/4chan-xt/issues/101)

### 2.13.2 (2024-08-30)

- Fixed sound posts on images and gifs not looping. [#89](https://github.com/TuxedoTako/4chan-xt/issues/89)
- Fixed thread expansion in the index. [#97](https://github.com/TuxedoTako/4chan-xt/issues/97)
- Fixed dead posts restored from arch.b4k.co having wrong image URLs.
  [#99](https://github.com/TuxedoTako/4chan-xt/issues/99)

### 2.13.1 (2024-08-24)

- Restored the button to remove an entry from the dump list and the spoiler checkbox on the thumbnail.
  [#90](https://github.com/TuxedoTako/4chan-xt/issues/90)
- Fixed Tegaki integration in the quick reply. [#93](https://github.com/TuxedoTako/4chan-xt/issues/93)

### 2.13.0 (2024-08-16)

- Future proofing: a manifest V3 version is now available. [#83](https://github.com/TuxedoTako/4chan-xt/issues/83)
  - This version only works on chromium.
  - The V2 version is still the default: to use the V3 version, go to the crx directory, rename or delete
    `manifest.json`, and then rename `manifestV3.json` to `manifest.json`.
- Fixed "Auto-load captcha". [#42](https://github.com/TuxedoTako/4chan-xt/issues/42)
- Fixed double controls when expanding a video the second time. [#87](https://github.com/TuxedoTako/4chan-xt/issues/87)

### 2.12.0 (2024-08-04)

- Ignore "Randomize Filename" if it's a soundpost. [#78](https://github.com/TuxedoTako/4chan-xt/pull/78)
- Allow custom header positioning. [#84](https://github.com/TuxedoTako/4chan-xt/pull/84)
- Fixed duplicated thread stats in the index.
  [#71 \(comment)](https://github.com/TuxedoTako/4chan-xt/issues/71#issuecomment-2242285191)
- Added handling for b4k image redirects. [#77](https://github.com/TuxedoTako/4chan-xt/issues/77)
- Updated archives list, removing TokyoChronos.
- Added `from-archive` CSS class for posts restored from archives, and `from-archive-link` for quote links linking to
  them. For use in custom styles. [#74](https://github.com/TuxedoTako/4chan-xt/issues/74)

### 2.11.1 (2024-07-21)

- From [#76](https://github.com/TuxedoTako/4chan-xt/issues/76):
  - Fixed errors on /f/. The captcha should load again.
  - Fixed video thumbnails not being generated in the quick reply.
  - Video preview now auto plays.
- Hovering over an OP in the index now also shows the number of replies and images in the thread.
  [#71 \(comment)](https://github.com/TuxedoTako/4chan-xt/issues/71#issuecomment-2241358550)

### 2.11.0 (2024-07-20)

- Automatic conversion of invalid image files in the quick reply.
  - When encountering an invalid image format, like webp, it will convert to png, depending on browser support.
  - When the resolution of an image is too large, it will be shrunk.
  - When an image file is too big, it will be converted to jpg with increasingly lower quality until it fits.
    [#72](https://github.com/TuxedoTako/4chan-xt/issues/72)
    - There is a button to convert to jpg manually in the quick reply.
  - A warning will be shown is an image was changed automatically.
  - There is a new preview button on the quick reply modal to check the result before posting.
  - This uses build-in functionality of the browser, so only image formats that the browser supports can be converted,
    and no videos can be converted.
- File thumbnails are now always opened when a file is added in the quick reply.
  [#75](https://github.com/TuxedoTako/4chan-xt/issues/75)
- Post filtering and highlighting aren't mutually exclusive anymore. Stubs are affected by the highlight class.
  [4chan-x#3359](https://github.com/ccd0/4chan-x/issues/3359)

### 2.10.4 (2024-06-29)

- Handle the case of a Youtube URL formatted using /watch/ without any ?v= parameter.
  [#73](https://github.com/TuxedoTako/4chan-xt/pull/73)

### 2.10.3 (2024-06-20)

- Fixed reply and like count being switched in fxTwitter embeds.
  [#60 \(comment\)](https://github.com/TuxedoTako/4chan-xt/issues/60#issuecomment-2180536991)

### 2.10.2 (2024-06-15)

- Fixed wrong link on dead links to other threads. [#70](https://github.com/TuxedoTako/4chan-xt/issues/70)
- Fixed quoted OPs not showing reply and image count. [#71](https://github.com/TuxedoTako/4chan-xt/issues/71) Might be a
  new feature, since it seems it was never supported, but I'm counting it as a bug fix because native 4chan has it.

### 2.10.1 (2024-06-01)

- Address wobbly spin animation. [#65](https://github.com/TuxedoTako/4chan-xt/pull/65)
- Remove dead link to Mayhem archive documentation. [#66](https://github.com/TuxedoTako/4chan-xt/pull/66)
- Switch menu-button to FA icon. [#68](https://github.com/TuxedoTako/4chan-xt/pull/68)
- Fix quick reply dialog remembering styles outside it's position after dragging.
  [#62](https://github.com/TuxedoTako/4chan-xt/issues/62)
- Fix errors when hovering over a dead link to a post that would be filtered in the archive.

### 2.10.0 (2024-05-20)

- Improve FxTwitter embeds. [#60](https://github.com/TuxedoTako/4chan-xt/issues/60)
  - Improve style.
  - Link @names and #hashtags.
  - Move some settings to the advanced setting: you can now choose which language to translate into instead of English
    or nothing.
- Remember QR size option is no longer Firefox only. [#61](https://github.com/TuxedoTako/4chan-xt/pull/61)
- CSS custom properties, also known as CSS variables, used by 4chan XT are now documented in
  [src/css/README.md](./src/css/README.md).
- Now that 4chan redirects to https, http support is dropped.
  [#61 \(comment\)](https://github.com/TuxedoTako/4chan-xt/pull/61#issuecomment-2119154714)
- Also dropped 4channel.org in the list of supported sites.

### 2.9.0 (2024-05-12)

- FxTwitter embeds. Has some extra functionality in the settings. Twitframe is also still available in the settings.
  [#57](https://github.com/TuxedoTako/4chan-xt/pull/57)
- Fixed youtube shorts embeds. [#58](https://github.com/TuxedoTako/4chan-xt/pull/58)
- Fixed the extension version not displaying the error message in case fetching the thread from an external archive
  failed. [#8 \(comment\)](https://github.com/TuxedoTako/4chan-xt/issues/8#issuecomment-2105740679)
- Button to watch threads now uses an svg icon instead of a background image, and is now a button instead of an anchor.
  This should only be important if you use custom css to style it.

### 2.8.2 (2024-05-03)

- PostHiding now waits for the board config, so the option to hide by poster ID should always appear on boards with
  those. [#41 (comment)](https://github.com/TuxedoTako/4chan-xt/issues/41#issuecomment-2087805190)
- Restoring deleted posts from archives when reply threading is active no longer recalculates the threads. Turning reply
  threading off and on again still works. [#55](https://github.com/TuxedoTako/4chan-xt/issues/55)

### 2.8.1 (2024-04-23)

- Fixed quick reply modal putting icon buttons in the wrong place in the catalog.
  [#54](https://github.com/TuxedoTako/4chan-xt/issues/54)
- Removed 'Work around CORB Bug', which was fixed in chrome 85, while this script is 90 and up.
  - Because this meant a file had a dependency less, which in combination with the circular dependencies, caused some
    files to be in a different order in the output, and caused some common variables to not have `$1` appended. So sorry
    for the giant diff.
- Code specific for the userscript isn't in the chrome extension anymore and vice versa.

### 2.8.0 (2024-04-18)

- Fixed post hiding on poster ID not applying to new posts.
  [#41 (comment)](https://github.com/TuxedoTako/4chan-xt/issues/41#issuecomment-2057981978)
- Fixed semicolon in Yotsuba B CSS [#48](https://github.com/TuxedoTako/4chan-xt/pull/48)
- Capitalized "Watcher" in the header for consistency. [#49](https://github.com/TuxedoTako/4chan-xt/pull/49)
- To address the restore from archive issues [#51](https://github.com/TuxedoTako/4chan-xt/issues/51):
  - Added an error message when fetching fails instead of failing silently.
  - Added option to select archive to fetch from.
- Counting poster IDs is now used as a fallback for the missing IP count.
  [#52](https://github.com/TuxedoTako/4chan-xt/issues/52)
- Trying to fetch the captcha in /biz/ without verified email verification now shows the error to the user instead of
  failing silently. [#53](https://github.com/TuxedoTako/4chan-xt/issues/53)

### 2.7.1 (2024-04-12)

- Right-align shortcut icons in header when header links are centered.
  [#45](https://github.com/TuxedoTako/4chan-xt/pull/45)
- OneeChan compatibility fixes:
  - Do not apply highlights of your posts and replies when OneeChan is detected since the CSS specificity from XT was
    higher. [#43](https://github.com/TuxedoTako/4chan-xt/issues/43)
  - Switched from `overflow: clip;` to `overflow: auto;` on posts.
    [#44](https://github.com/TuxedoTako/4chan-xt/issues/44)
- Fixed Expand/Contract All Images icon in the header. [#47](https://github.com/TuxedoTako/4chan-xt/issues/47)

### 2.7.0 (2024-04-06)

- Re-added font-awesome for the header icons. This time I'm only importing the icons needed instead of the whole icon
  font. [#38](https://github.com/TuxedoTako/4chan-xt/issues/38)
- Added button to un-randomize the filename in the quick reply. [#40](https://github.com/TuxedoTako/4chan-xt/issues/40)
  - Moved the icon buttons and submit to a new row to give the file input some space.
- Added option to hide posts by poster ID. [#41](https://github.com/TuxedoTako/4chan-xt/issues/41)
- Made the audio the source of truth for video sound posts. Should fix
  [#36](https://github.com/TuxedoTako/4chan-xt/issues/36), but I didn't find a video to longer audio to test on.

### v2.6.0 (2024-03-30)

- Added an option to Update stats more often and add purge position when a thread is close to getting purged, for anons
  who manage general threads. [#39](https://github.com/TuxedoTako/4chan-xt/issues/39)

### v2.5.2 (2024-03-06)

- Fixed thread watcher icon not changing colors when somebody replies to your post in the tomorrow theme.
  [#35](https://github.com/TuxedoTako/4chan-xt/issues/35)
- Fixed header color in the futaba theme.

### v2.5.1 (2024-03-03)

- Fixed missing semicolon in yotsuba.css. Thanks to
  [@saxamaphone69's review](https://github.com/TuxedoTako/4chan-xt/commit/d795e93e045f5192b51f5680b7e65cd089e99625#commitcomment-139046323).

### v2.5.0 (2024-02-25)

- Quick MD5 filter on shift + click on a thumbnail or expanded file.
  [#32](https://github.com/TuxedoTako/4chan-xt/issues/32)
  - Can be turned off in the settings.
- Moved different themes to CSS variables.
  - This shouldn't make a difference for the end user, but I have accidentally broking things before.
- Added `color-scheme: dark;` for tomorrow and spooky themes for dark scroll bars, inputs and buttons.

### v2.4.6 (2024-02-08)

- Fixed inserted posts from external archives missing the hide button before it.

### v2.4.5 (2024-02-04)

- Fixed hovering over a link to a hidden thread throwing an error.
  [#30](https://github.com/TuxedoTako/4chan-xt/issues/30)
- Fixed example of the type option on general filters. [#29](https://github.com/TuxedoTako/4chan-xt/issues/29)

### v2.4.4 (2024-02-01)

- Fixed icons next to embed links. [#28](https://github.com/TuxedoTako/4chan-xt/issues/28)
- Updated some of those icons, and compressed some others.

### v2.4.3 (2024-01-25)

- Updated CSS to remove older properties. [#25](https://github.com/TuxedoTako/4chan-xt/issues/25)
- Fixed image prefetching icon incorrectly showing it is enabled by default.
  [#26](https://github.com/TuxedoTako/4chan-xt/issues/26)
- Fixed mixing of line endings in the entire output. [#24](https://github.com/TuxedoTako/4chan-xt/issues/24)

### v2.4.2 (2024-01-23)

- Fixed infinite loop when a thread from a tinyboard website is in the thread watcher.
  [#23](https://github.com/TuxedoTako/4chan-xt/issues/23)
- Fixed bug that ocurred on threads on websites without IP counter.
  [#23](https://github.com/TuxedoTako/4chan-xt/issues/23#issuecomment-1905295911)
- Fixed mixing of line endings in the header comments. [#24](https://github.com/TuxedoTako/4chan-xt/issues/24)

### v2.4.1 (2024-01-21)

- Fixed new Relative dates settings' interaction with elements that aren't the date info on posts, like the refresh
  button on the 4chan-XT catalog.

### v2.4.0 (2024-01-21)

- Reworded 'Link Title in the catalog' setting's description. [#21](https://github.com/TuxedoTako/4chan-xt/pull/21)
- Relative times and full time stamps are no longer mutually exclusive. Setting was moved to the Time Formatting section
  of the advanced settings because the other settings because the Main settings only supports boolean settings.
- Build script: added a transformer on the TypeScript output to keep the script from getting bigger when moving files
  from js to ts. If you think this is a waste of time on the build step you can use the `-no-format` flag.

### v2.3.5 (2024-01-09)

- Fixed poster IDs not appearing on new posts. [#20](https://github.com/TuxedoTako/4chan-xt/issues/20)

### v2.3.4 (2023-12-31)

- Fixed previewing posts from external archives inserting posts from other threads into the current thread.
  [#18](https://github.com/TuxedoTako/4chan-xt/issues/18)

### v2.3.3 (2023-12-30)

- Improved interaction between restoring from the archive and reply threading.
  - Known issue: parents from threads get put at the end instead of the correct place when reply threading is on.
- Previewing a deleted post from an external archive by hovering over a link no longer excludes it when restoring the
  thread from the archive. It now gets added direly when you do that.
  - Known issue: when reply threading is on, this moves the reply to the restored post, but doesn't scroll to it.
- Added a "Link Title in the catalog" setting for embeds as a workaround for
  [ccd0/4chan-x#3427](https://github.com/ccd0/4chan-x/issues/3427). Fetching titles in the catalog is off by default.
- Restored span around ➕︎ and ➖︎ icons in the index for user styles. [#17](https://github.com/TuxedoTako/4chan-xt/issues/17).

### v2.3.2 (2023-12-27)

- Fixed the settings import mistaking a 4chan XT config for a [loadletter/4chan-x](https://github.com/loadletter/4chan-x)
  one and failing. [#16](https://github.com/TuxedoTako/4chan-xt/issues/16)

### v2.3.1 (2023-12-26)

- Fixed classes on capcode. [#14](https://github.com/TuxedoTako/4chan-xt/issues/14)
- Fixed default FAQ link in the header. [#15](https://github.com/TuxedoTako/4chan-xt/issues/15)

### v2.3.0 (2023-12-25) (Merry Christmas)

- Added `.fourchan-xt` class. [#11](https://github.com/TuxedoTako/4chan-xt/issues/11)
- Added `window.fourchanXT` with the version number in `version` and a `buildDate` `Date` object.
- Version number is no longer prefixed with "XT ", and will now follow major.minor.bugfix.
- Fixed "Expand All Images" shortcut in the header. [#13](https://github.com/TuxedoTako/4chan-xt/issues/13)
- Ran the chrome extension version, and fixed a problem with the ajax function. How long has that been down? I use the
  user script version myself.

### XT v2.2.6 (2023-12-22)

- Fixed header shortcuts with text instead of icons. [#12](https://github.com/TuxedoTako/4chan-xt/issues/12)

### XT v2.2.5 (2023-12-21)

- Fixed posts scrolling under the header when navigated to by the id.
  [#10](https://github.com/TuxedoTako/4chan-xt/issues/10)
  - Now `scroll-margin-top` is used, which needed `overflow: clip;` instead of `:hidden`, which is why the minimum
    chrome version is bumped to 90.
- Disabled automatic retry when captcha failed. [ccd0/4chan-x\#3134](https://github.com/ccd0/4chan-x/issues/3134),
  [ccd0/4chan-x\#3424](https://github.com/ccd0/4chan-x/issues/3157).
  - I think. I honestly had trouble reproducing this issue.

### XT v2.2.4 (2023-12-19)

- Fixed Index, Archive and Catalog navbar links no longer bold on blue boards:
  [ccd0/4chan-x\#3424](https://github.com/ccd0/4chan-x/issues/3424).

### XT v2.2.3 (2023-11-08)

- Fixed error when "Force Noscript Captcha" is enabled.

### XT v2.2.2 (2023-10-29)

- Fixed trying to get thread JSON from unsupported archives.

### XT v2.2.1 (2023-10-28)

- Fixed thread not scrolling to last read post.
- Set default 'Exempt Archives from Encryption' to false. This setting will _not_ change automatically when updating.
- Enabled automatic updates. If you don't want updates, turn them off in your user script manager.

### XT v2.2.0 (2023-10-27)

- Added ability to restore deleted posts from an external archive. This can be found in the drop down menu at the top
  right. [#8](https://github.com/TuxedoTako/4chan-xt/issues/8)
- Also minify css in the minified build.

### XT v2.1.4 (2023-09-02)

- Fix DataBoard class, should solve [#7](https://github.com/TuxedoTako/4chan-xt/issues/7)
- Fix Settings.upgrade to work with version numbers prepended with XT

### XT v2.1.3 (2023-08-21)

- Embed x.com links.
- Settings no longer close when the mouse ends up outside of the modal when selecting text in an input or textarea.

### XT v2.1.2 (2023-07-22)

- Fix inlining/previewing of archive links like quote links. [#5](https://github.com/TuxedoTako/4chan-xt/issues/5)

### XT v2.1.1 (2023-07-16)

- Time formatting now falls back to browser locale instead of giving an error when the locale is not set.
- Update notification link now links to the changelog on the right branch on github.

### XT v2.1.0 (2023-06-24)

- Limited support for audio posts: they work in threads but not yet in the gallery. Might add if there's demand.
  - Can be disabled in the settings
- Small performance improvements
  - Removed unnecessary `Array.from`s from coffeescript to js migration
  - Time module: cache Intl.DateTimeFormat objects
  - callbackNodesDB: increase nr of callbacks because the setTimeout triggers a reflow, which in some of my tests took
    as long as the actual chunk of callbacks

### XT v2.0.0 (2023-04-30)

This is the first XT release, which means this is after the migration from coffeescript to typescript, but there are
some other changes as well. These changes aren't in the upstream PR.

- Optimized image filters: filters are in a Map with the hash as key, instead of iterating over all image filters
- I removed font awesome to make the script smaller, and used unicode icons instead. This might break some user scripts
  build in 4chan X that rely on them, and I only tested on windows.
- For even smaller user script size, there is a minified version available
- https://github.com/ccd0/4chan-x/pull/3352, fix for https://github.com/ccd0/4chan-x/issues/3349 was ported

## Original 4chan X changelog

For the original changelog, see [original 4chan X CHANGELOG.md](./original%204chan%20X%20CHANGELOG.md).
