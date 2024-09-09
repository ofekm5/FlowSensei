import { useState } from 'react';
import { createService as createServiceRequest } from '../api/services';
import { Service } from '../models/Serivce.model';
import { useFetchServices } from './useFetchServices';

export const useCreateService = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchServices } = useFetchServices();

  const createService = async (newServiceData: Partial<Service>) => {
    setLoading(true);
    try {
      await createServiceRequest(newServiceData);
      fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { createService, loading, error };
};
