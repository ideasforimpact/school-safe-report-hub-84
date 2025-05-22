
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';

interface ModuleAccessProps {
  modules: {
    id: string;
    name: string;
    level: string;
    icon: string;
    access_level: Record<string, any>;
  }[];
}

const ModuleAccessTab = ({ modules }: ModuleAccessProps) => {
  // Check if the user has admin access based on access_level
  const isAdminForModule = (accessLevel: Record<string, any>): boolean => {
    if (!accessLevel || Object.keys(accessLevel).length === 0) {
      return false;
    }
    
    return accessLevel.is_admin === true;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Module Access</span>
          <span className="text-sm text-muted-foreground">
            Total Modules: {modules.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <p className="text-muted-foreground py-4">No module access configured.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Admin Access</TableHead>
                <TableHead>Access Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{module.level}</Badge>
                  </TableCell>
                  <TableCell>
                    {isAdminForModule(module.access_level) ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Yes</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" />
                        <span>No</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {Object.keys(module.access_level).length === 0 ? (
                      <span className="text-muted-foreground">Basic access</span>
                    ) : (
                      <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(module.access_level, null, 2)}
                      </pre>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleAccessTab;
