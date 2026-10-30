import { createContext } from 'react';
import defaultPortfolioContent from '../data/defaultPortfolioContent.js';

const PortfolioContentContext = createContext(defaultPortfolioContent);

export default PortfolioContentContext;
