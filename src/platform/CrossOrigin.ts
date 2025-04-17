import QR from "../Posting/QR";
import $ from "./$";
import { dict, platform } from "./helpers";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
export interface CrossOriginAjaxOptions {
  /** called with the returned object as `this` on success or error/abort/timeout. */
  onloadend?: (this: XMLHttpRequest) => void,
  /** time limit for request */
  timeout?: number,
  /** expected response type, 'json' by default; 'json' and 'text' supported */
  responseType?: 'json' | 'text',
  /** request headers */
  headers?: Record<string, string>;
}

var CrossOrigin = {
  binary(url, cb, headers = dict()) {
    // XXX https://forums.lanik.us/viewtopic.php?f=64&t=24173&p=78310
    url = url.replace(/^((?:https?:)?\/\/(?:\w+\.)?(?:4chan|4channel|4cdn)\.org)\/adv\//, '$1//adv/');
    if (platform === 'crx') {
    $.eventPageRequest({type: 'ajax', url, headers, responseType: 'arraybuffer'})
      .then(({response, responseHeaderString}: any) => {
        if (response) response = new Uint8Array(response);
        cb(response, responseHeaderString);
      });
    } else {
      const fallback = function() {
        return $.ajax(url, {
          headers,
          responseType: 'arraybuffer',
          onloadend() {
            if (this.status && this.response) {
              return cb(new Uint8Array(this.response), this.getAllResponseHeaders());
            } else {
              return cb(null);
            }
          }
        });
      };
      if ((typeof window.GM_xmlhttpRequest === 'undefined' || window.GM_xmlhttpRequest === null)) {
        fallback();
        return;
      }
      const gmOptions = {
        method: "GET",
        anonymous: true,
        url,
        headers,
        responseType: 'arraybuffer',
        overrideMimeType: 'text/plain; charset=x-user-defined',
        onload(xhr) {
          let data;
          if (xhr.response instanceof ArrayBuffer) {
            data = new Uint8Array(xhr.response);
          } else {
            const r = xhr.responseText;
            data = new Uint8Array(r.length);
            let i = 0;
            while (i < r.length) {
              data[i] = r.charCodeAt(i);
              i++;
            }
          }
          return cb(data, xhr.responseHeaders);
        },
        onerror() {
          return cb(null);
        },
        onabort() {
          return cb(null);
        }
      };
      try {
        return (GM?.xmlHttpRequest || GM_xmlhttpRequest)(gmOptions);
      } catch (error) {
        return fallback();
      }
    }
  },

  file(url: string, cb: (result: File) => void) {
    return CrossOrigin.binary(url, function(data, headers) {
      if (data == null) { return cb(null); }
      let name = url.match(/([^\/?#]+)\/*(?:$|[?#])/)?.[1];
      const contentType        = headers.match(/Content-Type:\s*(.*)/i)?.[1];
      const contentDisposition = headers.match(/Content-Disposition:\s*(.*)/i)?.[1];
      let mime = contentType?.match(/[^;]*/)[0] || 'application/octet-stream';
      const match =
        contentDisposition?.match(/\bfilename\s*=\s*"((\\"|[^"])+)"/i)?.[1] ||
        contentType?.match(/\bname\s*=\s*"((\\"|[^"])+)"/i)?.[1];
      if (match) {
        name = match.replace(/\\"/g, '"');
      }
      if (/^text\/plain;\s*charset=x-user-defined$/i.test(mime)) {
        // In JS Blocker (Safari) content type comes back as 'text/plain; charset=x-user-defined'; guess from filename instead.
        mime = $.getOwn(QR.typeFromExtension, name.match(/[^.]*$/)[0].toLowerCase()) || 'application/octet-stream';
      }
      cb(new File([data], name, { type: mime }));
    });
  },

  Request: (function() {
    const Request = class Request {
      static initClass() {
        this.prototype.status = 0;
        this.prototype.statusText = '';
        this.prototype.response = null;
        this.prototype.responseHeaderString = null;
      }
      getResponseHeader(headerName) {
        if ((this.responseHeaders == null) && (this.responseHeaderString != null)) {
          this.responseHeaders = dict();
          for (var header of this.responseHeaderString.split('\r\n')) {
            var i;
            if ((i = header.indexOf(':')) >= 0) {
              var key = header.slice(0, i).trim().toLowerCase();
              var val = header.slice(i+1).trim();
              this.responseHeaders[key] = val;
            }
          }
        }
        return this.responseHeaders?.[headerName.toLowerCase()] ?? null;
      }
      abort() {}
      onloadend() {}
    };
    Request.initClass();
    return Request;
  })(),

  // Attempts to fetch `url` using cross-origin privileges, if available.
  // Interface is a subset of that of $.ajax.
  // Options:
  //   `onloadend` - called with the returned object as `this` on success or error/abort/timeout.
  //   `timeout` - time limit for request
  //   `responseType` - expected response type, 'json' by default; 'json' and 'text' supported
  //   `headers` - request headers
  // Returned object properties:
  //   `status` - HTTP status (0 if connection not successful)
  //   `statusText` - HTTP status text
  //   `response` - decoded response body
  //   `abort` - function for aborting the request (silently fails on some platforms)
  //   `getResponseHeader` - function for reading response headers
  ajax(url: string, options: CrossOriginAjaxOptions ={}) {
    let gmReq;
    let {onloadend, timeout, responseType, headers} = options;
    if (responseType == null) { responseType = 'json'; }

    const req = new CrossOrigin.Request();
    req.onloadend = onloadend;

    if (platform === 'userscript') {
      if (window.GM?.xmlHttpRequest == null && window.GM_xmlhttpRequest == null) {
        return $.ajax(url, options);
      }

      const gmOptions = {
        method: 'GET',
        anonymous: true,
        url,
        headers,
        timeout,
        onload(xhr) {
          try {
            let response = xhr.responseText;
            if (responseType === 'json') {
              try {
                response = JSON.parse(xhr.responseText);
              } catch (error) {
                console.error(error);
                console.error(xhr);
              }
            }
            $.extend(req, {
              url,
              headers,
              response,
              status: xhr.status,
              statusText: xhr.statusText,
              responseHeaderString: xhr.responseHeaders
            });
          } catch (error) {}
          return req.onloadend();
        },
        onerror() { return req.onloadend(); },
        onabort() { return req.onloadend(); },
        ontimeout() { return req.onloadend(); }
      };
      try {
        gmReq = (GM?.xmlHttpRequest || GM_xmlhttpRequest)(gmOptions);
      } catch (error) {
        return $.ajax(url, options);
      }

      if (gmReq && (typeof gmReq.abort === 'function')) {
        req.abort = function() {
          try {
            return gmReq.abort();
          } catch (error1) {}
        };
      }
    } else {
      $.eventPageRequest({type: 'ajax', url, responseType, headers, timeout}).then((result: any) => {
        if (result.status) {
          $.extend(req, result);
        }
        return req.onloadend();
      });
    }

    return req;
  },

  ajaxPromise(url: string, options: Omit<CrossOriginAjaxOptions, 'onloadend'> = {}): Promise<XMLHttpRequest> {
    return new Promise((resolve) => CrossOrigin.ajax(url, { ...options, onloadend() { resolve(this); } }))
  },

  cache(url, cb) {
    return $.cache(url, cb,
      {ajax: CrossOrigin.ajax});
  },

  cachePromise(url: string) : Promise<XMLHttpRequest> {
    return new Promise(resolve => {
      CrossOrigin.cache(url, function() { resolve(this); });
    })
  },

  permission(cb: () => void, cbFail?: () => void, origins?: string[]) {
    if (platform === 'crx') {
      return $.eventPageRequest({type: 'permission', origins}).then((result) => {
        if (result) {
          return cb();
        } else {
          return cbFail();
        }
      });
    }
    return cb();
  },
};
export default CrossOrigin;
