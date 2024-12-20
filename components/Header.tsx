"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import Image from "next/legacy/image";
import dynamic from "next/dynamic";
import { useSearch } from "@/context/SearchContext";
import { useLocation } from "@/context/LocationContext";
import Link from "next/link";

const LocationPrompt = dynamic(() => import("./LocationPrompt"), { ssr: false });

const Header: React.FC = () => {
    const { searchQuery, setSearchQuery } = useSearch();
    const {
        userLocation,
        setUserLocation,
        userAddress,
        setUserAddress,
        loading,
        setLoading,
    } = useLocation();

    const [showPrompt, setShowPrompt] = useState(false);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";
    const [inactivityTimeout, setInactivityTimeout] = useState<number | null>(null);

    useEffect(() => {
        // Only show prompt if there's no location set
        if (!userLocation) {
            setShowPrompt(true);
        }

        // Load the stored address only if it's available in localStorage and not yet set
        const storedAddress = localStorage.getItem("userAddress");
        if (storedAddress && !userAddress) {
            setUserAddress(storedAddress);
        }

    }, [userLocation, userAddress, setUserAddress]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                showPosition,
                handleError,
                { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const showPosition = (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        reverseGeocodeAddress(latitude, longitude); // Get the address from coordinates
        setLoading(false);
        localStorage.setItem("promptShown", "true"); // Mark prompt as shown
    };

    const handleError = (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error.message);
        alert("Failed to get location. You can enter your address manually.");
        setLoading(false);
    };

    const geocodeAddress = (address: string) => {
        setLoading(true);
        fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`
        )
            .then((response) => response.json())
            .then((data) => {
                if (data.features.length > 0) {
                    const location = data.features[0].center;
                    setUserLocation({ lat: location[1], lon: location[0] });
                    setUserAddress(data.features[0].place_name);
                    localStorage.setItem("userAddress", data.features[0].place_name);
                } else {
                    alert("Geocode was not successful.");
                }
                setLoading(false);
            })
            .catch(() => {
                alert("Failed to fetch geocode.");
                setLoading(false);
            });
    };

    const reverseGeocodeAddress = (lat: number, lon: number) => {
        setLoading(true);
        fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}`
        )
            .then((response) => response.json())
            .then((data) => {
                if (data.features.length > 0) {
                    const formattedAddress = data.features[0].place_name;
                    setUserAddress(formattedAddress);
                    localStorage.setItem("userAddress", formattedAddress);
                } else {
                    alert("No results found for the given location.");
                }
                setLoading(false);
            })
            .catch(() => {
                alert("Failed to fetch address.");
                setLoading(false);
            });
    };

    const handleConfirmLocation = () => {
        setShowPrompt(false);
        setLoading(true);
        getLocation();  // Trigger geolocation request after user confirmation
    };

    const handleManualLocation = (address: string) => {
        setShowPrompt(false);
        geocodeAddress(address);
        localStorage.removeItem('userAddress'); // Optionally clear old address
    };

    return (
        <>
            <Script
                src={`https://api.mapbox.com/mapbox-gl-js/v2.7.0/mapbox-gl.js`}
                strategy="afterInteractive"
                async
                defer
                onLoad={() => console.log("Mapbox GL JS loaded")}
            />
            <link
                href={`https://api.mapbox.com/mapbox-gl-js/v2.7.0/mapbox-gl.css`}
                rel="stylesheet"
            />
            <nav className="bg-white p-4">
                <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
                    <Link href="/home">
                        <div className="flex items-start flex-shrink-0">
                            <Image src="/logo.svg" alt="Logo" width={80} height={80} />
                        </div>
                    </Link>
                    <div className="flex flex-col md:flex-row items-center flex-1 mx-8 mt-4 md:mt-0 text-black">
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            {userAddress && (
                                <span className="truncate w-40 text-black">
                                    {userAddress}
                                </span>
                            )}
                            <button
                                onClick={() => setShowPrompt(true)}
                                className="bg-white text-black px-4 py-2 rounded"
                            >
                                <Image src="/dropdown.png" alt="Dropdown" width={25} height={25} />
                            </button>
                        </div>
                        <div className="flex items-center border border-gray-300 rounded-xl px-2 w-full ml-4">
                            <button className="p-1">
                                <Image src="/search.png" alt="Search" width={20} height={20} />
                            </button>
                            <input
                                type="text"
                                placeholder="Procure supermercados atacadistas..."
                                className="border-none outline-none px-4 py-2 flex-grow text-lg text-black"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    <div className="flex items-center flex-shrink-0 mt-4 md:mt-0">
                        <Link
                            href="/about"
                            className="text-white px-4 py-2 rounded-lg bg-gradient-to-r from-gray-300 to-gray-700 hover:from-gray-500 hover:to-gray-900 transition-all duration-300 ease-in-out font-semibold shadow-md"
                        >
                            Sobre Nós
                        </Link>
                    </div>
                </div>

                {showPrompt && (
                    <LocationPrompt
                        onConfirm={handleConfirmLocation}
                        onManual={handleManualLocation}
                        onAddressChange={(address) => {
                            if (address !== null) {
                                setUserAddress(address); // Only set if it's not null
                            } else {
                                setUserAddress(""); // Default to an empty string or handle null appropriately
                            }
                        }}
                    />
                )}
                {loading && (
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
                        <p>Loading...</p>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Header;
