"use client";
import React, { useState, useEffect } from "react";
import Image from "next/legacy/image";
import Link from "next/link";
import { useSearch } from "@/context/SearchContext";
import { useSupermarkets } from "@/context/SupermarketContext";
import { Supermarket } from "@/context/SupermarketContext";
import { useRouter } from "next/navigation";
import { useLocation } from "@/context/LocationContext";  // Import LocationContext hook

const Home: React.FC = () => {
    const { userLocation, setUserLocation, loading: userLocationLoading } = useLocation();  // Use location context
    const [filteredSupermarkets, setFilteredSupermarkets] = useState<Supermarket[]>([]);
    const { searchQuery } = useSearch();
    const { supermarkets, loading: supermarketsLoading, error } = useSupermarkets();
    const router = useRouter();

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

    // Haversine distance calculation (to find proximity)
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Returns distance in kilometers
    };

    // Effect for geocoding supermarkets and filtering by proximity
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
                return distance <= 20; // Set proximity to 10 km
            });

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
    }, [userLocation, supermarkets, searchQuery]); // Rerun when userLocation or supermarkets change

    // Handle clicking a supermarket
    const handleSupermarketClick = (supermarket: Supermarket) => {
        router.push(`/supermarket/${supermarket._id}`);
    };

    const handleBackButtonClick = () => {
        window.history.back(); // Go back to the previous page in browser history
    };

    if (userLocationLoading || supermarketsLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
    }

    useEffect(() => {
        if (error && error.includes("Failed to fetch categories or items")) {
            console.log("Redirecting to homepage...");
            router.push("/");  // Navigate to the home page
        }
    }, [error, router]);

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
