const $$ = (selector: string, root?: HTMLElement) => {
  if (!root) {
    if (!document.body) return [];
    root = document.body;
  }
  return Array.from(root.querySelectorAll(selector));
};
export default $$;
