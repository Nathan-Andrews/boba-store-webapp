import React, { createContext, useContext, useState } from 'react';

import info from "./Info"
const {buttons, items, sinkers, toppings} = info

// OrderComponent is information for a single order item, and create/copy order component are functions to create OrderComponent(s).

type MenuItem = {
  id: number;
  name: string;
  category: string; 
  price: number;
  is_visible: boolean;
  region: number;
  // Add other properties as needed
};

const copyOrderComponent = (orderComponent : OrderComponent) => {
    return {
        // name : orderComponent.name,
        // cost : orderComponent.cost,
        item : orderComponent.item,
        size : orderComponent.size,
        toppings: [...orderComponent.toppings],
        sinkers: [...orderComponent.sinkers]
    }
}

interface OrderContextProps {
    cost: number;
    setCost: (newCost: number) => void;
    orderArray: OrderComponent[];
    addToOrder: (item: OrderComponent) => void;
    removeFromOrder: (index: number) => void;
    copyToOrder: (index: number) => void;
    setOrderArray: React.Dispatch<React.SetStateAction<OrderComponent[]>>;
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children })  => {
    const initialCost = 0.0;
    const hardCost = 5.3

    const [cost, setCost] = useState(initialCost);
    const [orderArray, setOrderArray] = useState<Array<OrderComponent>>([]);
  
    const addToOrder = (item : OrderComponent) : void => {
      setCost(prevCost => prevCost + item.item.price);
      setOrderArray(prevOrderArray => [...prevOrderArray, item]);
    };
  
    const removeFromOrder = (index : number) => {
      setCost(prevCost => prevCost - orderArray[index].item.price);
      setOrderArray(prevOrderArray => prevOrderArray.filter((_, i) => i !== index));
    };
  
    const copyToOrder = (index : number) => {
      const newArray = orderArray.slice();
      
      newArray.splice(index + 1, 0, copyOrderComponent(newArray[index]));
      
      setCost(cost + orderArray[index].item.price);
      setOrderArray(newArray);
    }

  return (
    <OrderContext.Provider value={{ cost, setCost, orderArray, addToOrder, removeFromOrder, copyToOrder, setOrderArray }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (initialCost : number, hardCost : number) => {  
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const createOrderComponent = (item : MenuItem) : OrderComponent => {
    return {
    item: item,
    size: 'medium',
    toppings: toppings.map(() => ''),
    sinkers: sinkers.map(() => ''),
    };
};

export interface OrderComponent{
    // name : string
    // cost : number
    item: MenuItem
    size : string
    toppings : string[]
    sinkers : string[]
  };