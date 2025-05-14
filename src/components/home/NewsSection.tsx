
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Tag } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  date: string;
  category: string;
  imageUrl: string;
}

interface NewsSectionProps {
  newsItems: NewsItem[];
}

const NewsSection = ({ newsItems }: NewsSectionProps) => {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">News & Announcements</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((item) => (
            <Card key={item.id} className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-xl mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{item.summary}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>{item.date}</span>
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
