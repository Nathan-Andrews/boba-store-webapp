import React, {useState, ReactNode, CSSProperties, FC, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web'

import scan_img from '../../src_public/scan_icon.png'
import { useNavigate } from 'react-router-dom';

interface CreditCardIssues{
    accountNumber : boolean,
    month : boolean,
    year : boolean,
    securityCode : boolean,
}

interface CreditCard{
    accountNumber : string,
    month : string,
    year : string,
    securityCode : string,
}

type MenuItem = {
    id: number;
    name: string;
    category: string; 
    price: number;
    is_visible: boolean;
    region: number;
};
interface OrderComponent{
    item: MenuItem
    size : string
    toppings : string[]
    sinkers : string[]
  };

type CreditCardProperty = 'accountNumber' | 'month' | 'year' | 'securityCode';

const isValidCardNumber = (number: string): boolean => {
    if (number.length === 0)
        return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i));

        if (shouldDouble) {
            digit *= 2;

            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}
type Tuple<A, B> = [A, B];
const getInitialCreditCardState = (save: boolean): CreditCard => {
    try {
        const storedData = localStorage.getItem("CreditCard");
        if (storedData !== null && save) {
            return JSON.parse(storedData);
        }
    } catch (error) {} // privacy or stuff

    return { accountNumber: '', securityCode: '', month: '', year: '' };
};

const getInitialSaveState = () => {
    try {
        const storedData = localStorage.getItem("save-cc");
        if (storedData !== null) {
            return storedData === "1";
        }
    } catch (error) {} // privacy or stuff

    return true;
};

function CustomerCheckout() {
    const navigate = useNavigate()

    const [orderNum, setOrderNum] = useState<number>(-1);
    const [save, setSave] = useState<boolean>(getInitialSaveState())
    const [creditCardState, setCreditCard] = useState<CreditCard>(getInitialCreditCardState(save))
    const [showModal, setModalShow] = useState<boolean>(false);
    const [creditCardIssues, setCreditCardIssues] = useState<CreditCardIssues>({
        accountNumber: false,
        month: false,
        year: false,
        securityCode: false
    })

    const [springs, api] = useSpring(() => ({
        from: { y: -500 },
    }))

    const issuesExist = (creditCardIssues.accountNumber || creditCardIssues.month || creditCardIssues.securityCode || creditCardIssues.year)
    
    const setCreditCardWrapper = (property : CreditCardProperty, value : string) => {
        setCreditCard((creditCard: CreditCard) => {
            return {
                ...creditCard,
                [property]: value
            };
        });
    }
    const handleSecurityCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => setCreditCardWrapper("securityCode", e.target.value)
    const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => setCreditCardWrapper("accountNumber", e.target.value)
    const handleValidMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => setCreditCardWrapper("month", e.target.value)
    const handleValidYearChange = (e: React.ChangeEvent<HTMLInputElement>) => setCreditCardWrapper("year", e.target.value)

    const onBackclick = () => {
        navigate("/Customers");
    }

    const onOrderSubmit = (): void => {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const isYearValid : boolean = year < (2000 + parseInt(creditCardState.year))

        const newCreditCardIssues : CreditCardIssues = {
            accountNumber: !isValidCardNumber(creditCardState.accountNumber.replaceAll("-", "").replaceAll(" ", "")),
            year: !isYearValid,
            month: !isYearValid || (year === parseInt(creditCardState.year) && month < parseInt(creditCardState.month)) || creditCardState.month.length !== 2,
            securityCode: creditCardState.securityCode.length !== 3,
        }

        if (save){
            localStorage.setItem("CreditCard", JSON.stringify(creditCardState))
        }

        setCreditCardIssues(newCreditCardIssues)

        api.start({
            from: {
                y: -500,
            },
            to: {
                y: 0,
            },
            config: {
                frequency: 2/5,
                damping: 8/10,
            },
        })

        var orderArray : OrderComponent[] = JSON.parse(localStorage.getItem("order") as string)
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
        })
            .then(res => res.json())
            .then(json => {
                const orderNum = json.success as number
                setOrderNum(orderNum)
            })      
        localStorage.removeItem("order")

        setModalShow(true)
    };

    const onModalClose = () => {
        if (issuesExist){
            setModalShow(false)
        }else{
            localStorage.removeItem("order")

            setModalShow(false)
            navigate("/")
        }
    }

    const toggleSaveInfo = () => {
        setSave((oldSave : boolean) => !oldSave)
    }

    useEffect(() => {
        localStorage.setItem("save-cc", save ? "1" : "0")
    }, [save])

    return (
        <>
            {showModal && (
                <>
                    <div className="backdrop" onClick={() => setModalShow(false)}></div>
                    <animated.div className="modal fade show dark-modal" style={{ display: 'block', transform: springs.y.to(y => `translateY(${y}px)`) }} tabIndex={-1}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" style={issuesExist ? {color: 'red'} : {color: 'green'}}>{issuesExist ? "Incorrect Information!" : "Successful!"}</h5>
                                    <button type="button" className="btn-close" onClick={onModalClose}>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {issuesExist ? 
                                        (
                                            <p>
                                                Issue validating your card.
                                                {creditCardIssues.accountNumber ? " There is an issue in Account Number." : ""}
                                                {creditCardIssues.securityCode ? " There is an issue in Security Code." : ""}
                                                {creditCardIssues.month ? " There is an issue in expiration month." : ""}
                                                {creditCardIssues.year ? " There is an issue in expiration year." : ""}
                                            </p>
                                        ) :
                                        (
                                            <p>
                                                Your order number is #{orderNum === -1 ? "LOADING" : orderNum}
                                            </p>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    </animated.div>
                </>
            )}

            <div className='customer-checkout-total-background'/>
            <div className='customer-checkout-background'>
                <button onClick={onOrderSubmit} style={{zIndex: 10}} className='customer-checkout-submit btn btn-primary'>Process Order</button>
                <button onClick={onBackclick} className='customer-checkout-back btn btn-outline-primary'>Back to Order</button>

                <h1 className='customer-checkout-title'>Credit Card Information</h1>
                
                <p className='cc-callus'>Call us if you have any questions about your order 210-388-9045! </p>
                <div className='cc-bar'/>

                <div className='cc-sc' style={creditCardIssues.securityCode ? {border: 'solid red'} : {}}>
                    <input value={creditCardState.securityCode} className='sc-input' style={creditCardIssues.securityCode ? {border: 'solid red'} : {}} onChange={handleSecurityCodeChange}></input>
                    <p className='sc-input-desc' style={creditCardIssues.securityCode ? {border: 'solid red'} : {}}>SECURITY CODE</p>
                </div>

                <img className='cc-scan-img' src={scan_img}/>

                <input style={creditCardIssues.accountNumber ? {border: 'solid red'} : {}} value={creditCardState.accountNumber} placeholder='ACCOUNT NUMBER' className='ccn-input' onChange={handleAccountNumberChange}></input>

                <p className='vt-input-desc'>VALID THROUGH:</p>
                <input style={creditCardIssues.month ? {border: 'solid red'} : {}} value={creditCardState.month} className='vt-input-m' onChange={handleValidMonthChange}></input>
                <label className='vt-input-div'>/</label>
                <input style={creditCardIssues.year ? {border: 'solid red'} : {}} value={creditCardState.year} className='vt-input-y' onChange={handleValidYearChange}></input>
            </div>

            <button className='customer-checkout-save-info-toggle' onClick={toggleSaveInfo}>{save ? "X" : ""}</button>
            <label className='customer-checkout-save-info-toggle-label'>Save Info</label>
        </>
    );
}

export default CustomerCheckout;