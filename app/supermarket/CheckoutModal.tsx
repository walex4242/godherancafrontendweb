import React, { useCallback, useState, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Item } from '../../context/SupermarketContext';
import useGoogleMapsLoader from '../../hook/GoogleMap'; // Adjust the path as needed
import mapboxSdk from '@mapbox/mapbox-sdk';
import geocodingService from '@mapbox/mapbox-sdk/services/geocoding';
import directionsService from '@mapbox/mapbox-sdk/services/directions';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: Item[];
    customerName: string;
    streetAddress: string;
    note: string;
    paymentMethod: 'Pix' | 'credit-card' | null;
    onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNoteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onPaymentMethodChange: (method: 'Pix' | 'credit-card' | null) => void;
    supermarketAddress: string;
    supermarketName: string;
}

interface MapboxFeature {
    place_name: string; // The name of the place (what you want to display)
    geometry: {
        coordinates: [number, number]; // [longitude, latitude]
    };
}

interface Coordinates {
    latitude: number;
    longitude: number;
}

const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';

const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    cart,
    customerName,
    streetAddress,
    note,
    paymentMethod,
    onNameChange,
    onAddressChange,
    onNoteChange,
    onPaymentMethodChange,
    supermarketAddress,
    supermarketName
}) => {
    const [distance, setDistance] = useState<number | null>(null);
    const geocodingClient = geocodingService({ accessToken: mapboxAccessToken });
    const directionsClient = directionsService({ accessToken: mapboxAccessToken });
    const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string>(streetAddress);
    const [debouncedQuery, setDebouncedQuery] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false); 

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(selectedAddress);
        }, 500);

        return () => clearTimeout(timeout);
    }, [selectedAddress]);

    useEffect(() => {
        if (debouncedQuery && isTyping) {
            geocodeAddress(debouncedQuery);
        } else {
            setAutocompleteResults([]);
        }
        setIsTyping(false);
    }, [debouncedQuery]);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSelectedAddress(query);
        if (!query) {
            setAutocompleteResults([]);
        } else {
            setIsTyping(true);
        }
    };

    const handleAddressSelect = (address: string) => {
        setSelectedAddress(address);
        setIsAddressSelected(true);  // Set to true when an address is selected
        onAddressChange({
            target: { value: address },
        } as React.ChangeEvent<HTMLInputElement>);
        setAutocompleteResults([]);
        calculateDistance(address);
    };



    const geocodeAddress = async (query: string): Promise<Coordinates | null> => {
        try {
            const response = await geocodingClient
                .forwardGeocode({
                    query,
                    limit: 5, // Increase the limit to show multiple results
                })
                .send();

            console.log('Geocode response:', response.body); // Log the full response to debug

            const features = response.body.features as MapboxFeature[];

            if (features.length > 0) {
                const addresses = features.map(feature => feature.place_name); // Extract address names
                setAutocompleteResults(addresses); // Set the autocomplete results
                return { longitude: features[0].geometry.coordinates[0], latitude: features[0].geometry.coordinates[1] };
            } else {
                setAutocompleteResults([]); // Clear results if no features found
                return null;
            }
        } catch (error) {
            console.error('Error in geocoding address:', error);
            return null;
        }
    };

    const calculateDistance = async (address: string) => {
        if (!supermarketAddress || !address) {
            console.warn('Supermarket address or customer address is missing.');
            return;
        }

        try {
            // Get coordinates for the supermarket and customer address
            const originCoords = await geocodeAddress(supermarketAddress);
            const destinationCoords = await geocodeAddress(address);

            if (!originCoords || !destinationCoords) {
                console.warn('Failed to get coordinates for one or both addresses.');
                return;
            }

            const response = await directionsClient
                .getDirections({
                    profile: 'driving',
                    waypoints: [
                        { coordinates: [originCoords.longitude, originCoords.latitude] },
                        { coordinates: [destinationCoords.longitude, destinationCoords.latitude] },
                    ],
                })
                .send();

            if (response.body.routes.length > 0) {
                const distanceInMeters = response.body.routes[0].distance;
                const distanceInKilometers = distanceInMeters / 1000;
                setDistance(distanceInKilometers);
            } else {
                setDistance(null);
            }
        } catch (error) {
            console.error('Error calculating distance:', error);
            setDistance(null);
        }
    };


    const cartTotal = cart.reduce((total, item) => {
        const itemPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
        return total + itemPrice * item.quantity;
    }, 0);

    const convertToStandardUnit = (weight: number, unit: string): number => {
        switch (unit) {
            case 'g':
                return weight / 1000;
            case 'kg':
                return weight;
            case 'L':
                return weight;
            default:
                return weight;
        }
    };

    const totalWeight = cart.reduce((total, item) => {
        const itemWeightInKgOrLiters = convertToStandardUnit(item.weight, item.unit);
        return total + itemWeightInKgOrLiters * item.quantity;
    }, 0);

    const pickingFee = cart.reduce((total, item) => {
        const itemWeightInKgOrLiters = convertToStandardUnit(item.weight, item.unit);
        return total + item.quantity * 0.25 + itemWeightInKgOrLiters * 0.25;
    }, 0);

    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);

    let deliveryRatePerKilometer = 2;
    if (totalQuantity > 100 || totalWeight > 30) {
        deliveryRatePerKilometer = 4;
    }

    const MAX_DELIVERY_FEE = 100; // Example cap
    const deliveryFee = distance ? Math.min(distance * deliveryRatePerKilometer, MAX_DELIVERY_FEE) : 0;
    const total = (cartTotal + pickingFee + deliveryFee).toFixed(2);


    console.log('Delivery rate per kilometer:', deliveryRatePerKilometer);

    const handleSendWhatsApp = () => {
        const cartItemsMessage = cart.map(item => {
            const itemPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
            return `- ${item.name} (x${item.quantity}): R$${(itemPrice * item.quantity).toFixed(2)}\n  Descrição: ${item.description}`;
        }).join('\n');

        const message = `Detalhes do pedido:\n\nNome: ${customerName}\nEndereço: ${streetAddress}\nObservação: ${note}\nMétodo de Pagamento: ${paymentMethod}\n\nSupermercado: ${supermarketName}\nEndereço do Supermercado: ${supermarketAddress}\n\nItens:\n${cartItemsMessage}\n\nTotal do carrinho: R$${cartTotal.toFixed(2)}\nEscolhendo Taxa: R$${pickingFee.toFixed(2)}\nEntrega Taxa: R$${deliveryFee.toFixed(2)}\nTotal Geral: R$${total}`;
        const phoneNumber = '5551989741442'; // Replace with the actual phone number
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'
                } transition-opacity duration-300`}
        >
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Finalizar Compra</h2>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Nome do Cliente</label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={onNameChange}
                        className="w-full p-2 border rounded"
                        placeholder="Digite seu nome"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Endereço</label>
                    <input
                        type="text"
                        value={selectedAddress}
                        onChange={handleAddressChange}
                        className="w-full p-2 border rounded"
                        placeholder="Digite seu endereço"
                    />
                    {autocompleteResults.length > 0 && !isAddressSelected && (  // Prevent fade-out if address is selected
                        <ul className="border rounded max-h-48 overflow-y-auto mt-2">
                            {autocompleteResults.map((address, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleAddressSelect(address)}
                                    className="p-2 cursor-pointer hover:bg-gray-200"
                                >
                                    {address}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Observações</label>
                    <textarea
                        value={note}
                        onChange={onNoteChange}
                        className="w-full p-2 border rounded"
                        placeholder="Adicione observações ao pedido"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Método de Pagamento</label>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => onPaymentMethodChange('Pix')}
                            className={`p-2 border rounded w-full text-white ${paymentMethod === 'Pix' ? 'bg-black' : 'bg-gray-600'
                                }`}
                        >
                            Pix
                        </button>
                        <button
                            onClick={() => onPaymentMethodChange('credit-card')}
                            className={`p-2 border rounded w-full text-white ${paymentMethod === 'credit-card' ? 'bg-black' : 'bg-gray-600'
                                }`}
                        >
                            Cartão de Crédito
                        </button>
                    </div>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-bold">Resumo do Pedido</h3>
                    <p className="mt-2">Total de Itens: {totalQuantity}</p>
                    <p>Peso Total: {totalWeight.toFixed(2)}</p>
                    <p>Taxa de Entrega: R$ {deliveryFee.toFixed(2)}</p>
                    <p>Taxa de Separação: R$ {pickingFee.toFixed(2)}</p>
                    <p className="font-bold text-lg mt-2">Total: R$ {total}</p>
                </div>
                <div className="mt-6 flex justify-between">
                    <button
                        onClick={onClose}
                        className="p-2 w-full border rounded mr-2 bg-gray-600 hover:bg-black text-white  "
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSendWhatsApp}
                        className="p-2 w-full border rounded bg-green-500 text-white hover:bg-green-600"
                    >
                        Enviar pelo WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
