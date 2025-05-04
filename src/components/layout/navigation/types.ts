
// Define proper TypeScript interfaces for our navigation items
export interface NavSubItem {
  title: string;
  path: string;
  allowed: boolean;
}

export interface NavItem {
  title: string;
  path?: string;
  allowed: boolean;
  items?: NavSubItem[];
}
