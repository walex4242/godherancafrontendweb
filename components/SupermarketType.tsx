import { Supermarket as ContextSupermarket } from '../context/SupermarketContext'

interface Supermarket extends ContextSupermarket {
    distance: number;
}