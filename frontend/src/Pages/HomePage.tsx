import React, { FormEvent, useState } from 'react';
import { useSpring, animated } from '@react-spring/web'
import { useNavigate } from 'react-router-dom';

function HomePage(){
    const navigate = useNavigate()
    const [springs, api] = useSpring(() => ({
        from: { y: -500 },
    }))

    const [error, setError] = useState(false)
    const [modalInfo, setModalInfo] = useState({ 
        showModal: false, 
        selectedPage: '' 
    });

    const pages = [
        "Administrator",
        "Managers",
        "Cashiers",
        "Customers",
        "Menu Items",
    ];

    // For when one pf the "page" buttons gets clicked
    const onPageButtonClick = (item : string) : void => {
        const needsLogin : boolean = false;
        if (!needsLogin){
            const navigation : string = "/" + item
          
            navigate(navigation);
          
            return;
        }

        // Prompt login, if needed
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

        setModalInfo({
            showModal: true, 
            selectedPage: item
        });
    }

    // If a password modal shows up, this is for when the form in the modal is submitted via button or enter
    const onPasswordSubmit = (event : FormEvent<HTMLFormElement>): void => {
        event.preventDefault()

        const form = event.target as HTMLFormElement;
        const userInputElement = form.elements.namedItem('password') as HTMLInputElement;
        const userInputValue : string = userInputElement.value;
        userInputElement.value = "" // Reset password field when submitted

        const isValid : boolean = userInputValue !== "error-check"
        if (isValid){
            const navigation : string = "/" + modalInfo.selectedPage
            navigate(navigation)
        }else{
            setError(true)
        }
    }

    return (
        <div className="container" style={{zIndex: 1}}>
        
            {/* For buttons */}
            {pages.map((item, index) => (
                <button 
                    className="btn btn-secondary btn-lg" 
                    style={{margin: "0.5rem 0.5rem"}} 
                    key={index}
                    onClick={() => onPageButtonClick(item)}
                >
                    {item}
                </button>
            ))}

            {/* For when login is prompted */}
            {modalInfo.showModal && (
                <>
                    <div className="backdrop" onClick={() => setModalInfo({ showModal: false, selectedPage: '' })}></div>
                    <animated.div className="modal fade show dark-modal" style={{ display: 'block', transform: springs.y.to(y => `translateY(${y}px)`) }} tabIndex={-1}>
                        {/* For when incorrect login happens */}
                        { error && (
                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                {modalInfo.selectedPage} login is incorrect!
                                <button type="button" className="btn-close" data-dismiss="alert" aria-label="Close" onClick={() => setError(false)}/>
                            </div>
                        )}

                        {/* Login UI */}
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{modalInfo.selectedPage} Login</h5>
                                    <button type="button" className="btn-close" onClick={
                                        () => {setError(false); setModalInfo({ showModal: false, selectedPage: '' })}}>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <form style={{textAlign: "left"}} onSubmit={onPasswordSubmit}> 
                                        <label htmlFor="password" style={{paddingRight: "0.5rem"}}>Password: </label>
                                        <input type="password" id="password" name="password"/>

                                        {/* Clicking submit button will activite the form onSubmit event, because of type */}
                                        <div className="modal-footer">
                                            <button type="submit" className="btn btn-primary">Login</button>
                                            <button type="button" className="btn btn-secondary" onClick={
                                                () => {setError(false); setModalInfo({ showModal: false, selectedPage: '' })}}>
                                                Close
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </animated.div>
                </>
            )}
        </div>
    );
}

export default HomePage;