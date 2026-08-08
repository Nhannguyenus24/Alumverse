import 'package:datn/features/article/data/repositories/article_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'published news parser keeps fixed featured first and de-duplicates it',
    () {
      final news = parsePublishedNewsResponse({
        'data': {
          'featured': {
            'id': 9,
            'title': 'Newest featured',
            'content': 'Featured preview',
            'createdAt': '2026-08-07T10:00:00',
          },
          'items': [
            {
              'id': 8,
              'title': 'Next article',
              'content': 'Item preview',
              'createdAt': '2026-08-06T10:00:00',
            },
            {'id': 9, 'title': 'Accidental duplicate'},
          ],
        },
      });

      expect(news.map((article) => article.id), [9, 8]);
      expect(news.first.title, 'Newest featured');
    },
  );

  test(
    'published news parser remains compatible with legacy item payloads',
    () {
      final news = parsePublishedNewsResponse({
        'data': {
          'items': [
            {'id': 2, 'title': 'Legacy first'},
            {'id': 1, 'title': 'Legacy second'},
          ],
        },
      });

      expect(news.map((article) => article.id), [2, 1]);
    },
  );

  test('featured list parser keeps the featured alumni post at the head', () {
    final posts = parseFeaturedListResponse({
      'data': {
        'featured': {
          'id': 5,
          'title': 'Newest alumni post',
          'content': 'Featured preview',
          'createdAt': '2026-08-07T10:00:00',
        },
        'items': [
          {
            'id': 4,
            'title': 'Older alumni post',
            'content': 'Item preview',
            'createdAt': '2026-08-06T10:00:00',
          },
        ],
      },
    }, channel: 'alumni');

    expect(posts.map((article) => article.id), [5, 4]);
    expect(posts.first.title, 'Newest alumni post');
  });

  test('featured list parser tolerates a missing or null featured', () {
    final withoutFeatured = parseFeaturedListResponse({
      'data': {
        'items': [
          {'id': 4, 'title': 'Only item'},
        ],
      },
    }, channel: 'alumni');
    expect(withoutFeatured.map((article) => article.id), [4]);

    final nullFeatured = parseFeaturedListResponse({
      'data': {
        'featured': null,
        'items': [
          {'id': 4, 'title': 'Only item'},
        ],
      },
    }, channel: 'alumni');
    expect(nullFeatured.map((article) => article.id), [4]);

    final empty = parseFeaturedListResponse({
      'data': {'featured': null, 'items': <dynamic>[]},
    }, channel: 'alumni');
    expect(empty, isEmpty);
  });
}
