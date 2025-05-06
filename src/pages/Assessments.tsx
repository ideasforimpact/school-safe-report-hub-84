
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { Award, CheckSquare, FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Assessments = () => {
  return (
    <Layout>
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Award className="h-6 w-6 text-blue-600" />
              Assessments
            </h1>
            <p className="text-muted-foreground">
              Manage and view safety and compliance assessments
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New Assessment
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Assessment Types */}
          <Card className="overflow-hidden border hover:border-blue-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="bg-blue-50 pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Safety Audit
              </CardTitle>
              <CardDescription>Comprehensive facility safety review</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Building safety compliance</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Emergency preparedness</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Hazardous materials handling</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-4">
                Start New Audit
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border hover:border-purple-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="bg-purple-50 pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Threat Assessment
              </CardTitle>
              <CardDescription>Identify and evaluate potential threats</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Security vulnerability analysis</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Risk factor evaluation</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Mitigation strategy development</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-4">
                Begin Assessment
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border hover:border-emerald-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="bg-emerald-50 pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Compliance Check
              </CardTitle>
              <CardDescription>Regulatory compliance validation</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Policy implementation review</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Documentation verification</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Training record validation</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-4">
                Start Compliance Check
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>
              View and manage your recently completed or in-progress assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              No assessments completed yet. Start a new assessment to begin.
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Assessments;
