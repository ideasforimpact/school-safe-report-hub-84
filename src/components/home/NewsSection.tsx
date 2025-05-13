
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type NewsItem = {
  id: number;
  title: string;
  source: string;
  date: string;
  summary: string;
  category: string;
  isNew: boolean;
}

interface NewsSectionProps {
  newsItems: NewsItem[];
}

const NewsSection = ({ newsItems }: NewsSectionProps) => {
  const navigate = useNavigate();
  
  return (
    <section className="bg-white py-12 mb-6">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">
            <Newspaper className="h-6 w-6 inline mr-2 text-primary" />
            Safety News & Announcements
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/news')}>
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map(news => (
            <Card key={news.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{news.title}</CardTitle>
                  {news.isNew && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">New</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">{news.source} • {news.date}</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{news.summary}</p>
                <div className="mt-4">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                    news.category === 'transport' 
                      ? 'bg-blue-100 text-blue-800' 
                      : news.category === 'policy' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
                  </span>
                  <Button variant="link" size="sm" className="ml-auto text-primary p-0 h-auto">
                    Read more
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
