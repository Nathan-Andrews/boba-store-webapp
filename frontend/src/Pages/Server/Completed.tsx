import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useOrder } from './OrderContext'

import axios from 'axios';


type Tuple<A, B> = [A, B];

function Completed() {
    const navigate = useNavigate();

    const { cost, setCost, orderArray, setOrderArray} = useOrder(0.0,5.3);

    const doneButton = () => {

        navigate('/Cashiers');
    }

    const [orderNumber, setOrderNumber] = useState(-1);

    // go back to main page if context information is lost
    // happens on page refresh
    useEffect (() => {
        if (orderArray.length === 0) navigate('/Cashiers');
        else {
            // adding order
            var items : Tuple<number,number>[] = [];

            for (var i = 0; i < orderArray.length; i++) {
                const item : Tuple<number,number> = [orderArray[i].item.id,1];
                items.push(item);
            }
            
            fetch("/api/addOrder", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({items}),
              }).then(response => {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                return response.json();
              })
              .then(data => {
                setOrderNumber(data.order_key);
              })
              

            setCost(0);
            setOrderArray([]);
        }
    },[]);

    return (
        <div style={{zIndex:2}}>
            <header className='server-header'>
                <div className='container-fluid'>
                    <div className='row' style={{marginTop:'2rem', marginBottom:'5rem'}}>
                        <div className='col text-center' style={{zIndex: 2}}>
                            <h1 className='server-text' style={{fontSize:'70px'}}>Completed</h1>
                            <h1 className='server-text' style={{fontSize:'70px'}}>Order # {orderNumber >= 0 ? orderNumber : ''}</h1>
                        </div>
                    </div>
                    <div className='row' >
                        <div className='col text-center' style={{zIndex: 2}}>
                            <button
                            className='btn btn-lg btn-secondary'
                            style={{paddingLeft:'2.5rem', paddingRight:'2.5rem'}}
                            onClick={doneButton}><h2>done</h2></button>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
}

export default Completed;