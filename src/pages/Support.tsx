
import PublicLayout from "@/components/layout/PublicLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Mail, PhoneCall, MessageSquare } from "lucide-react";

const faqs = [
  {
    question: "How can I report an incident?",
    answer: "Reporting an incident is simple. Log into your account, click on the 'Report Incident' button in the dashboard, and fill out the incident form with all relevant details. You can also attach photos or documents to provide additional context."
  },
  {
    question: "How do I add users to my school's account?",
    answer: "Administrators can add users by navigating to the User Management section. Click on 'Add User', fill in their details, and assign appropriate roles. New users will receive an email invitation to set their password and access the system."
  },
  {
    question: "Can I export incident reports for external use?",
    answer: "Yes, you can export incident data in various formats (PDF, CSV, Excel) for record-keeping or sharing with stakeholders. Go to the Incidents List, use the filter options to select the data you need, then click on the Export button in the top-right corner."
  },
  {
    question: "How secure is the data stored in Safe School?",
    answer: "We take data security very seriously. All data is encrypted in transit and at rest. We implement industry-standard security measures including role-based access controls, secure servers, and regular security audits to ensure your school's information remains protected."
  },
  {
    question: "What should I do if I forgot my password?",
    answer: "If you've forgotten your password, click on the 'Forgot Password' link on the login page. Enter your email address, and we'll send you instructions to reset your password. For security reasons, password reset links expire after 24 hours."
  }
];

const Support = () => {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">How Can We Help You?</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our support team is here to help you get the most out of Safe School's incident management system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <PhoneCall className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Call Us</CardTitle>
              <CardDescription>Talk to our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">1-800-SAFE-SCH</p>
              <p className="text-sm text-gray-500">Monday to Friday, 8am - 6pm EST</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Email Support</CardTitle>
              <CardDescription>Get help via email</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">support@safeschool.com</p>
              <p className="text-sm text-gray-500">We typically respond within 24 hours</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Live Chat</CardTitle>
              <CardDescription>Instant support via chat</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">Start a live chat</p>
              <p className="text-sm text-gray-500">Available 24/7 for urgent issues</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center">
                      <HelpCircle className="h-5 w-5 text-primary mr-2" />
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Contact Us</h2>
          <div className="max-w-2xl mx-auto">
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <Input id="subject" placeholder="What is this regarding?" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <Textarea id="message" placeholder="How can we help you?" rows={5} />
              </div>
              <div className="text-center">
                <Button className="px-8">Submit Request</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Support;
