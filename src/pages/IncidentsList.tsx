
import Layout from '@/components/layout/Layout';

const IncidentsList = () => {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Records</h2>
          <p className="text-gray-600">There are no incidents to display.</p>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsList;
