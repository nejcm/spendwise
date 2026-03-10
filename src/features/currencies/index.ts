export type Currency = {
  name: string;
  value: string;
  symbol: string;
  image: string;
};

export const CURRENCIES = [
  { name: 'Euro', label: 'Euro', value: 'EUR', symbol: '€', image: require('../../../assets/flags/eu.svg') },
  { name: 'US Dollar', label: 'US Dollar', value: 'USD', symbol: '$', image: require('../../../assets/flags/us.svg') },
  { name: 'British Pound', label: 'British Pound', value: 'GBP', symbol: '£', image: require('../../../assets/flags/gb.svg') },
  { name: 'Swiss Franc', label: 'Swiss Franc', value: 'CHF', symbol: 'CHF', image: require('../../../assets/flags/ch.svg') },
];
