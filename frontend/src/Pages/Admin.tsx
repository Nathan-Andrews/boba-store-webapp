import React, { FormEvent, useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web'
import { useNavigate } from 'react-router-dom';

interface User {
    email: string;
    permission: number;
}

const stringPermissions = [
    "zippo doodah",
    "Owner Permission",
    "Manager Permission",
    "Cashier Permission",
    "Administrator Permission",
]

function viewUsers(): Promise<User[]> {
    return fetch('/viewUsers')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Ensure that the data conforms to the User array type
                return data.data as User[];
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            throw error; // Re-throw to allow caller to handle the error
        });
}

function Administrator() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [modalInfo, setModalInfo] = useState({
        show: false,
        email: '',
        permission: '',
        type: '',
    });
    const [springs, api] = useSpring(() => ({
        from: { y: -500 },
    }))

    useEffect(() => {
        viewUsers().then(data => setUsers(data))
    }, []);

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

    const handleEdit = (email: string, permission: number) => {
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

        setModalInfo({type: 'Edit', show: true, email: email, permission: permission.toString()})
    };

    const handleDelete = (email: string, permission: number) => {
        setUsers(users.filter(user => user.email !== email));

        fetch('/removeUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
    };

    const handleModalSubmit = (event : FormEvent<HTMLFormElement>): void => {
        if (modalInfo.type === 'Add'){
            event.preventDefault()

            const form = event.target as HTMLFormElement;
            const userInputElementEmail = form.elements.namedItem('email') as HTMLInputElement;
            const userInputValueEmail : string = userInputElementEmail.value;
            userInputElementEmail.value = ""

            const userInputElementPerms = form.elements.namedItem('perms') as HTMLInputElement;
            const userInputValuePerms : string = userInputElementPerms.value;
            userInputElementPerms.value = ""

            setUsers((oldUsers) => {
                var copied = [...oldUsers]
                copied.push({
                    email: userInputValueEmail,
                    permission: parseInt(userInputValuePerms)
                })

                return copied;
            })

            fetch('/addUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userInputValueEmail, permission: userInputValuePerms })
            })
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error('Error:', error));
        }else{
            setUsers(users.filter(user => user.email !== modalInfo.email));

            event.preventDefault()

            const form = event.target as HTMLFormElement;
            const userInputElementEmail = form.elements.namedItem('email') as HTMLInputElement;
            const userInputValueEmail : string = modalInfo.email;
            userInputElementEmail.value = ""

            const userInputElementPerms = form.elements.namedItem('perms') as HTMLInputElement;
            const userInputValuePerms : string = userInputElementPerms.value;
            userInputElementPerms.value = ""

            setUsers((oldUsers) => {
                var copied = [...oldUsers]
                copied.push({
                    email: userInputValueEmail,
                    permission: parseInt(userInputValuePerms)
                })

                return copied;
            })

            fetch('/editUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userInputValueEmail, newPermission: userInputValuePerms })
            })
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error('Error:', error));
        }
    }

    const handleAddButtonPressed = () => {
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
            show: true,
            email: '',
            permission: '',
            type: 'Add'
        })
    }

    return (
        <>
            <div style={closeButtonStyle}>
                <button className="close-button" onClick={navigateBack}>
                    X
                </button>
            </div>
            {modalInfo.show && (
                <>
                    <div className="backdrop" onClick={() => setModalInfo({type: '', show: false, email: '', permission: ''})}></div>
                    <animated.div className="modal fade show dark-modal" style={{ display: 'block', transform: springs.y.to(y => `translateY(${y}px)`) }} tabIndex={-1}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add User</h5>
                                    <button type="button" className="btn-close" onClick={
                                        () => { setModalInfo({type: '', show: false, email: '', permission: ''})}}>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <form style={{textAlign: "left"}} onSubmit={handleModalSubmit}>
                                        <div className="form-group">
                                            <label htmlFor="email" style={{paddingRight: "0.5rem"}}>Email: </label>
                                            <input placeholder={modalInfo.email} type="email" id="email" name="email"/>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="perms" style={{paddingRight: "0.5rem"}}>Permissions: </label>
                                            <input placeholder={modalInfo.permission} type="perms" id="perms" name="perms"/>
                                        </div>

                                        <div className="modal-footer">
                                            <button type="submit" className="btn btn-primary">{modalInfo.type}</button>
                                            <button type="button" className="btn btn-secondary" onClick={() => { setModalInfo({type: '', show: false, email: '', permission: ''})}}>
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

            <div className="App-header" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                zIndex: 1,
                color: 'white'
            }}>
                <h1 className='title-admin-1' style={{ textAlign: 'left', zIndex: 3 }}>Users:</h1>

                <table style={{ width: '60%', borderCollapse: 'collapse', zIndex: 3 }}>
                    <thead>
                        <tr>
                            <th style={{ zIndex: 3, border: '2px solid white', padding: '10px', textAlign: 'center' }}>Email</th>
                            <th style={{ zIndex: 3, border: '2px solid white', padding: '10px', textAlign: 'center' }}>Permission</th>
                            <th style={{ zIndex: 3, border: '2px solid white', padding: '10px', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={index}>
                                <td style={{ zIndex: 3, border: '2px solid white', padding: '10px', textAlign: 'center' }}>{user.email}</td>
                                <td style={{ zIndex: 3, border: '2px solid white', padding: '10px', textAlign: 'center' }}>{stringPermissions[user.permission]}</td>
                                <td style={{ zIndex: 3, border: '2px solid white', padding: '10px', textAlign: 'center' }}>
                                    <button className='btn btn-secondary' onClick={() => handleEdit(user.email, user.permission)}>Edit</button>
                                    <button className='btn btn-secondary' onClick={() => handleDelete(user.email, user.permission)} style={{ marginLeft: '10px' }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button className='btn btn-primary' onClick={handleAddButtonPressed} style={{zIndex: 3, marginTop: '1rem'}}>Add User</button>
            </div>
        </>
    );
}

export default Administrator;
