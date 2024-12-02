import React, { useRef } from 'react';
import Image from 'next/legacy/image';
import CategoryButton from '../../components/CategoryButton';
import ItemCard from '../../components/ItemCard';
import ItemModal from '../../components/ItemModal';
import CheckoutModal from './CheckoutModal';
import CartItem from '../../components/CartItem';
import { Category, Item } from '@/context/SupermarketContext';

interface SupermarketPageProps {
    name: string;
    image: string;
    address: string;
    categories: Category[];
    items: Item[];
}

const SupermarketPage: React.FC<SupermarketPageProps> = ({
    name = 'Supermarket Name',
    image = '/default-image.jpg',
    address = 'Supermarket Address',
    categories,
    items
}) => {
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState<string>('');
    const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);
    const [isItemModalOpen, setIsItemModalOpen] = React.useState<boolean>(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = React.useState<boolean>(false);
    const [cart, setCart] = React.useState<Item[]>([]);
    const [customerName, setCustomerName] = React.useState<string>('');
    const [streetAddress, setStreetAddress] = React.useState<string>('');
    const [note, setNote] = React.useState<string>('');
    const [paymentMethod, setPaymentMethod] = React.useState<'Pix' | 'credit-card' | null>(null);

    const categoriesContainerRef = useRef<HTMLDivElement>(null);
   

    const filterItemsByCategoryAndSearch = () => {
        let filteredItems = items;

        if (selectedCategory && selectedCategory !== 'all') {
            filteredItems = filteredItems.filter(item => item.category === selectedCategory);
        }
        if (searchQuery) {
            filteredItems = filteredItems.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filteredItems;
    };

    const handleOpenItemModal = (item: Item) => {
        setSelectedItem(item);
        setIsItemModalOpen(true);
    };

    const handleCloseItemModal = () => {
        setSelectedItem(null);
        setIsItemModalOpen(false);
    };

    const addToCart = (item: Item) => {
        setCart(prevCart => {
            const itemIndex = prevCart.findIndex(cartItem => cartItem._id === item._id);
            if (itemIndex >= 0) {
                const updatedCart = [...prevCart];
                updatedCart[itemIndex].quantity += 1;
                return updatedCart;
            } else {
                return [...prevCart, { ...item, quantity: 1 }];
            }
        });
    };

    const handleQuantityChange = (id: string, quantity: number) => {
        setCart(prevCart => {
            if (quantity <= 0) {
                return prevCart.filter(item => item._id !== id);
            }
            const updatedCart = prevCart.map(item =>
                item._id === id ? { ...item, quantity } : item
            );
            return updatedCart;
        });
    };

    const handleRemoveItem = (id: string) => {
        setCart(prevCart => prevCart.filter(item => item._id !== id));
    };

    const handlePaymentMethodChange = (method: 'Pix' | 'credit-card' | null) => {
        setPaymentMethod(method);
    };

    const handleSubcategoryClick = (subcategoryId: string) => {
        setSelectedCategory(subcategoryId);
    };

    const handleAllButtonClick = () => {
        setSelectedCategory('all');
    };

    const handleBackButtonClick = () => {
        window.history.back(); // Go back to the previous page in browser history
    };

    return (
         
        <div className='relative flex flex-col lg:flex-row bg-white'>
            <button
                onClick={handleBackButtonClick}
                className='absolute top-4 left-4 p-2 mb-5 bg-gray-500 text-white rounded-lg hover:bg-black transition duration-200 z-10 '
            >
                &#8592; Back to Supermarket
            </button>

            <div className='w-full lg:w-3/4 p-4 mt-12 '>
                <div className='relative w-full h-60 mb-4'>
                    <Image
                        src={image}
                        alt="Supermarket"
                        layout="fill"
                        objectFit='cover'
                        priority={true}
                        className='rounded-3xl'
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <h2 className='text-2xl font-bold mt-4 mb-2'>{name}</h2>
                <p className='text-lg text-gray-600 mb-4'>{address}</p>

                <h2 className='text-2xl font-bold mb-4'>Categories</h2>
                <div className="relative">

                    {/* Categories Container */}
                    <div
                        ref={categoriesContainerRef}
                        className="flex overflow-x-auto scroll-snap-x whitespace-nowrap mb-4 px-12 gap-4 scrollbar-hide snap-mandatory"
                    >
                        {/* "All Items" Button */}
                        <button
                            onClick={handleAllButtonClick}
                            className={`flex flex-col items-center p-2 mb-4 mx-2 rounded-lg bg-gray-50 hover:bg-gray-200  transition duration-200 ease-in-out ${selectedCategory === 'all' ? 'bg-gray-200' : ''}`}
                        >
                            <div className="relative top-2 w-14 h-14 mb-4">
                                <Image src="/all.svg" alt="All" width={40} height={40} />
                            </div>
                            TODOS
                        </button>

                        {/* Categories */}
                        {categories
                            .filter(category => !category.parentCategory)
                            .map(category => (
                                <CategoryButton
                                    key={category._id}
                                    category={category}
                                    onClick={() => setSelectedCategory(category._id)}
                                    onSubcategoryClick={handleSubcategoryClick}
                                    isSelected={selectedCategory === category._id}
                                />
                            ))}
                    </div>
                </div>


                <div className='mb-4'>
                    <input
                        type='text'
                        placeholder='Search items...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='w-full p-2 border rounded text-black'
                    />
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
                    {filterItemsByCategoryAndSearch().map(item => (
                        <ItemCard
                            key={item._id}
                            item={item}
                            onClick={() => handleOpenItemModal(item)}
                            onAddToCart={() => addToCart(item)}
                        />
                    ))}
                </div>

                {isItemModalOpen && selectedItem && (
                    <ItemModal
                        item={selectedItem}
                        isOpen={isItemModalOpen}
                        onClose={handleCloseItemModal}
                        onAddToCart={() => addToCart(selectedItem)}
                    />
                )}
            </div>
            <div className='w-full lg:w-1/4 bg-gray-100 p-4'>
                <h2 className='text-xl font-bold mb-2'>Carrinho</h2>
                <ul className='space-y-4'>
                    {cart.map(item => (
                        <CartItem
                            key={item._id}
                            item={item}
                            onQuantityChange={handleQuantityChange}
                            onRemove={handleRemoveItem}
                        />
                    ))}
                </ul>
                <button
                    onClick={() => cart.length > 0 && setIsCheckoutModalOpen(true)}
                    className={`w-full p-2 mt-4 text-white ${cart.length > 0 ? 'bg-gray-600 hover:bg-black' : 'bg-gray-300 cursor-not-allowed'}`}
                    disabled={cart.length === 0}
                >
                    Finalizar Compra
                </button>
            </div>

            {isCheckoutModalOpen && (
                <CheckoutModal
                    isOpen={isCheckoutModalOpen}
                    onClose={() => setIsCheckoutModalOpen(false)}
                    cart={cart}
                    customerName={customerName}
                    streetAddress={streetAddress}
                    note={note}
                    paymentMethod={paymentMethod}
                    onNameChange={(e) => setCustomerName(e.target.value)}
                    onAddressChange={(e) => setStreetAddress(e.target.value)}
                    onNoteChange={(e) => setNote(e.target.value)}
                    onPaymentMethodChange={handlePaymentMethodChange}
                    supermarketAddress={address}
                    supermarketName={name}
                />
            )}
        </div>
    );
};

export default SupermarketPage;