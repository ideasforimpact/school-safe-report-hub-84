
import { ArrowLeft, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";

// Types for news items
interface NewsItem {
  id: number;
  title: string;
  source: string;
  date: string;
  summary: string;
  content?: string;
  category: "transport" | "policy" | "compliance" | "health" | "general";
  isNew: boolean;
}

const NewsPage = () => {
  // Sample news data - in a real app this would come from an API or context
  const newsItems: NewsItem[] = [
    {
      id: 1,
      title: "New Safety Guidelines for School Transport",
      source: "National School Safety Council",
      date: "May 3, 2025",
      summary: "Updated guidelines on vehicle safety standards and driver requirements for school transport vehicles.",
      content: "The National School Safety Council has released comprehensive guidelines addressing various aspects of school transportation safety. The new guidelines include mandatory background checks for drivers every six months, installation of GPS tracking systems in all school vehicles, and regular mechanical inspections. Schools are expected to comply with these guidelines by August 15, 2025.",
      category: "transport",
      isNew: true,
    },
    {
      id: 2,
      title: "Mandatory Safety Drills Schedule Released",
      source: "Department of Education",
      date: "April 28, 2025",
      summary: "Schools must conduct quarterly safety drills following the new schedule released by the Department of Education.",
      content: "The Department of Education has released the schedule for mandatory safety drills for the academic year 2025-26. All schools are required to conduct fire drills, earthquake drills, and lockdown procedures on a quarterly basis. Documentation of these drills must be submitted to the district education office within 5 working days of completion.",
      category: "policy",
      isNew: false,
    },
    {
      id: 3,
      title: "Fire Safety Certificate Requirements Updated",
      source: "Fire Safety Authority",
      date: "April 15, 2025",
      summary: "New requirements for obtaining and renewing fire safety certificates for educational institutions.",
      content: "The Fire Safety Authority has updated the requirements for fire safety certification in educational institutions. The new guidelines mandate additional fire extinguishers in laboratory areas, upgraded smoke detection systems, and dedicated fire evacuation plans for differently-abled students. Existing certificates will remain valid until their expiration date, after which renewal will require compliance with these new standards.",
      category: "compliance",
      isNew: false,
    },
    {
      id: 4,
      title: "Mental Health First Aid Training Now Mandatory",
      source: "Ministry of Health & Education",
      date: "April 10, 2025",
      summary: "All schools must have at least two staff members trained in Mental Health First Aid by December 2025.",
      content: "In a joint directive, the Ministries of Health and Education have announced that all educational institutions must have a minimum of two staff members certified in Mental Health First Aid by the end of the calendar year. The initiative aims to improve early intervention and support for students experiencing mental health challenges. Government-subsidized training programs will be available starting June 2025.",
      category: "health",
      isNew: false,
    },
    {
      id: 5,
      title: "Digital Safety Curriculum Updates",
      source: "Cyber Safety Commission",
      date: "March 22, 2025",
      summary: "New modules on digital citizenship and online safety to be integrated into the school curriculum.",
      content: "The Cyber Safety Commission has developed new educational modules focused on digital citizenship, online privacy, and cyberbullying prevention. These modules will become mandatory components of the national curriculum starting from the next academic year. Teacher training workshops will be conducted in phases starting July 2025.",
      category: "general",
      isNew: true,
    },
    {
      id: 6,
      title: "School Building Safety Audit Requirements",
      source: "Infrastructure Safety Board",
      date: "March 15, 2025",
      summary: "Comprehensive safety audit of school buildings now required every three years.",
      content: "The Infrastructure Safety Board has introduced a requirement for comprehensive safety audits of all school buildings every three years. These audits must be conducted by certified structural engineers and should cover structural integrity, electrical systems, water quality, and accessibility features. Reports must be filed with both the education department and local municipal authorities.",
      category: "compliance",
      isNew: false,
    }
  ];

  // Get category count for filtering options
  const getCategoryCount = (category: string) => {
    return newsItems.filter(item => item.category === category).length;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Button asChild variant="ghost" className="mr-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <Newspaper className="h-6 w-6 mr-2 text-primary" />
            Safety News & Announcements
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filter By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Categories</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm cursor-pointer hover:text-primary flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          All Categories
                        </label>
                        <span className="text-xs text-gray-500">{newsItems.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm cursor-pointer hover:text-primary flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Transport
                        </label>
                        <span className="text-xs text-gray-500">{getCategoryCount('transport')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm cursor-pointer hover:text-primary flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Policy
                        </label>
                        <span className="text-xs text-gray-500">{getCategoryCount('policy')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm cursor-pointer hover:text-primary flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Compliance
                        </label>
                        <span className="text-xs text-gray-500">{getCategoryCount('compliance')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm cursor-pointer hover:text-primary flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Health
                        </label>
                        <span className="text-xs text-gray-500">{getCategoryCount('health')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm cursor-pointer hover:text-primary flex items-center">
                          <input type="checkbox" className="mr-2" />
                          General
                        </label>
                        <span className="text-xs text-gray-500">{getCategoryCount('general')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Time Period</h3>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm cursor-pointer hover:text-primary">
                        <input type="radio" name="time" className="mr-2" defaultChecked />
                        All Time
                      </label>
                      <label className="flex items-center text-sm cursor-pointer hover:text-primary">
                        <input type="radio" name="time" className="mr-2" />
                        Last Month
                      </label>
                      <label className="flex items-center text-sm cursor-pointer hover:text-primary">
                        <input type="radio" name="time" className="mr-2" />
                        Last 3 Months
                      </label>
                      <label className="flex items-center text-sm cursor-pointer hover:text-primary">
                        <input type="radio" name="time" className="mr-2" />
                        This Year
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content area with news cards */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsItems.map((news) => (
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
                    <p className="text-gray-700 mb-4">{news.content || news.summary}</p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                        news.category === 'transport' 
                          ? 'bg-blue-100 text-blue-800' 
                          : news.category === 'policy' 
                          ? 'bg-purple-100 text-purple-800' 
                          : news.category === 'health'
                          ? 'bg-red-100 text-red-800'
                          : news.category === 'general'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
                      </span>
                      <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                        Read full article
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewsPage;
