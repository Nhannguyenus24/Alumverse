import '../router/route_names.dart';

/// Converts a backend notification link into a route the mobile app can push.
///
/// The backend builds web-style, org-scoped links such as
/// `/{slug}/my-tickets?ticket=ABC123` or `/{slug}/article/news/5`. Mobile
/// routes are flat (no org slug) and ticket detail lives at `/my-tickets/{code}`,
/// so we strip the leading slug segment and map known web paths to mobile ones.
///
/// Returns a mobile route path, or null if the link can't be mapped (caller
/// should then ignore it rather than push a dead route).
String? normalizeNotificationLink(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  // External links are handled by the caller (launchUrl); not our job.
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  final uri = Uri.tryParse(raw);
  if (uri == null) return null;

  // Path segments without the org slug. The backend prefixes most links with
  // the organisation slug (e.g. /cs-hcmus/my-tickets); the first segment is the
  // slug unless it's already a known top-level route.
  var segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
  if (segments.isEmpty) return null;

  const knownTop = {
    'my-tickets',
    'article',
    'articles',
    'events',
    'forum',
    'mentorship',
    'fundraising',
    'network',
    'profile',
    'notifications',
    'saved-articles',
  };
  if (!knownTop.contains(segments.first)) {
    // Drop the leading org slug.
    segments = segments.sublist(1);
  }
  if (segments.isEmpty) return null;

  // my-tickets[?ticket=CODE] → ticket detail (or list).
  if (segments.first == 'my-tickets') {
    final code = uri.queryParameters['ticket'];
    if (code != null && code.isNotEmpty) {
      return RouteNames.ticketDetail(code);
    }
    return RouteNames.myTickets;
  }

  // article/news/{id} → /articles/{id}
  if (segments.first == 'article' &&
      segments.length >= 3 &&
      segments[1] == 'news') {
    return '${RouteNames.articles}/${segments[2]}';
  }

  // events/{id} → /events/{id}
  if (segments.first == 'events' && segments.length >= 2) {
    return '${RouteNames.events}/${segments[1]}';
  }

  // Mentorship: web paths don't all exist on mobile — map to the closest route.
  if (segments.first == 'mentorship') {
    final sub = segments.length >= 2 ? segments[1] : '';
    switch (sub) {
      // Web /mentorship/profile and /mentorship/dashboard → mentor dashboard.
      case 'profile':
      case 'dashboard':
        return RouteNames.mentorDashboard;
      // Web /mentorship/calendar (manage availability) → mentor availability.
      case 'calendar':
        return RouteNames.mentorAvailability;
      case 'my-bookings':
        return RouteNames.mentorshipMyBookings;
      case 'signup':
        return RouteNames.mentorshipSignup;
      case 'mentee-signup':
        return RouteNames.menteeSignup;
      default:
        return RouteNames.mentorship;
    }
  }

  // Fallback: rebuild a flat path from the remaining segments.
  return '/${segments.join('/')}';
}
