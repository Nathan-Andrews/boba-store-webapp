import React from 'react';
import { useNavigate } from 'react-router-dom';
import Background from './Background';


function ManagerHomePage() {
    const navigate = useNavigate();

    const pages = [
        "Inventory",
        "Menu Editing",
        "Reports"
    ];

    // For when one pf the "page" buttons gets clicked
    const onPageButtonClick = (item : string) : void => {
        const navigation : string = "/" + item
        navigate(navigation);
    }
    const closeButtonStyle: React.CSSProperties = {
        position: 'fixed',
        top: '10px', // Adjust the top position as needed
        right: '10px', // Adjust the right position as needed
        zIndex: 999, // Make sure it's above other elements
        fontSize: '25px',
        fontWeight: 'bolder',
    };
    const navigateBack = () => {
        navigate('/');
    };
    
    return (
    <><div style={closeButtonStyle}>
            <button className="close-button" onClick={navigateBack}>
                X
            </button>
        </div><div className="App">
                <header className="App-header" style={{ zIndex: 1 }}>
                    <h1 style={{ fontSize: "2rem", color: "white", fontWeight: "bold" }}>Welcome Managers!!</h1>
                    <div className='container' style={{ zIndex: 1 }}>
                        {/* For Buttons */}
                        {pages.map((item, index) => (
                            <button
                                className="btn btn-secondary btn-lg"
                                style={{ margin: "0.5rem 0.5rem" }}
                                key={index}
                                onClick={() => onPageButtonClick(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </header>
            </div></>
    );
}

export default ManagerHomePage;