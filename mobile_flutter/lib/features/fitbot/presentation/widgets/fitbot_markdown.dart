/// Minimal Markdown → HTML converter for FitBot replies. The assistant returns
/// GitHub-flavoured Markdown; we don't pull in a full markdown package (to keep
/// the dependency set small and compatible), so this handles the common cases
/// the bot actually produces: headings, bold/italic, inline code, bullet and
/// numbered lists, GFM tables, links, and paragraphs. The result is fed to
/// `HtmlWidget`.
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

  for (var i = 0; i < lines.length; i++) {
    final line = lines[i].trimRight();
    final trimmed = line.trimLeft();

    if (trimmed.isEmpty) {
      closeList();
      continue;
    }

    // GFM table: a header row followed by a separator row (|---|---|).
    if (_isTableRow(trimmed) &&
        i + 1 < lines.length &&
        _isTableSeparator(lines[i + 1].trim())) {
      closeList();
      final header = _splitTableRow(trimmed);
      final bodyRows = <List<String>>[];
      var j = i + 2;
      while (j < lines.length && _isTableRow(lines[j].trim())) {
        bodyRows.add(_splitTableRow(lines[j].trim()));
        j++;
      }
      out.write('<table border="1" cellpadding="6" cellspacing="0">');
      out.write('<thead><tr>');
      for (final cell in header) {
        out.write('<th>${_inline(cell)}</th>');
      }
      out.write('</tr></thead><tbody>');
      for (final row in bodyRows) {
        out.write('<tr>');
        for (var c = 0; c < header.length; c++) {
          out.write('<td>${_inline(c < row.length ? row[c] : '')}</td>');
        }
        out.write('</tr>');
      }
      out.write('</tbody></table>');
      i = j - 1; // continue after the consumed table rows
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

/// A line is a table row when it contains at least one unescaped pipe.
bool _isTableRow(String line) => line.contains('|');

/// The separator row that follows a GFM table header, e.g. `|---|:--:|---:|`.
bool _isTableSeparator(String line) =>
    line.contains('|') &&
    RegExp(r'^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$').hasMatch(line);

/// Split a `| a | b |` row into trimmed cells, dropping the outer empties the
/// leading/trailing pipes produce.
List<String> _splitTableRow(String line) {
  var s = line.trim();
  if (s.startsWith('|')) s = s.substring(1);
  if (s.endsWith('|')) s = s.substring(0, s.length - 1);
  return s.split('|').map((c) => c.trim()).toList();
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
