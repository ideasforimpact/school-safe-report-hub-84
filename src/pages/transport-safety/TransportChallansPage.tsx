import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import PendingChallansList from './PendingChallansList';

const TransportChallansPage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="w-full py-6">
        {/* Header */}
        <div className="mx-6 mb-6 flex items-center gap-3">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold">Transport Challans</h1>
            <p className="text-sm text-gray-500">
              Pending challans for transport vehicles
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <PendingChallansList />
        </div>
      </div>
    </Layout>
  );
};

export default TransportChallansPage;
