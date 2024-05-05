import React, {useState, ChangeEvent, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';

import { useOrder } from './OrderContext'

function Card() {
    const navigate = useNavigate();
    const { cost, orderArray } = useOrder(0.0, 5.3);

    const [activeButton, setActiveButton] = useState(-1);

    const tipOptions = [30,50,90,'custom'];

    const [tip, setTip] = useState({
        valid: false,
        customAmount: -1,
        amount: 0
    });

    const selectTip = (index: number) => {
        setActiveButton(index);

        if (index >= 0 && index != 3) {
            setTip({valid: true, customAmount: tip.customAmount, amount: (cost * Number(tipOptions.at(activeButton)) * 0.01)});
        }
        if (index === 3) {
            setTip({valid: tip.customAmount >= 0, customAmount: tip.customAmount, amount: tip.customAmount});
        }
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        // if input is empty, set to -1.  Use value otherwise
        handleTipInput(!value ? -1 : Number(value));
    };

    const handleTipInput = (input: number) => {                    
        if (activeButton >= 0 && activeButton != 3) {
            setTip({valid: true, customAmount: input, amount: tip.amount});
        }
        if (activeButton === 3) {
            setTip({valid: input >= 0, customAmount: input, amount: input});
        }
    }

    // go back to main page if context information is lost
    // happens on page refresh
    useEffect (() => {
        if (orderArray.length === 0) navigate('/Cashiers');
    },[]);

    return (
        <div style={{zIndex:2}}>
            <header className='server-header'>
                <div className='container-fluid'>
                    <div className='row'>
                        <div className='col-12 text-center' style={{zIndex:2}}>
                            <h1 className='server-text'>Enter Tip Amount</h1>
                        </div>
                    </div>
                    <div className='row' style={{zIndex:2, marginTop:'2rem', marginBottom:'2rem', marginLeft:'10rem', marginRight:'10rem'}}>
                        {tipOptions.map((value,index) => (
                            <div key={index} className='col d-flex flex-column justify-content-between text-center' style={{zIndex:2}}>
                                <button
                                className={`btn btn-primary ${index === activeButton ? 'active' : ''}`}
                                style={index === activeButton ? {height: "8rem", outline: "5px solid #0a58ca", outlineOffset:'-1px'} : {height: "8rem"} }
                                onClick={() => selectTip(index)}>
                                    <h1>{value}{index === 3 ? '' : '%'}</h1>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className='row' style={{zIndex:2, marginLeft:'16rem', marginRight:'16rem'}}>
                        <div className='col-3' style={{zIndex:2}}>
                            <h1 className='server-text'>Custom:</h1>
                        </div>
                        <div className='col' style={{zIndex:2}}>
                            <input
                            className="form-control form-control-lg"
                            type="number"
                            placeholder="enter tip amount"
                            id="inputBox"
                            onChange={handleInputChange}/>
                        </div>
                    </div>
                    <div className='row fixed-bottom align-items-end' style={{margin:'1rem', marginBottom:'1.5rem'}}>
                        <div className='col-md-10'></div>
                        <div className='col' style={{marginTop:'.5rem'}}>
                            <div className="d-grid" style={{zIndex: 2}}>
                                <button style={{zIndex: 2, paddingLeft:'.5rem', paddingRight:'.5rem'}}
                                    className='btn btn-primary'
                                    disabled={!tip.valid}
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

export default Card;