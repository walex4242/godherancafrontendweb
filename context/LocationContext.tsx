// context/LocationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationContextType {
    userLocation: { lat: number; lon: number } | null;
    setUserLocation: (location: { lat: number; lon: number }) => void;
    userAddress: string | null;
    setUserAddress: (address: string) => void;
    loading: boolean;
    setLoading: (isLoading: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize location (once on load)
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
                setLoading(false);
            },
            () => setLoading(false), // Fallback if location access is denied
        );
    }, []);

    return (
        <LocationContext.Provider
            value={{
                userLocation,
                setUserLocation,
                userAddress,
                setUserAddress,
                loading,
                setLoading,
            }}
        >
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
