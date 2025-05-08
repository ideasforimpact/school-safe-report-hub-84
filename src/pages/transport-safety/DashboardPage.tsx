
import React from 'react';
import { ArrowLeft, AlertCircle, Clock, CheckCircle2, FileText, Car, Bus, Truck } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TransportSafetyProvider, useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';

const DashboardContent = () => {
  const { vehicles } = useTransportSafety();
  
  // Status counts
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;
  
  // Document status
  const expiredDocs = vehicles.flatMap(v => v.documents).filter(d => d.status === 'expired').length;
  const expiringSoonDocs = vehicles.flatMap(v => v.documents).filter(d => d.status === 'expiring_soon').length;
  const validDocs = vehicles.flatMap(v => v.documents).filter(d => d.status === 'valid').length;
  
  // Vehicle types
  const busCount = vehicles.filter(v => v.type === 'bus').length;
  const carCount = vehicles.filter(v => v.type === 'car').length;
  const vanCount = vehicles.filter(v => v.type === 'van').length;
  const truckCount = vehicles.filter(v => v.type === 'truck').length;
  const otherCount = vehicles.filter(v => !['bus', 'car', 'van', 'truck'].includes(v.type)).length;
  
  // Vehicles with expired documents
  const vehiclesWithExpiredDocs = vehicles.filter(v => 
    v.documents.some(d => d.status === 'expired')
  );
  
  // Vehicles with soon expiring documents
  const vehiclesWithExpiringSoonDocs = vehicles.filter(v => 
    !v.documents.some(d => d.status === 'expired') && 
    v.documents.some(d => d.status === 'expiring_soon')
  );

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button asChild variant="ghost" className="mr-4">
            <Link to="/transport-safety">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicles
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Transport Safety Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-500">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-500">Document Alerts</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex space-x-4">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xl font-bold text-red-500">{expiredDocs}</span>
                <span className="ml-1 text-gray-500">expired</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-xl font-bold text-yellow-500">{expiringSoonDocs}</span>
                <span className="ml-1 text-gray-500">expiring soon</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/transport-safety">View All</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-500">Vehicle Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                {activeVehicles} Active
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                {maintenanceVehicles} In Maintenance
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                {inactiveVehicles} Inactive
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Fleet Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Bus className="h-5 w-5 mr-2 text-blue-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>Buses</span>
                    <span>{busCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(busCount / vehicles.length) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Car className="h-5 w-5 mr-2 text-green-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>Cars</span>
                    <span>{carCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(carCount / vehicles.length) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Car className="h-5 w-5 mr-2 text-purple-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>Vans</span>
                    <span>{vanCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(vanCount / vehicles.length) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Truck className="h-5 w-5 mr-2 text-orange-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>Trucks</span>
                    <span>{truckCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(truckCount / vehicles.length) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              {otherCount > 0 && (
                <div className="flex items-center">
                  <CircleDot className="h-5 w-5 mr-2 text-gray-500" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span>Other</span>
                      <span>{otherCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${(otherCount / vehicles.length) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>Expired</span>
                    <span>{expiredDocs}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${expiredDocs / (expiredDocs + expiringSoonDocs + validDocs) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>Expiring Soon</span>
                    <span>{expiringSoonDocs}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${expiringSoonDocs / (expiredDocs + expiringSoonDocs + validDocs) * 100}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>Valid</span>
                    <span>{validDocs}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${validDocs / (expiredDocs + expiringSoonDocs + validDocs) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              <span>Vehicles with Compliance Issues</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehiclesWithExpiredDocs.length === 0 && vehiclesWithExpiringSoonDocs.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <CheckCircle2 className="h-8 w-8 text-green-500 mr-2" />
                <span className="text-lg">All vehicles are compliant</span>
              </div>
            ) : (
              <div className="space-y-6">
                {vehiclesWithExpiredDocs.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                      Vehicles with Expired Documents
                    </h3>
                    <div className="space-y-2">
                      {vehiclesWithExpiredDocs.map(vehicle => (
                        <Link 
                          key={vehicle.id} 
                          to={`/transport-safety/${vehicle.id}/documents`}
                          className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            <VehicleTypeIcon type={vehicle.type} className="mr-2" />
                            <div>
                              <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                              <div className="text-sm text-gray-500">{vehicle.registrationNumber}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 mr-2">
                              {vehicle.documents.filter(d => d.status === 'expired').length} expired
                            </Badge>
                            <FileText className="h-4 w-4 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {vehiclesWithExpiringSoonDocs.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                      Vehicles with Soon Expiring Documents
                    </h3>
                    <div className="space-y-2">
                      {vehiclesWithExpiringSoonDocs.map(vehicle => (
                        <Link 
                          key={vehicle.id} 
                          to={`/transport-safety/${vehicle.id}/documents`}
                          className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            <VehicleTypeIcon type={vehicle.type} className="mr-2" />
                            <div>
                              <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                              <div className="text-sm text-gray-500">{vehicle.registrationNumber}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 mr-2">
                              {vehicle.documents.filter(d => d.status === 'expiring_soon').length} expiring soon
                            </Badge>
                            <FileText className="h-4 w-4 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant: 'default' | 'outline' }
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
      variant === 'outline' ? "border" : '',
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

const DashboardPage = () => {
  return (
    <Layout>
      <TransportSafetyProvider>
        <DashboardContent />
      </TransportSafetyProvider>
    </Layout>
  );
};

export default DashboardPage;
