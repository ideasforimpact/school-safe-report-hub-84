import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts';
import { supabase } from '@/integrations/supabase/client';
import { Committee, CommitteeEvent, fetchCommitteeById, fetchCommitteeEventById } from '@/services/committees/committeeService';
import { toast } from 'sonner';

const CommitteeEventViewPage = () => {
  const { committeeId = '', eventId = '' } = useParams();
  const navigate = useNavigate();
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId || '';

  const [committee, setCommittee] = useState<Committee | null>(null);
  const [event, setEvent] = useState<CommitteeEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!clientId || !committeeId || !eventId) return;
    try {
      setLoading(true);
      const [committeeData, eventData] = await Promise.all([
        fetchCommitteeById(committeeId, clientId),
        fetchCommitteeEventById(eventId, clientId),
      ]);
      setCommittee(committeeData);
      setEvent(eventData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load MOM/Event details');
    } finally {
      setLoading(false);
    }
  }, [clientId, committeeId, eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const downloadAll = () => {
    if (!event?.attachments || event.attachments.length === 0) return;
    event.attachments.forEach(async (attachment) => {
      try {
        let blob: Blob | null = null;
        if (attachment.storage_bucket && attachment.storage_path) {
          const { data, error } = await supabase.storage
            .from(attachment.storage_bucket)
            .download(attachment.storage_path);
          if (error) throw error;
          blob = data;
        } else {
          const response = await fetch(attachment.file_url);
          blob = await response.blob();
        }

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        toast.error(`Failed to download ${attachment.file_name}`);
      }
    });
  };

  return (
    <Layout>
      <div className="w-full py-6">
        <div className="mx-6 mb-4">
          <Button variant="ghost" className="px-0" onClick={() => navigate(`/committees/${committeeId}/events`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to MOM/Event Listing
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading details...</div>
          ) : !event ? (
            <div className="py-10 text-center text-gray-500">MOM/Event not found.</div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <p><span className="font-medium">Committee name:</span> {committee?.name || '-'}</p>
              <p><span className="font-medium">Date:</span> {event.event_date}</p>
              <p><span className="font-medium">Participants:</span> {(event.participant_names || []).join(', ') || '-'}</p>
              <div>
                <p className="font-medium mb-1">Description</p>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description || '-'}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Attachments</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAll}
                    disabled={!event.attachments || event.attachments.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download attachments
                  </Button>
                </div>
                {!event.attachments || event.attachments.length === 0 ? (
                  <p className="text-gray-500">No attachments</p>
                ) : (
                  <ul className="space-y-1">
                    {event.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {attachment.file_name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CommitteeEventViewPage;
