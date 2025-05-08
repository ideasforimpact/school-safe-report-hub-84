
import { NewsItem } from './NewsSection';

export const newsAndAnnouncements: NewsItem[] = [
  {
    id: 1,
    title: "New Safety Guidelines for School Transport",
    source: "National School Safety Council",
    date: "May 3, 2025",
    summary: "Updated guidelines on vehicle safety standards and driver requirements for school transport vehicles.",
    category: "transport",
    isNew: true,
  },
  {
    id: 2,
    title: "Mandatory Safety Drills Schedule Released",
    source: "Department of Education",
    date: "April 28, 2025",
    summary: "Schools must conduct quarterly safety drills following the new schedule released by the Department of Education.",
    category: "policy",
    isNew: false,
  },
  {
    id: 3,
    title: "Fire Safety Certificate Requirements Updated",
    source: "Fire Safety Authority",
    date: "April 15, 2025",
    summary: "New requirements for obtaining and renewing fire safety certificates for educational institutions.",
    category: "compliance",
    isNew: false,
  }
];
