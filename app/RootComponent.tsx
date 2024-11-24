"use client";
import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../app/redux'; // Ensure the path is correct
import ClientSideWrapper from '../app/ClientSideWrapper';
import StoreProvider from '../app/redux'; // Your custom StoreProvider
import { SearchProvider, useSearch } from '@/context/SearchContext';
import { SupermarketProvider } from '@/context/SupermarketContext';
import { LocationProvider } from '@/context/LocationContext';

const RootComponent = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useAppDispatch();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Reset auth state on mount if not authenticated
    }, [dispatch]);

    if (!mounted) return <div>Loading...</div>;

    return <>{children}</>; // Render children directly
};

const RootComponentWithProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <StoreProvider>
            <LocationProvider>
                <SearchProvider>
                    <SupermarketProvider>
                    <ClientSideWrapper>
                        <RootComponent>{children}</RootComponent>
                    </ClientSideWrapper>
                    </SupermarketProvider>
                </SearchProvider>
            </LocationProvider>
        </StoreProvider>
    );
};

export default RootComponentWithProvider;
