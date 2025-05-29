
import { v4 as uuidv4 } from 'uuid';
import { EduSafeResource } from '@/types/eduSafeTypes';

// Get the current date in ISO format
const currentDate = new Date().toISOString();

// Mock initial data for EduSafe resources
export const initialResources: EduSafeResource[] = [
  {
    id: uuidv4(),
    title: 'School Safety Poster',
    description: 'Visual guide for emergency procedures in school settings',
    file: {
      id: 'file-1',
      name: 'school-safety-poster.pdf',
      type: 'application/pdf',
      size: 2458000,
      base64: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDY4Pj5zdHJlYW0KQlQKMTAwIDcwMCBUZAovRjEgMTIgVGYKKFRoaXMgaXMgYSBzYW1wbGUgUERGIGRvY3VtZW50IGZvciBFZHVTYWZlIFJlc291cmNlcykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago2IDAgb2JqCjw8L1N0ZXUtMT4+CmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMDkgMDAwMDAgbg0KMDAwMDAwMDA1OCAwMDAwMCBuDQowMDAwMDAwMTExIDAwMDAwIG4NCjAwMDAwMDAyMjYgMDAwMDAgbg0KMDAwMDAwMDI5MyAwMDAwMCBuDQowMDAwMDAwNDEwIDAwMDAwIG4NCnRyYWlsZXIKPDwvU2l6ZSA3L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKNDQxCiUlRU9GCg=='
    },
    category: 'posters',
    tags: ['safety', 'emergency', 'procedures'],
    uploadDate: currentDate,
    uploaderId: 'admin-1',
    uploaderName: 'System Administrator',
    ownerType: 'saas',
    resourceType: 'Global Resource'
  },
  {
    id: uuidv4(),
    title: 'Child Safety Guidelines',
    description: 'Comprehensive guide for ensuring child safety in educational environments',
    file: {
      id: 'file-2',
      name: 'child-safety-guidelines.pdf',
      type: 'application/pdf',
      size: 3254000,
      base64: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDY4Pj5zdHJlYW0KQlQKMTAwIDcwMCBUZAovRjEgMTIgVGYKKEd1aWRlbGluZXMgZm9yIGNoaWxkIHNhZmV0eSBpbiBzY2hvb2xzKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjYgMCBvYmoKPDwvU3RldS0xPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZg0KMDAwMDAwMDAwOSAwMDAwMCBuDQowMDAwMDAwMDU4IDAwMDAwIG4NCjAwMDAwMDAxMTEgMDAwMDAgbg0KMDAwMDAwMDIyNiAwMDAwMCBuDQowMDAwMDAwMjkzIDAwMDAwIG4NCjAwMDAwMDA0MTAgMDAwMDAgbg0KdHJhaWxlcgo8PC9TaXplIDcvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NDEKJSVFT0YK'
    },
    category: 'guidelines',
    tags: ['child safety', 'protection', 'guidelines'],
    uploadDate: currentDate,
    uploaderId: 'admin-1',
    uploaderName: 'System Administrator',
    ownerType: 'saas',
    resourceType: 'Global Resource'
  },
  {
    id: uuidv4(),
    title: 'Emergency Response Procedures',
    description: 'Step-by-step procedures for responding to various emergency scenarios',
    file: {
      id: 'file-3',
      name: 'emergency-procedures.pdf',
      type: 'application/pdf',
      size: 1548000,
      base64: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDY4Pj5zdHJlYW0KQlQKMTAwIDcwMCBUZAovRjEgMTIgVGYKKEVtZXJnZW5jeSByZXNwb25zZSBwcm9jZWR1cmVzIGZvciBzY2hvb2xzKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjYgMCBvYmoKPDwvU3RldS0xPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZg0KMDAwMDAwMDAwOSAwMDAwMCBuDQowMDAwMDAwMDU4IDAwMDAwIG4NCjAwMDAwMDAxMTEgMDAwMDAgbg0KMDAwMDAwMDIyNiAwMDAwMCBuDQowMDAwMDAwMjkzIDAwMDAwIG4NCjAwMDAwMDA0MTAgMDAwMDAgbg0KdHJhaWxlcgo8PC9TaXplIDcvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NDEKJSVFT0YK'
    },
    category: 'procedures',
    tags: ['emergency', 'response', 'procedures'],
    uploadDate: currentDate,
    uploaderId: 'admin-1',
    uploaderName: 'System Administrator',
    ownerType: 'saas',
    resourceType: 'Global Resource'
  },
  {
    id: uuidv4(),
    title: 'Annual Safety Assessment Form',
    description: 'Form for conducting annual safety assessments of school facilities',
    file: {
      id: 'file-4',
      name: 'safety-assessment-form.pdf',
      type: 'application/pdf',
      size: 958000,
      base64: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDY4Pj5zdHJlYW0KQlQKMTAwIDcwMCBUZAovRjEgMTIgVGYKKEFubnVhbCBTYWZldHkgQXNzZXNzbWVudCBGb3JtIGZvciBTY2hvb2xzKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjYgMCBvYmoKPDwvU3RldS0xPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZg0KMDAwMDAwMDAwOSAwMDAwMCBuDQowMDAwMDAwMDU4IDAwMDAwIG4NCjAwMDAwMDAxMTEgMDAwMDAgbg0KMDAwMDAwMDIyNiAwMDAwMCBuDQowMDAwMDAwMjkzIDAwMDAwIG4NCjAwMDAwMDA0MTAgMDAwMDAgbg0KdHJhaWxlcgo8PC9TaXplIDcvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NDEKJSVFT0YK'
    },
    category: 'forms',
    tags: ['assessment', 'form', 'safety'],
    uploadDate: currentDate,
    uploaderId: 'admin-1',
    uploaderName: 'System Administrator',
    ownerType: 'saas',
    resourceType: 'Global Resource'
  },
  {
    id: uuidv4(),
    title: 'School-Specific Safety Guide',
    description: 'Custom safety guidelines for North Valley School',
    file: {
      id: 'file-5',
      name: 'north-valley-safety.pdf',
      type: 'application/pdf',
      size: 1258000,
      base64: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDY4Pj5zdHJlYW0KQlQKMTAwIDcwMCBUZAovRjEgMTIgVGYKKEN1c3RvbSBzYWZldHkgZ3VpZGVsaW5lcyBmb3IgTm9ydGggVmFsbGV5IFNjaG9vbCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago2IDAgb2JqCjw8L1N0ZXUtMT4+CmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMDkgMDAwMDAgbg0KMDAwMDAwMDA1OCAwMDAwMCBuDQowMDAwMDAwMTExIDAwMDAwIG4NCjAwMDAwMDAyMjYgMDAwMDAgbg0KMDAwMDAwMDI5MyAwMDAwMCBuDQowMDAwMDAwNDEwIDAwMDAwIG4NCnRyYWlsZXIKPDwvU2l6ZSA3L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKNDQxCiUlRU9GCg=='
    },
    category: 'guidelines',
    tags: ['school-specific', 'guidelines', 'safety'],
    uploadDate: currentDate,
    uploaderId: 'client-1',
    uploaderName: 'North Valley School Admin',
    ownerType: 'school',
    clientId: 'client-1',
    resourceType: 'School Resource'
  }
];
