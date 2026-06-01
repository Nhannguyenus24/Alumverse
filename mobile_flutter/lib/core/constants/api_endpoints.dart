class ApiEndpoints {
  ApiEndpoints._();

  static const String authLogin = '/api/auth/login';
  static const String authRegister = '/api/auth/register';
  static const String authRefresh = '/api/auth/refresh';
  static const String authLogout = '/api/auth/logout';
  static const String authGoogle = '/api/auth/google';
  static const String authMe = '/api/auth/me';

  static const String users = '/api/users';
  static const String userSettings = '/api/user/settings';

  static const String forumCategories = '/api/forum/categories';
  static const String forumTopics = '/api/forum/topics';
  static const String forumPosts = '/api/forum/posts';

  static const String events = '/api/events';
  static const String articles = '/api/articles';
  static const String mentorships = '/api/mentorships';
  static const String fundraisings = '/api/fundraisings';
  static const String organizations = '/api/organizations';

  static const String wsChat = '/ws/chat';
}
