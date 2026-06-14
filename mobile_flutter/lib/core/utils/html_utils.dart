/// Helpers for the HTML article body produced by the web ReactQuill editor.
class HtmlUtils {
  HtmlUtils._();

  static final RegExp _tag = RegExp(r'<[^>]*>');
  static final RegExp _whitespace = RegExp(r'\s+');

  /// Strip tags and collapse whitespace to a plain-text preview/snippet.
  /// Card previews don't need full HTML rendering; the detail screen can.
  static String toPlainText(String? html) {
    if (html == null || html.isEmpty) return '';
    final text = html
        .replaceAll(_tag, ' ')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'");
    return text.replaceAll(_whitespace, ' ').trim();
  }
}
