import { useState } from 'react';
import { updateServicesQueue as updateServicesQueueRequest } from '../api/services';
import { Service } from '../models/Serivce.model';
import { useFetchServices } from './useFetchServices';

export const useUpdateServicesQueue = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchServices } = useFetchServices();

  const updateServicesQueue = async (updatedServices: Service[]) => {
    setLoading(true);
    try {
      await updateServicesQueueRequest(updatedServices);
      fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { updateServicesQueue, loading, error };
};
