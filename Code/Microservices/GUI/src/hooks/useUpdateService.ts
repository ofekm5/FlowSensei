import { useState } from 'react';
import { updateService as updateServiceRequest } from '../api/services';
import { Service } from '../models/Serivce.model';
import { useFetchServices } from './useFetchServices';

export const useUpdateService = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchServices } = useFetchServices();

  const updateService = async (updatedService: Service) => {
    setLoading(true);
    try {
      await updateServiceRequest(updatedService);
      fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { updateService, loading, error };
};
