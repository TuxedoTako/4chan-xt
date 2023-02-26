export default function generateCatalogThreadHtml(thread, src, imgClass, data, postCount, fileCount, pageCount, staticPath, gifIcon,) {
  return `<a class="catalog-link" href="/${thread.board}/thread/${thread.ID}">
  <img src="${src}"${imgClass ? ` class="catalog-thumb ${imgClass}"` : ` class="catalog-thumb" data-width="${data.tn_w}" data-height="${data.tn_h}"`}>
</a>
<div class="catalog-stats">
  <span title="Posts / Files / Page">
    <span class="post-count${data.bumplimit ? ' warning' : ''}">${postCount}</span> /
    <span class="file-count${data.imagelimit ? ' warning' : ''}">${fileCount}</span> /
    <span class="page-count">${pageCount}</span>
  </span>
  <span class="catalog-icons">
    ${thread.isSticky ? `<img src="${staticPath}sticky${gifIcon}" class="stickyIcon" title="Sticky">` : ''}
    ${thread.isClosed ? `<img src="${staticPath}closed${gifIcon}" class="closedIcon" title="Closed">` : ''}
  </span>
</div>`;
}
