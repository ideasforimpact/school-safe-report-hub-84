-- Setup basic template categories for assessment templates
-- This script creates the basic categories that can be used for assessment templates

INSERT INTO template_categories (name, description) VALUES
('Safety', 'Safety assessment templates'),
('Quality', 'Quality assessment templates'),
('Risk', 'Risk assessment templates'),
('Compliance', 'Compliance assessment templates'),
('Performance', 'Performance assessment templates'),
('Training', 'Training assessment templates')
ON CONFLICT (name) DO NOTHING;

-- Verify the categories were created
SELECT * FROM template_categories ORDER BY name;

