/// User notification preferences (`GET/PUT /api/users/me/notification-settings`).
class NotificationSettings {
  final bool forumReplyEnabled;
  final bool eventReminderEnabled;
  final bool newsEnabled;
  final bool emailEnabled;
  final bool pushEnabled;

  const NotificationSettings({
    this.forumReplyEnabled = true,
    this.eventReminderEnabled = true,
    this.newsEnabled = true,
    this.emailEnabled = true,
    this.pushEnabled = true,
  });

  NotificationSettings copyWith({
    bool? forumReplyEnabled,
    bool? eventReminderEnabled,
    bool? newsEnabled,
    bool? emailEnabled,
    bool? pushEnabled,
  }) => NotificationSettings(
    forumReplyEnabled: forumReplyEnabled ?? this.forumReplyEnabled,
    eventReminderEnabled: eventReminderEnabled ?? this.eventReminderEnabled,
    newsEnabled: newsEnabled ?? this.newsEnabled,
    emailEnabled: emailEnabled ?? this.emailEnabled,
    pushEnabled: pushEnabled ?? this.pushEnabled,
  );

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      forumReplyEnabled: json['forumReplyEnabled'] as bool? ?? true,
      eventReminderEnabled: json['eventReminderEnabled'] as bool? ?? true,
      newsEnabled: json['newsEnabled'] as bool? ?? true,
      emailEnabled: json['emailEnabled'] as bool? ?? true,
      pushEnabled: json['pushEnabled'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'forumReplyEnabled': forumReplyEnabled,
    'eventReminderEnabled': eventReminderEnabled,
    'newsEnabled': newsEnabled,
    'emailEnabled': emailEnabled,
    'pushEnabled': pushEnabled,
  };
}
