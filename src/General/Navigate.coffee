Navigate =
  path:  window.location.pathname
  init: ->
    return if g.VIEW is 'catalog' or g.BOARD.ID is 'f' or !Conf['JSON Navigation']

    $.ready ->
      # blink/webkit throw a popstate on page load. Not what we want.
      $.on window, 'popstate', Navigate.popstate

    @title = -> return

    Thread.callbacks.push
      name: 'Navigate'
      cb:   @thread

    Post.callbacks.push
      name: 'Navigate'
      cb:   @post

  thread: ->
    return if g.VIEW is 'thread' # The reply link only exists in index view
    replyLink = $ 'a.replylink', @OP.nodes.info
    $.on replyLink, 'click', Navigate.navigate

  post: -> # Allows us to navigate via JSON from thread to thread by hashes and quote highlights.
    if Conf['Quote Hash Navigation']
      for hashlink in $$ '.hashlink', @nodes.comment
        {boardID, threadID, postID} = Get.postDataFromLink hashlink
        if boardID isnt g.BOARD.ID or (threadID isnt g.THREADID)
          $.on hashlink, 'click', Navigate.navigate

    # We don't need to reload the thread inside the thread
    return if g.VIEW is 'thread' and @thread.ID is g.THREADID
    postlink = $ 'a[title="Link to this post"]', @nodes.info
    $.on postlink, 'click', Navigate.navigate

  clean: ->
    # Garbage collection
    g.threads.forEach (thread) -> thread.collect()
    QuoteBacklink.containers = {}

    $.rmAll $ '.board'

  features: [
    ['Thread Excerpt',   ThreadExcerpt]
    ['Unread Count',     Unread]
    ['Quote Threading',  QuoteThreading]
    ['Thread Stats',     ThreadStats]
    ['Thread Updater',   ThreadUpdater]
    ['Thread Expansion', ExpandThread]
  ]

  disconnect: ->
    for [name, feature] in Navigate.features
      try
        feature.disconnect()
      catch err
        errors = [] unless errors
        errors.push
          message: "Failed to disconnect feature #{name}."
          error:   err

      Main.handleErrors errors if errors

    return

  reconnect: ->
    for [name, feature] in Navigate.features
      try
        feature.init()
      catch err
        errors = [] unless errors
        errors.push
          message: "Failed to reconnect feature #{name}."
          error:   err
    Main.handleErrors errors if errors
    return

  ready: (name, feature, condition) ->
    try
      feature() if condition
    catch err
      error = [
        message: "#{name} Failed."
        error:   err
      ]
    Main.handleErrors error if error

  updateContext: (view) ->
    g.DEAD     = false
    g.THREADID = +window.location.pathname.split('/')[3] if view is 'thread'

    return if view is g.VIEW

    $.rmClass  doc, g.VIEW
    $.addClass doc, view

    {
      index: ->
        delete g.THREADID
        QR.link.textContent = 'Start a Thread'

      thread: ->
        QR.link.textContent = 'Reply to Thread'
    }[view]()

    g.VIEW = view

  updateBoard: (boardID) ->
    fullBoardList   = $ '#full-board-list', Header.boardList
    $('.current', fullBoardList)?.classList.remove 'current'
    $("a[href*='/#{boardID}/']", fullBoardList)?.classList.add 'current'
    Header.generateBoardList Conf['boardnav'].replace /(\r\n|\n|\r)/g, ' '

    QR.flagsInput()

    $.cache '//a.4cdn.org/boards.json', ->
      try
        return unless @status is 200
        for aboard in @response.boards when aboard.board is boardID
          board = aboard
          break

      catch err
        Main.handleErrors [
          message: "Navigation failed to update board name."
          error: err
        ]

      return unless board
      Navigate.updateTitle board
      Navigate.updateSFW !!board.ws_board

  updateSFW: (sfw) ->
    Favicon.el.href = Favicon.default = "//s.4cdn.org/image/favicon#{if sfw then '-ws' else ''}.ico"

    # Changing the href alone doesn't update the icon on Firefox
    $.add d.head, Favicon.el

    return if Favicon.SFW is sfw # Board SFW status hasn't changed

    Favicon.SFW = sfw
    Favicon.update()

    findStyle = (type, base) ->
      style = d.cookie.match new RegExp "\b#{type}\_style\=([^;]+);\b"
      return ["#{type}_style", (if style then style[1] else base)]

    style = if sfw
      findStyle 'ws',  'Yotsuba B New'
    else
      findStyle 'nws', 'Yotsuba New'

    $.globalEval "var style_group = '#{style[0]}'"

    $('link[title=switch]', d.head).href = $("link[title='#{style[1]}']", d.head).href

    Main.setClass()

  updateTitle: ({board, title}) ->
    $.rm subtitle if subtitle = $ '.boardSubtitle'
    $('.boardTitle').textContent = d.title = "/#{board}/ - #{title}"

  navigate: (e) ->
    return if @hostname isnt 'boards.4chan.org' or window.location.hostname is 'rs.4chan.org'
    return if e and (e.shiftKey or e.ctrlKey or (e.type is 'click' and e.button isnt 0)) # Not simply a left click

    $.addClass Index.button, 'fa-spin'

    [_, boardID, view, threadID] = @pathname.split '/'

    return if view is 'catalog' or 'f' in [boardID, g.BOARD.ID]
    e.preventDefault() if e
    Navigate.title = -> return

    delete Index.pageNum
    $.rmAll Header.hover

    path = @pathname
    path += @hash if @hash

    history.pushState null, '', path unless @id is 'popState'
    Navigate.path = @pathname

    if threadID
      view = 'thread'
    else
      pageNum = +view or 1 # string to number, '' to 1
      view = 'index' # path is "/boardID/". See the problem?

    if view is g.VIEW and boardID is g.BOARD.ID
      Navigate.updateContext view

    else # We've navigated somewhere we weren't before!
      Navigate.disconnect()
      Navigate.updateContext view
      Navigate.clean()
      Navigate.reconnect()

    if boardID is g.BOARD.ID
      Navigate.title = -> d.title = $('.boardTitle').textContent if view is 'index'
    else
      g.BOARD = new Board boardID
      Navigate.title = -> Navigate.updateBoard boardID

    Navigate.updateSFW Favicon.SFW

    if view is 'index'
      return Index.update pageNum

    # Moving from index to thread or thread to thread
    {load} = Navigate
    Navigate.req = $.ajax "//a.4cdn.org/#{boardID}/thread/#{threadID}.json",
      onabort:   load
      onloadend: load

    setTimeout (->
      if Navigate.req and !Navigate.notice
        Navigate.notice = new Notice 'info', 'Loading thread...'
    ), 3 * $.SECOND

  load: (e) ->
    $.rmClass Index.button, 'fa-spin'
    {req, notice} = Navigate
    notice?.close()
    delete Navigate.req
    delete Navigate.notice

    if e.type is 'abort' or req.status isnt 200
      req.onloadend = null
      new Notice 'warning', "Failed to load thread.#{if req.status then " #{req.status}" else ''}"
      return

    Navigate.title()

    try
      Navigate.parse req.response.posts
    catch err
      console.error 'Navigate failure:'
      console.log err
      # network error or non-JSON content for example.
      if notice
        notice.setType 'error'
        notice.el.lastElementChild.textContent = 'Navigation Failed.'
        setTimeout notice.close, 2 * $.SECOND
      else
        new Notice 'error', 'Navigation Failed.', 2
      return

  parse: (data) ->
    board = g.BOARD
    Navigate.threadRoot = threadRoot = Build.thread board, OP = data.shift(), true
    thread = new Thread OP.no, board

    posts  = []
    errors = null

    makePost = (postNode) ->
      try
        posts.push new Post postNode, thread, board
      catch err
        # Skip posts that we failed to parse.
        errors = [] unless errors
        errors.push
          message: "Parsing of Post No.#{thread.ID} failed. Post will be skipped."
          error: err

    makePost $('.opContainer', threadRoot)

    for obj in data
      post = Build.postFromObject obj, board
      makePost post
      $.add threadRoot, post

    Main.handleErrors errors if errors

    Main.callbackNodes Thread, [thread]
    Main.callbackNodes Post,   posts

    Navigate.ready 'Quote Threading', QuoteThreading.force, Conf['Quote Threading'] and not Conf['Unread Count']

    Navigate.buildThread()
    QR.generatePostableThreadsList()
    Header.hashScroll.call window

  buildThread: ->
    board = $ '.board'
    $.rmAll board
    $.add board, [Navigate.threadRoot, $.el 'hr']

    if Conf['Unread Count']
      Navigate.ready 'Unread Count', Unread.ready, Conf['Unread Count']

  pushState: (path) ->
    history.pushState null, '', path
    Navigate.path = window.location.pathname

  popstate: ->
    return if window.location.pathname is Navigate.path
    a = $.el 'a',
      href: window.location
      id:   'popState'

    Navigate.navigate.call a
