class RouteNames {
  RouteNames._();

  static const String splash = '/';
  static const String organizationSelect = '/organization-select';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String signupCode = '/signup-code';
  static const String resetPassword = '/reset-password';
  static const String organizationRegistration = '/organization-registration';

  static const String home = '/home';
  static const String forum = '/forum';
  static const String events = '/events';
  static const String news = '/news';
  static const String organizationIntroduction = '/organization-introduction';
  static const String articles = '/articles';
  static const String mentorship = '/mentorship';
  static const String mentorshipMyBookings = '/mentorship/my-bookings';
  static const String mentorshipSignup = '/mentorship/signup';
  static const String mentorDashboard = '/mentorship/mentor-dashboard';
  static const String mentorAvailability = '/mentorship/mentor-availability';
  // mentor profile: /mentorship/mentors/:id ; booking: /mentorship/mentors/:id/book
  static const String fundraising = '/fundraising';
  static const String fundraisingMyDonations = '/fundraising/my-donations';
  static const String network = '/network';
  static const String chat = '/chat';
  static const String profile = '/profile';
  static const String profileEdit = '/profile/edit';
  static const String settings = '/settings';
  static const String notifications = '/notifications';
  static const String myTickets = '/my-tickets';
  // '/my-tickets/:code' — ticket detail (code is the ticket code).
  static String ticketDetail(String code) => '/my-tickets/$code';
  static const String savedArticles = '/saved-articles';
  static const String alumniVerification = '/alumni-verification';

  // Admin/staff event check-in: picker → per-event QR scanner.
  static const String adminCheckIn = '/admin/check-in';
  static String adminCheckInScanner(int eventId) => '/admin/check-in/$eventId';
}
