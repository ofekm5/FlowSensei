import { useState } from 'react';
import { deleteService as deleteServiceRequest } from '../api/services';
import { Service } from '../models/Serivce.model';
import { useFetchServices } from './useFetchServices';

export const useDeleteService = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchServices } = useFetchServices();

  const deleteService = async (serivceToDelete: Service) => {
    setLoading(true);
    try {
      await deleteServiceRequest(serivceToDelete);
      fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { deleteService, loading, error };
};
