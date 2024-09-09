import { Service } from '../models/Serivce.model';
import axiosInstance from './axiosInstance';

export const fetchServices = () => {
  return axiosInstance.get('/service-list');
};

export const createService = (serviceData: Partial<Service>) => {
  return axiosInstance.post('/service', {properties: serviceData});
};

export const updateService = (serviceData: Service) => {
    return axiosInstance.post('/service', serviceData);
};

export const deleteService = (serivceToDelete: Service) => {
    return axiosInstance.delete('/service', {data: { id: serivceToDelete.id }});
};

export const updateServicesQueue = (updatedServicesQueue: Service[]) => {
    return axiosInstance.post('/services', updatedServicesQueue);
};