import React, {useState, ReactNode, CSSProperties, FC } from 'react';
import { BrowserRouter as Router, Route, Routes, useRoutes } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import '../../Styles/Server.css';

import Home from './Home';
import Card from './Card';
import Cash from './Cash';
import Completed from './Completed';

import { OrderProvider } from './OrderContext';

function Server() {
  let routes = useRoutes([
    { path: '/', element: <Home /> },
    { path: 'Cash', element: <Cash /> },
    { path: 'Card', element: <Card /> },
    { path: 'Complete', element: <Completed /> }
  ]);

  return (
    <OrderProvider>
      {routes}
    </OrderProvider>
  );
}

export default Server;