export const DEFAULT_FORUM_CATEGORY_TREE = [
  {
    id: 1,
    name: 'General',
    description: 'General discussions',
    parentId: null,
    ordering: 1,
    topicsCount: 8,
    children: [
      {
        id: 2,
        name: 'Alumni Career',
        description: 'Jobs and career advice',
        parentId: 1,
        ordering: 1,
        topicsCount: 24,
        children: [
          {
            id: 7,
            name: 'Internships',
            description: 'Internship opportunities',
            parentId: 2,
            ordering: 1,
            topicsCount: 6,
            children: [],
          },
        ],
      },
      {
        id: 3,
        name: 'Events',
        description: 'Meetups and reunions',
        parentId: 1,
        ordering: 2,
        topicsCount: 11,
        children: [],
      },
    ],
  },
];
