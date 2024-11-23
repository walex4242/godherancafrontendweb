import React, { useCallback, useState, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Item } from '../../context/SupermarketContext';
import useGoogleMapsLoader from '../../hook/GoogleMap'; // Adjust the path as needed

type CartItem = Item & { quantity: number };

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

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''; // Replace with your actual Google Maps API key

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
    const isLoaded = useGoogleMapsLoader(apiKey);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [distance, setDistance] = useState<number | null>(null);

    const onLoad = useCallback((autoC: google.maps.places.Autocomplete) => {
        setAutocomplete(autoC);
    }, []);

    const handleAddressChange = (address: string) => {
        const event = {
            target: { value: address }
        } as React.ChangeEvent<HTMLInputElement>;
        onAddressChange(event);
    };

    const onPlaceChanged = useCallback(() => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
                handleAddressChange(place.formatted_address);
                calculateDistance(place.formatted_address);
            }
        }
    }, [autocomplete]);

    const calculateDistance = (address: string) => {
        if (!supermarketAddress || !address) return;

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                origins: [supermarketAddress],
                destinations: [address],
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
                if (status === 'OK' && response?.rows[0]?.elements[0]?.distance) {
                    const distanceInMeters = response.rows[0].elements[0].distance.value;
                    const distanceInKilometers = distanceInMeters / 1000;
                    setDistance(distanceInKilometers);
                } else {
                    console.error('Error calculating distance:', status);
                    setDistance(null);
                }
            }
        );
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

    const deliveryFee = distance ? distance * deliveryRatePerKilometer : 0;
    const total = (cartTotal + pickingFee + deliveryFee).toFixed(2);

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

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    if (!isLoaded) {
        return <div>Loading Google Maps...</div>;
    }

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
                    {isLoaded ? (
                        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                            <input
                                type="text"
                                value={streetAddress}
                                onChange={onAddressChange}
                                className="w-full p-2 border rounded"
                                placeholder="Digite seu endereço"
                            />
                        </Autocomplete>
                    ) : (
                        <input
                            type="text"
                            value={streetAddress}
                            onChange={onAddressChange}
                            className="w-full p-2 border rounded"
                            placeholder="Digite seu endereço"
                        />
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
                            className={`p-2 border rounded w-full ${paymentMethod === 'Pix' ? 'bg-gray-300' : 'bg-white'
                                }`}
                        >
                            Pix
                        </button>
                        <button
                            onClick={() => onPaymentMethodChange('credit-card')}
                            className={`p-2 border rounded w-full ${paymentMethod === 'credit-card' ? 'bg-gray-300' : 'bg-white'
                                }`}
                        >
                            Cartão de Crédito
                        </button>
                    </div>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-bold">Resumo do Pedido</h3>
                    <p className="mt-2">Total de Itens: {totalQuantity}</p>
                    <p>Peso Total: {totalWeight.toFixed(2)} kg</p>
                    <p>Taxa de Entrega: R$ {deliveryFee.toFixed(2)}</p>
                    <p>Taxa de Separação: R$ {pickingFee.toFixed(2)}</p>
                    <p className="font-bold text-lg mt-2">Total: R$ {total}</p>
                </div>
                <div className="mt-6 flex justify-between">
                    <button
                        onClick={onClose}
                        className="p-2 w-full border rounded mr-2 bg-gray-300 hover:bg-gray-400"
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
