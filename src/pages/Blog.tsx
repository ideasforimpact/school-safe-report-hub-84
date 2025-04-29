
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, School, AlertTriangle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const blogPosts = [
  {
    id: 1,
    title: "7 Essential School Safety Measures Every Institution Should Implement",
    excerpt: "Discover the most effective safety protocols that can significantly reduce incidents and create a secure learning environment.",
    date: "April 15, 2025",
    author: "Dr. Sarah Johnson",
    icon: Shield,
    readTime: "8 min read"
  },
  {
    id: 2,
    title: "How Digital Incident Reporting Transforms School Safety Culture",
    excerpt: "Learn how modern incident tracking systems are changing how schools approach safety management and prevention.",
    date: "April 10, 2025",
    author: "Michael Peterson",
    icon: FileText,
    readTime: "6 min read"
  },
  {
    id: 3,
    title: "Building a Positive School Climate Through Safety Initiatives",
    excerpt: "Research shows that proactive safety programs don't just prevent incidents—they improve overall school culture and academic performance.",
    date: "April 5, 2025",
    author: "Emily Martinez, Ed.D.",
    icon: School,
    readTime: "10 min read"
  },
  {
    id: 4,
    title: "Early Warning Signs: Identifying Potential Safety Concerns",
    excerpt: "Recognizing the subtle indicators of emerging safety issues can help administrators intervene before incidents occur.",
    date: "March 28, 2025",
    author: "Robert Williams",
    icon: AlertTriangle,
    readTime: "7 min read"
  }
];

const Blog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReadMore = (id: number) => {
    // In a real app, this would navigate to the full blog post
    console.log(`Navigate to blog post ${id}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">School Safety Blog</h1>
          <p className="text-lg text-gray-600">
            Expert insights and best practices for creating safer educational environments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map(post => (
            <Card key={post.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl font-semibold">{post.title}</CardTitle>
                  <div className="bg-primary-50 p-2 rounded-md">
                    <post.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardDescription className="text-sm text-gray-500">
                  {post.date} • {post.readTime} • By {post.author}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{post.excerpt}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => handleReadMore(post.id)}
                  className="w-full mt-2"
                >
                  Read Full Article
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {!user && (
          <div className="mt-12 bg-primary-50 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-primary-700 mb-2">Want more safety resources?</h3>
            <p className="mb-4 text-gray-600">Sign in to access our full library of safety guides and templates</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Blog;
