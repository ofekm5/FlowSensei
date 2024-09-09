import { useState, useEffect } from 'react';
import { fetchServices as fetchServicesRequest } from '../api/services';
import { Service } from '../models/Serivce.model';

export const useFetchServices = () => {
  const [servicesFromDB, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    //setLoading(true);
    try {
      const response = await fetchServicesRequest();
      setServices(response.data.services);
    } catch (err) {
      //setError('Failed to fetch services.');
    } finally {
      //setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return { servicesFromDB, fetchServices, loading, error };
};
