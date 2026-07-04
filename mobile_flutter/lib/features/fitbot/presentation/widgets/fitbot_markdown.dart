/// Minimal Markdown → HTML converter for FitBot replies. The assistant returns
/// GitHub-flavoured Markdown; we don't pull in a full markdown package (to keep
/// the dependency set small and compatible), so this handles the common cases
/// the bot actually produces: headings, bold/italic, inline code, bullet and
/// numbered lists, links, and paragraphs. The result is fed to `HtmlWidget`.
String fitBotMarkdownToHtml(String md) {
  final lines = md.replaceAll('\r\n', '\n').split('\n');
  final out = StringBuffer();

  String? listType; // 'ul' | 'ol' | null

  void closeList() {
    if (listType != null) {
      out.write('</$listType>');
      listType = null;
    }
  }

  for (var raw in lines) {
    final line = raw.trimRight();
    final trimmed = line.trimLeft();

    if (trimmed.isEmpty) {
      closeList();
      continue;
    }

    // Headings (#, ##, ###)
    final heading = RegExp(r'^(#{1,3})\s+(.*)$').firstMatch(trimmed);
    if (heading != null) {
      closeList();
      final level = heading.group(1)!.length + 2; // h3..h5
      out.write('<h$level>${_inline(heading.group(2)!)}</h$level>');
      continue;
    }

    // Bullet list (-, *, +)
    final bullet = RegExp(r'^[-*+]\s+(.*)$').firstMatch(trimmed);
    if (bullet != null) {
      if (listType != 'ul') {
        closeList();
        out.write('<ul>');
        listType = 'ul';
      }
      out.write('<li>${_inline(bullet.group(1)!)}</li>');
      continue;
    }

    // Numbered list (1. 2. …)
    final numbered = RegExp(r'^\d+\.\s+(.*)$').firstMatch(trimmed);
    if (numbered != null) {
      if (listType != 'ol') {
        closeList();
        out.write('<ol>');
        listType = 'ol';
      }
      out.write('<li>${_inline(numbered.group(1)!)}</li>');
      continue;
    }

    // Paragraph
    closeList();
    out.write('<p>${_inline(trimmed)}</p>');
  }
  closeList();
  return out.toString();
}

/// Inline formatting: escape HTML first, then apply bold/italic/code/link.
String _inline(String text) {
  var s = text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  // Inline code `code`
  s = s.replaceAllMapped(
    RegExp(r'`([^`]+)`'),
    (m) => '<code>${m.group(1)}</code>',
  );
  // Bold **text** or __text__
  s = s.replaceAllMapped(
    RegExp(r'\*\*([^*]+)\*\*'),
    (m) => '<b>${m.group(1)}</b>',
  );
  s = s.replaceAllMapped(RegExp(r'__([^_]+)__'), (m) => '<b>${m.group(1)}</b>');
  // Italic *text* or _text_
  s = s.replaceAllMapped(
    RegExp(r'(?<!\*)\*([^*]+)\*(?!\*)'),
    (m) => '<i>${m.group(1)}</i>',
  );
  s = s.replaceAllMapped(
    RegExp(r'(?<!_)_([^_]+)_(?!_)'),
    (m) => '<i>${m.group(1)}</i>',
  );
  // Links [text](url)
  s = s.replaceAllMapped(
    RegExp(r'\[([^\]]+)\]\((https?:\/\/[^)]+)\)'),
    (m) => '<a href="${m.group(2)}">${m.group(1)}</a>',
  );

  return s;
}
