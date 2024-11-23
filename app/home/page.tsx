"use client";
import React, { useState, useEffect } from "react";
import Image from "next/legacy/image";
import Link from "next/link";
import { useSearch } from "@/context/SearchContext";
import { Category, Item, useSupermarkets } from "@/context/SupermarketContext";
import { useRouter } from "next/navigation";
import { Supermarket as ContextSupermarket } from '../../context/SupermarketContext'

// Define the type for each supermarket
// interface Supermarket {
//     distance: number;
//     _id: string;
//     name: string;
//     image?: string;
//     address: string;
//     categories?: Category[];
//     items?: Item[];
// }

interface Supermarket extends ContextSupermarket {
    distance: number;
}
interface Location {
    lat: number;
    lon: number;
}

const Home: React.FC = () => {
    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [userLocationLoading, setUserLocationLoading] = useState(true);
    const [supermarketsWithDistance, setSupermarketsWithDistance] = useState<Supermarket[]>([]); // Specify the type here

    const { searchQuery } = useSearch();
    const { supermarkets, loading: supermarketsLoading, error } = useSupermarkets();
    const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);

    const router = useRouter();
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';

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

    useEffect(() => {
        if (userLocation && supermarkets.length > 0) {
            const updatedSupermarkets = supermarkets.map(async (supermarket: ContextSupermarket) => {
                const supermarketCoordinates = await geocodeAddress(supermarket.address); // Await the result here
                const distance = calculateDistance(userLocation, supermarketCoordinates);
                console.log("Supermarket Coordinates:", supermarketCoordinates);
                console.log("User Location:", userLocation);
                return { ...supermarket, distance }; // Now correctly includes the distance
            });

            // Since map is now returning an array of Promises, we need to wait for all of them to resolve
            Promise.all(updatedSupermarkets).then((resolvedSupermarkets) => {
                setSupermarketsWithDistance(resolvedSupermarkets);
            });
        }
    }, [userLocation, supermarkets]);


    const filteredSupermarkets = supermarketsWithDistance.filter((supermarket) => {
        console.log("Supermarket Distance:", supermarket.distance); // Log distance for debugging
        return supermarket.distance <= 20; // 20 km radius
    });

    console.log("Filtered Supermarkets:", filteredSupermarkets); // Check the filtered result


    const geocodeAddress = async (address: string): Promise<Location> => {
        try {
            const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`);
            const data = await response.json();
            if (data.features.length > 0) {
                return {
                    lat: data.features[0].center[1],
                    lon: data.features[0].center[0],
                };
            } else {
                console.error("No geocoding results found for address:", address);
                return { lat: 0, lon: 0 }; // Return a default value if no results
            }
        } catch (err) {
            console.error("Error geocoding address:", err);
            return { lat: 0, lon: 0 }; // Return a default value if an error occurs
        }
    };


    const calculateDistance = (location1: Location, location2: Location): number => {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (location2.lat - location1.lat) * Math.PI / 180;
        const dLon = (location2.lon - location1.lon) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(location1.lat * Math.PI / 180) * Math.cos(location2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    };

    const handleSupermarketClick = (supermarket: Supermarket) => {
        setSelectedSupermarket(supermarket);
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
                    filteredSupermarkets.map((supermarket: Supermarket) => (
                        <div
                            key={supermarket._id}
                            className="transition transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg rounded-xl overflow-hidden bg-gray-50 cursor-pointer"
                            onClick={() => handleSupermarketClick(supermarket)}
                        >
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
                        </div>
                    ))
                ) : (
                    <p className="text-lg font-semibold col-span-full">Nenhum supermercado encontrado. Supermercados estão chegando à sua área em breve!</p>
                )}
            </div>
        </main>
    );
};

export default Home;