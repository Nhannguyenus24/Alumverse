/// A normalized skill from the shared catalog (`skills` table), used by the
/// mentor "filter by skill" search and matched against `mentor_skills`.
class Skill {
  final int id;
  final String name;

  const Skill({required this.id, required this.name});

  factory Skill.fromJson(Map<String, dynamic> json) {
    return Skill(id: (json['id'] as num).toInt(), name: json['name'] as String);
  }
}
