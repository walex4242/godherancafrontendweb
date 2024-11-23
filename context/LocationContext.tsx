// context/LocationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LocationContextType {
    userLocation: { lat: number; lon: number } | null;
    setUserLocation: (location: { lat: number; lon: number }) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

    return (
        <LocationContext.Provider value={{ userLocation, setUserLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
