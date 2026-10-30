import { useContext } from 'react';
import PortfolioContentContext from './PortfolioContentContext.js';

export default function usePortfolioContent() {
  return useContext(PortfolioContentContext);
}
