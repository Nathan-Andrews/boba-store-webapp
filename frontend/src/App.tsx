import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';

import HomePage from './Pages/HomePage';
import Background from './Pages/Background';
import Server from './Pages/Server/Server';

import MenuItemPage from './Pages/MenuItemPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Styles/App.css';
import ManagerHomePage from './Pages/ManagerHomePage';

import MenuEditingPage from './Pages/MenuEditingPage';
import Reports from './Pages/Reports';

import Inventory from './Pages/Inventory';

import Customer from './Pages/Customer/Home'
import CustomerCheckout from './Pages/Customer/CustomerCheckout'

import Home from './Pages/Server/Home';
import Card from './Pages/Server/Card';
import Cash from './Pages/Server/Cash';
import Completed from './Pages/Server/Completed';

import { OrderProvider } from './Pages/Server/OrderContext';
import Administrator from './Pages/Admin';

import useGoogleTranslateScript from './useGoogleTranslate';

function LandingPage() : React.JSX.Element {
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('login') === 'failed') {
      // Display popup or set state to show an error message
      alert('Login failed: Your email must end with @tamu.edu');
      // Alternatively, use a more sophisticated approach like setting state 
      // and showing a modal or a toast notification instead of `alert`
    }
  }, [location]);


  return (
    <div className="App">
      <header className="App-header" style={{zIndex: 1}}>
        <img src="/logo.png" className="App-logo" alt="logo" style={{borderRadius: "50%", marginBottom: "2rem", zIndex: 1}} />
        <HomePage></HomePage>
      </header>
    </div>
  )
}

const withAuth = (WrappedComponent : React.FC) : React.FC => {
  return (prop : any) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
      fetch("/verify")
        .then((res) => res.json())
        .then((data) => {
          if (!data.valid){
            const currentPath = window.location.pathname;
            fetch(`/auth/google?redirect=${currentPath}`)
              .then((res) => res.json())
              .then((json) => window.location.href = json.url)
          }else{
            setIsAuthenticated(true);
          }
        })
        .catch(() => {
          const currentPath = window.location.pathname;
          fetch(`/auth/google?redirect=${currentPath}`)
            .then((res) => res.json())
            .then((json) => window.location.href = json.url)
        });
    }, [navigate]);


    return isAuthenticated ? <WrappedComponent {...prop} /> : (
      <div className="App">
        <header className="App-header" style={{zIndex: 1}}>

        </header>
      </div>
    );
  };
};

const AuthServer = withAuth(Home)
const AuthCard = withAuth(Card)
const AuthCash = withAuth(Cash)
const AuthCompleted = withAuth(Completed)
const AuthManager = withAuth(ManagerHomePage)
const AuthAdmin = withAuth(Administrator)

function App() : React.JSX.Element {
  useGoogleTranslateScript();
  
  localStorage.removeItem("order")
  
  return (
    <Router>
      <div>
        <div id='google_translate_element'> </div>
        <Background></Background>
        <Routes>
          <Route path="/" element={<LandingPage/>} />
          <Route path="/Administrator" element={<AuthAdmin/>} />
          <Route path="/Managers" element={<AuthManager/>}/>
          <Route path="/Cashiers" element={<OrderProvider><AuthServer/></OrderProvider>} />
          <Route path="/CashiersCash" element={<OrderProvider><AuthCash/></OrderProvider>} />
          <Route path="/CashiersCard" element={<OrderProvider><AuthCard/></OrderProvider>} />
          <Route path="/CashiersComplete" element={<OrderProvider><AuthCompleted/></OrderProvider>} />
          <Route path="/Customers" element={<Customer/>}/>
          <Route path="/CustomerCheckout" element={<CustomerCheckout/>}/>
          <Route path="/Menu Items" element={<MenuItemPage/>} />
          <Route path="/Inventory" element={<Inventory/>}/>
          <Route path="/Reports" element={<Reports/>}/>
          <Route path="/Menu Editing" element={<MenuEditingPage/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;