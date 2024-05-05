import React, {useState, ChangeEvent, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';

import { useOrder } from './OrderContext'

function Cash() {
    const navigate = useNavigate();
    const { cost, orderArray} = useOrder(0.0, 5.3);

    const [cashAmount, setCashAmount] = useState({
        cash: 0,
        tip: 0
    });

    const taxCost = cost * 0.08;
    const amountOwed = (cashAmount.cash - cashAmount.tip - (cost + taxCost));

    const handleCashChange = (event: ChangeEvent<HTMLInputElement>) => {
        // if input is empty, set to 0.  Use value otherwise
        const value = event.target.value ? event.target.value : 0;

        setCashAmount({cash:Number(value), tip:cashAmount.tip });
    };

    const handleTipChange = (event: ChangeEvent<HTMLInputElement>) => {
        // if input is empty, set to 0.  Use value otherwise
        const value = event.target.value ? event.target.value : 0;

        setCashAmount({cash:cashAmount.cash, tip:Number(value) });
    };

    // go back to main page if context information is lost
    // happens on page refresh
    useEffect (() => {
        if (orderArray.length === 0) navigate('/Cashiers');
    },[]);

    return (
        <div style={{zIndex:2}}>
            <header className='server-header'>
                <div className='container-fluid'>
                    <div className='row' style={{marginTop:'1rem', marginBottom:'3rem'}}>
                        <div className='col-12 text-center' style={{zIndex:2}}>
                            <h1 className='server-text'>Cash Payment</h1>
                        </div>
                    </div>
                    <div className='row' style={{zIndex:2, marginTop:'1rem', marginBottom:'1rem', marginLeft:'16rem', marginRight:'16rem'}}>
                        <div className='col-5' style={{zIndex:2}}>
                            <h1 className='server-text'>Cash Amount:</h1>
                        </div>
                        <div className='col' style={{zIndex:2}}>
                            <input
                            className="form-control form-control-lg"
                            type="number"
                            placeholder="enter cash amount"
                            id="cashBox"
                            // value={`$${String(cashAmount.cash)}`}
                            onChange={handleCashChange}/>
                        </div>
                    </div>
                    <div className='row' style={{zIndex:2, marginTop:'1rem', marginBottom:'1rem', marginLeft:'16rem', marginRight:'16rem'}}>
                        <div className='col-5' style={{zIndex:2}}>
                            <h1 className='server-text'>Tip Amount:</h1>
                        </div>
                        <div className='col' style={{zIndex:2}}>
                            <input
                            className="form-control form-control-lg"
                            type="number"
                            placeholder="enter tip amount"
                            id="tipBox"
                            onChange={handleTipChange}/>
                        </div>
                    </div>
                    <div className='row' style={{zIndex:2, marginTop:'5rem', marginLeft:'18rem', marginRight:'18rem'}}>
                        <div className='col text-center' style={{zIndex: 2}}>
                            <h3 className='server-text'>cost: ${cost.toFixed(2)} + tax: {taxCost.toFixed(2)}</h3>
                            <h3 className='server-text'>total: ${(cost + taxCost).toFixed(2)}</h3>
                        </div>
                    </div>
                    <div className='row fixed-bottom align-items-end' style={{margin:'1rem', marginBottom:'1.5rem'}}>
                        <div className='col-4' style={{marginTop:'.5rem', zIndex: 2}}>
                            {/* <h3 className='server-text'>+ cost: ${cost.toFixed(2)}</h3>
                            <h3 className='server-text'>+ tax: ${taxCost.toFixed(2)}</h3>
                            <h3 className='server-text'>total: ${(cost + taxCost).toFixed(2)}</h3> */}
                            <h3
                            className='server-text'
                            style={amountOwed >= 0 ? {} : {color:'#dc3545'}}>{amountOwed >= 0 ? "Change Owed: $" + amountOwed.toFixed(2) :"Amount Need: $" + (-1 * amountOwed).toFixed(2)}</h3>
                        </div>
                        <div className='col-md-6'></div>
                        <div className='col' style={{marginTop:'.5rem'}}>
                            <div className="d-grid" style={{zIndex: 2}}>
                                <button style={{zIndex: 2, paddingLeft:'.5rem', paddingRight:'.5rem'}}
                                    className='btn btn-primary'
                                    disabled={amountOwed < 0}
                                    onClick={() => navigate('/CashiersComplete')}>done</button>
                            </div>
                        </div>
                        <div className='col' style={{marginTop:'.5rem'}}>
                            <div className="d-grid" style={{zIndex: 2}}>
                                <button style={{zIndex: 2, paddingLeft:'.5rem', paddingRight:'.5rem'}}
                                className='btn btn-secondary'
                                onClick={() => navigate('/Cashiers')}>back</button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    )
}

export default Cash;