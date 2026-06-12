/**
 * Inserts text at the current TextField/input selection, or appends when no ref.
 */
export function insertTextAtInputSelection(inputRef, setValue, text) {
  setValue((prev) => {
    const input = inputRef?.current;
    if (!input) return prev + text;

    const start = input.selectionStart ?? prev.length;
    const end = input.selectionEnd ?? prev.length;
    const next = prev.slice(0, start) + text + prev.slice(end);

    requestAnimationFrame(() => {
      input.focus();
      const pos = start + text.length;
      input.setSelectionRange(pos, pos);
    });

    return next;
  });
}
