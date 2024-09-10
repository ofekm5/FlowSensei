import { FC, useEffect } from "react";
import { useFetchServices } from "../../hooks/useFetchServices";
import Preferences from "./Preferences";

interface IProps {

}

export const PriorityPageContainer: FC<IProps> = () => {
    const { servicesFromDB, fetchServices, loading, error } = useFetchServices();

    return <Preferences servicesFromDB={servicesFromDB} />
}