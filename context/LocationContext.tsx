// context/LocationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationContextType {
    userLocation: { lat: number; lon: number } | null;
    setUserLocation: (location: { lat: number; lon: number }) => void;
    userAddress: string | null;
    setUserAddress: (address: string) => void;
    loading: boolean;
    setLoading: (isLoading: boolean) => void;
    getLocation: () => void; // Add getLocation function to trigger geolocation
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Trigger location request after user action (click)
    const getLocation = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                    setLoading(false);
                },
                () => {
                    setLoading(false); // Fallback if location access is denied
                }
            );
        } else {
            setLoading(false); // If geolocation is not supported
        }
    };

    // Optionally, you can trigger geolocation once per component load (remove useEffect if needed)
    // useEffect(() => {
    //     getLocation(); // Automatically call geolocation on load
    // }, []);

    return (
        <LocationContext.Provider
            value={{
                userLocation,
                setUserLocation,
                userAddress,
                setUserAddress,
                loading,
                setLoading,
                getLocation, // Expose getLocation to components
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
