"use client";
import React, { useState, useEffect } from "react";
import Image from "next/legacy/image";
import Link from "next/link";
import { useSearch } from "@/context/SearchContext";
import { useSupermarkets } from "@/context/SupermarketContext";
import { Supermarket } from "@/context/SupermarketContext";
import { useRouter } from "next/navigation";

const Home: React.FC = () => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [userLocationLoading, setUserLocationLoading] = useState(true);
    const [filteredSupermarkets, setFilteredSupermarkets] = useState<Supermarket[]>([]);

    const { searchQuery } = useSearch();
    const { supermarkets, loading: supermarketsLoading, error } = useSupermarkets();
    const router = useRouter();

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

    // Fetch user location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
                setUserLocationLoading(false);
            },
            (err) => {
                console.error("Error fetching location:", err);
                setUserLocationLoading(false);
            }
        );
    }, []);

    // Helper: Calculate Haversine Distance
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Geocode supermarket addresses and filter based on proximity
    useEffect(() => {
        const geocodeAndFilterSupermarkets = async () => {
            if (!userLocation) return;

            const geocodedSupermarkets = await Promise.all(
                supermarkets.map(async (supermarket) => {
                    if (!supermarket.coordinates) {
                        try {
                            const response = await fetch(
                                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                                    supermarket.address
                                )}.json?access_token=${mapboxToken}`
                            );
                            const data = await response.json();
                            if (data.features.length > 0) {
                                const [lon, lat] = data.features[0].center;
                                return { ...supermarket, coordinates: { lat, lon } };
                            }
                        } catch (err) {
                            console.error("Error geocoding address:", err);
                        }
                    }
                    return supermarket;
                })
            );

            const filteredByProximity = geocodedSupermarkets.filter((supermarket) => {
                if (!supermarket.coordinates) return false;
                const distance = haversineDistance(
                    userLocation.lat,
                    userLocation.lon,
                    supermarket.coordinates.lat,
                    supermarket.coordinates.lon
                );
                return distance <= 10; // Set desired proximity range (10 km)
            });

            // Apply search query filter
            const finalFilteredSupermarkets = filteredByProximity.filter((supermarket) => {
                const query = searchQuery.toLowerCase();
                return (
                    supermarket.name.toLowerCase().includes(query) ||
                    supermarket.address.toLowerCase().includes(query)
                );
            });

            setFilteredSupermarkets(finalFilteredSupermarkets);
        };

        geocodeAndFilterSupermarkets();
    }, [userLocation, supermarkets, searchQuery]);

    const handleSupermarketClick = (supermarket: Supermarket) => {
        router.push(`/supermarket/${supermarket._id}`);
    };

    if (userLocationLoading || supermarketsLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen"><p>Error loading supermarkets: {error}</p></div>;
    }

    return (
        <main className="flex flex-col items-start bg-white p-4 w-full max-w-screen-lg mx-auto">
            <h1 className="text-2xl font-bold mb-6">Supermercados Atacadistas</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                {filteredSupermarkets.length > 0 ? (
                    filteredSupermarkets.map((supermarket) => (
                        <div
                            key={supermarket._id}
                            className="transition transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg rounded-xl overflow-hidden bg-gray-50 cursor-pointer"
                            onClick={() => handleSupermarketClick(supermarket)}
                        >
                            <Link href={`/supermarket/${supermarket._id}`} legacyBehavior>
                                <a className="block w-full h-full">
                                    <Image
                                        src={supermarket.image || "/fallback-image.jpg"}
                                        alt={supermarket.name}
                                        width={400}
                                        height={200}
                                        priority={true}
                                        className="w-full h-auto object-cover"
                                    />
                                    <div className="p-4">
                                        <p className="text-lg font-semibold">{supermarket.name}</p>
                                        <p className="text-sm text-gray-600">{supermarket.address}</p>
                                    </div>
                                </a>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p className="text-lg font-semibold col-span-full">
                        Nenhum supermercado encontrado perto da sua localização.
                    </p>
                )}
            </div>
        </main>
    );
};

export default Home;
