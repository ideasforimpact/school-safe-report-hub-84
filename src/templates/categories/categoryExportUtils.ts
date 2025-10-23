// Minimal utilities used by CategoryTab to avoid build errors.
// Provides download of categories template and export via functions if needed.
import { supabase } from '@/integrations/supabase/client';

export const downloadTemplateJSON = () => {
  const template = {
    categories: [
      {
        id: '',
        name: 'Cyber Safety',
        description: 'Incidents related to cyber security, online safety, and digital threats',
        client_id: '',
        subcategories: [
          { id: '', name: 'Cyberbullying', description: 'Online harassment, bullying, or intimidation through digital platforms', category_id: '', client_id: '' },
          { id: '', name: 'Data Breach', description: 'Unauthorized access to sensitive information or data', category_id: '', client_id: '' }
        ]
      }
    ]
  };

  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'categories-template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};

export const downloadCategoriesJSON = async (clientId: string, clientName?: string) => {
  // Basic export using tables; for rich export, create a dedicated function.
  const { data: categories } = await supabase
    .from('incident_categories')
    .select('id,name,description')
    .eq('client_id', clientId);

  const { data: subcategories } = await supabase
    .from('incident_subcategories')
    .select('id,name,description,category_id')
    .eq('client_id', clientId);

  const map: Record<string, any[]> = {};
  (subcategories || []).forEach(s => {
    map[s.category_id] = map[s.category_id] || [];
    map[s.category_id].push({ id: s.id, name: s.name, description: s.description, category_id: s.category_id, client_id: '' });
  });

  const payload = {
    metadata: {
      version: '1.0.0',
      description: 'Exported Categories',
      created_at: new Date().toISOString(),
      client_id: clientId,
      client_name: clientName || 'Client'
    },
    categories: (categories || []).map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      client_id: clientId,
      subcategories: map[c.id] || []
    }))
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `categories-export-${(clientName || 'client').replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};


