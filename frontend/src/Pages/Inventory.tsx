import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../inventory.css';
import { useSpring, animated } from '@react-spring/web'
import axios from 'axios';

function Inventory() {
    const navigate = useNavigate();

    interface ItemData {
        amount: number;
        name: string;
        price: number;
        topping: boolean;
        sinker: boolean;
        id: number;
    }

    interface BatchData {
        batch_key: number;
        in_date: number; //unix timestamp
        expiration_date: number; //unix timestamp
        amount: number;
        ingredient_id: number;
    }
    const formatDate = (timestamp: number) => {
        console.log("Timestamp:", timestamp);
        if (timestamp < 10000000000) {
            timestamp = timestamp * 1000;
        }
        const date = new Date(timestamp * 1);
        
        console.log("Date Object:", date);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        console.log("Formatted Date Components:", day, month, year);
        return `${month}/${day}/${year}`;
    };

    const [myItemData, setItemData] = useState<ItemData[]>([]);

    const fetchItemData = async () => {
        try {
            const response = await axios.get('/getIngredientsWithData');
            const getData = response.data.data;
    
            const updatedItemData = await Promise.all(
                getData.map(async (item: {
                    amount: any; id: any; name: any; }) => {
                    // Fetch total amount for the current item using its id
                    const totalAmountResponse = await axios.get(`/getTotalAmount/${item.id}`);
                    const totalAmount = totalAmountResponse.data.totalAmount || 0;
                    item.amount = totalAmount;
    
                    console.log(`Item: ${item.name}, Total Amount: ${totalAmount}`);
    
                    return {
                        ...item,
                        amount: totalAmount,
                    };
                })
            );
    
            setItemData(updatedItemData);
        } catch (error) {
            console.error("Error getting ingredient items", error);
        }
    };

    
    useEffect(() => {
        fetchItemData();
      }, []);

    const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
    const [itemBatches, setItemBatches] = useState<BatchData[]>([]);


    const onBackButtonClick = () => {
        console.log("hello!");
        const navigation = "/Managers";
        navigate(navigation);
    }

    const onItemButtonClick = (item: ItemData) => {
        console.log("Item pressed: " + item.name);

        setSelectedItem(item);
        setBatchInputValues({});
        loadBatchesForItem(item)
    }
    const onBatchDeleteClick = async (batch: BatchData) => {
        try {
            const response = await axios.post('/removeBatch', {
                batch_key: batch.batch_key,
            });
    
            if (response.data.success) {
                console.log('Batch deleted successfully');
                
                // Reload the current list of batches after deleting
                fetchItemData().then(() => {
                    // Update batches after fetching the latest data
                    loadBatchesForItem(selectedItem!);
                });
            } else {
                console.error('Failed to delete batch:', response.data.message);
            }
        } catch (error) {
            console.error('Failed to delete batch:', error);
        }
    };

    const toggleTopping = async (ingredientId: number) => {
        try {
          const response = await axios.put(`/toggleTopping/${ingredientId}`);
          
          if (response.data.success) {
            console.log('Topping value toggled successfully');
          } else {
            console.error('Failed to toggle topping value:', response.data.message);
          }
        } catch (error) {
          console.error('Failed to toggle topping value:', error);
        }
      };

      const toggleSinker = async (ingredientId: number) => {
        try {
          const response = await axios.put(`/toggleSinker/${ingredientId}`);
          
          if (response.data.success) {
            console.log('Sinker value toggled successfully');
          } else {
            console.error('Failed to toggle Sinker value:', response.data.message);
          }
        } catch (error) {
          console.error('Failed to toggle Sinker value:', error);
        }
      };

      const onToppingToggle = async (item: ItemData, index: number) => {
        const updatedItemData = [...myItemData];
        updatedItemData[index].topping = !item.topping;
        setItemData(updatedItemData);
      
        await toggleTopping(item.id);
      };

    const onSinkerToggle = async (item: ItemData, index: number) => {
        const updatedItemData = [...myItemData];
        updatedItemData[index].sinker = !item.sinker;
        setItemData(updatedItemData);

        await toggleSinker(item.id);
    }

    const loadBatchesForItem = async (item: ItemData) => {
        try {
            console.log("loading batches for", item.name);
    
            // Fetch batches data
            const batchesResponse = await axios.get(`/getBatchesByIngredient/${item.id}`);
            const batchesData = batchesResponse.data.data;
    
            // Map batches data to BatchData objects
            const batches: BatchData[] = batchesData.map((batch: any) => ({
                batch_key: batch.batch_key,
                amount: batch.amount,
                in_date: batch.in_date,
                expiration_date: batch.expiration_date,
                ingredient_id: batch.ingredient_id,
            }));
    
            // Set batches data
            setItemBatches(batches);
    
            // Fetch the total amount for the ingredient
            const totalAmountResponse = await axios.get(`/getTotalAmount/${item.id}`);
            const totalAmount = totalAmountResponse.data.totalAmount || 0;

           // Update the amount of the selected item
            const updatedItemData = myItemData.map((i) =>
            i.id === item.id ? { ...i, amount: totalAmount } : i
            );

            // Set the updated item data
            setItemData(updatedItemData);

        } catch (error) {
            console.error("Error loading batches for item", error);
        }
    };

    const updateBatchAmount = async (batchKey: number, amount: number) => {
        try {
            const response = await axios.post('/setBatchAmount', {
                batchKey: batchKey,
                amountToAdd: amount,
            });
    
            if (response.data.success) {
                console.log('Batch amount updated successfully');
    
                // Fetch the updated batch data
                const updatedBatchesResponse = await axios.get(`/getBatchesByIngredient/${selectedItem!.id}`);
                const updatedBatchesData = updatedBatchesResponse.data.data;
    
                // Map the updated batch data to BatchData objects
                const updatedBatches: BatchData[] = updatedBatchesData.map((batch: any) => ({
                    batch_key: batch.batch_key,
                    amount: batch.amount,
                    in_date: batch.in_date,
                    expiration_date: batch.expiration_date,
                    ingredient_id: batch.ingredient_id,
                }));
    
                // Update the state with the updated batch data
                setItemBatches(updatedBatches);

                 // Update batches after fetching the latest data
                 loadBatchesForItem(selectedItem!);
                        
                 // Update the corresponding item amount in the state
                    const totalAmountResponse = await axios.get(`/getTotalAmount/${selectedItem!.id}`);
                    const totalAmount = totalAmountResponse.data.totalAmount || 0;

                    const updatedItemData = myItemData.map((item) =>
                        item.id === selectedItem!.id ? { ...item, amount: totalAmount } : item
                    );

                    // Set the updated item data in the state
                    setItemData(updatedItemData);
            } else {
                console.error('Failed to update batch amount:', response.data.message);
            }
        } catch (error) {
            console.error('Failed to update batch amount:', error);
        }
    };
    

    const [batchInputValues, setBatchInputValues] = useState<{ [batch_key: number]: string }>({});

    const handleBatchInputChange = (batch_key: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const updatedValues = { ...batchInputValues, [batch_key]: event.target.value };
        setBatchInputValues(updatedValues);
    };

    const handleBatchPlusClick = (batch_key: number) => {
        const inputValue = batchInputValues[batch_key] || '0';
        const newValue = parseInt(inputValue, 10) || 0;
        const updatedBatches = itemBatches.map((batch) => {
          if (batch.batch_key === batch_key) {
            const newAmount = Math.max(0, batch.amount + newValue);
            updateBatchAmount(batch_key, newAmount);
            return { ...batch, amount: newAmount };
          }
          return batch;
        });
        setItemBatches(updatedBatches);
      };
      
      const handleBatchMinusClick = (batch_key: number) => {
        const inputValue = batchInputValues[batch_key] || '0';
        const newValue = parseInt(inputValue, 10) || 0;
        const updatedBatches = itemBatches.map((batch) => {
          if (batch.batch_key === batch_key) {
            const newAmount = Math.max(0, batch.amount - newValue);
            updateBatchAmount(batch_key, newAmount);
            return { ...batch, amount: newAmount };
          }
          return batch;
        });
        setItemBatches(updatedBatches);
      };

    const [modalInfo, setModalInfo] = useState({ 
        showModal: false,
    });

    const [modalInfo2, setModalInfo2] = useState({ 
        showModal: false,
    });
    const [springs, api] = useSpring(() => ({
        from: { y: -500 },
    }))

    const onBatchButtonClick = () => {
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
            showModal: true
        });
    }

    const onItemAddButtonClick = () => {
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

        setModalInfo2({
            showModal: true
        });
    }
    const [error, setError] = useState(false)
    const [error2, setError2] = useState(false)


    
    const onBatchSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    
        const form = event.target as HTMLFormElement;
        const userInputElement = form.elements.namedItem('orderAmount') as HTMLInputElement;
        const userInputValue: number = parseInt(userInputElement.value);
    
        const isValid: boolean = userInputValue >= 0;
        if (isValid) {
            try {
                const response = await axios.post('/addBatch', {
                    in_date: Math.floor(Date.now()),
                    amount: userInputValue,
                    ingredient_id: selectedItem!.id,
                });
    
                if (response.data.success) {
                    console.log('Batch added successfully');
                    // Reload the current list of batches
                    fetchItemData().then(() => {
                        // Update batches after fetching the latest data
                        loadBatchesForItem(selectedItem!);
                        
                        // Update the amount of the selected item
                        const updatedItemData = myItemData.map((i) =>
                            i.id === selectedItem!.id ? { ...i, amount: response.data.totalAmount } : i
                        );
    
                        // Set the updated item data
                        setItemData(updatedItemData);
                    });
                } else {
                    console.error('Failed to add batch:', response.data.message);
                }
            } catch (error) {
                console.error('Failed to add batch:', error);
            }
        } else {
            setError(true);
        }
    };
    const onItemSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
    
        const form = event.target as HTMLFormElement;
        const userInputElement = form.elements.namedItem('itemName') as HTMLInputElement;
        const userInputValue: string = userInputElement.value.trim(); // Trim to remove leading and trailing whitespaces
        userInputElement.value = ""; // Reset item name field when submitted
    
        const isValid: boolean = userInputValue !== "";
        if (isValid) {
            try {
                const response = await axios.post(`/addIngredient/${userInputValue}`);
                
                if (response.data.success) {
                    console.log('Item added successfully');
                    // Reload the current list of items
                    fetchItemData();
                } else {
                    console.error('Failed to add item:', response.data.message);
                }
            } catch (error) {
                console.error('Failed to add item:', error);
            }
        } else {
            setError2(true);
        }
    };
    

    return (
        <div>
            <div className="inventory-container">
                <div className="content-container" style={{zIndex: 2}}>
                    <nav className="panel" style={{zIndex: 2}}>
                        {/* Left panel content */}
                        {selectedItem == null && (
                            <div className="nothing">
                            <div className='bignothing'>
                                <label className='middlebignothing'>
                                    Nothing selected...
                                </label>
                               
                            </div>
                            </div>
                        )}
                        {itemBatches.map((batch, index) => (
                            <ul key = {index}  className="batch-object" style={{zIndex: 2}}>
                                <div className = "batch-top-bar">
                                    <div className = "batch-top-element">
                                        Batch ID: {batch.batch_key}
                                    </div>
                                    <div className = "batch-top-element">
                                        <div>Date Added:</div>
                                        <div>{formatDate(batch.in_date)}</div>
                                    </div>
                                    <div className = "batch-top-element">
                                        <div>Date Expires:</div>
                                        <div>{formatDate(batch.expiration_date)}</div>
                                    </div>
                                    <div className = "batch-top-element">
                                        <button
                                         className = "batch-delete"
                                         onClick={() => onBatchDeleteClick(batch)}
                                         >
                                        Delete
                                        </button>
                                    </div>
                                </div>
                                <div className = "batch-bottom-bar">
                                    <div className = "batch-bottom-element">
                                        Amount: {batch.amount}
                                    </div>
                                    <div className = "batch-bottom-element">
                                        <div className='batch-bottomright-element'>
                                        <input
                                            type="text"
                                            value={batchInputValues[batch.batch_key] || ''}
                                            onChange={(event) => handleBatchInputChange(batch.batch_key, event)}
                                            className="batch-action input"
                                        />
                                        
                                        </div>
                                        <div className='batch-bottomright-element'>
                                            <button className='batch-action button' onClick={() => handleBatchPlusClick(batch.batch_key)}>
                                                +
                                            </button>
                                        </div>
                                        <div className='batch-bottomright-element'>
                                            <button className='batch-action button' onClick={() => handleBatchMinusClick(batch.batch_key)}>
                                                -
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </ul>
                           
                        ))}
                    </nav>
                    <nav className="panel" style={{zIndex: 2}}>
                        {/* Right panel content */}
                        {myItemData.map((item, index) => (
                            <ul key={index} className="item-object">
                                <div className='item-top-bar'>
                                    <button className='item-top-element' onClick={() => onItemButtonClick(item)}>{item.name}</button>
                                    <div className='item-top-element'>
                                            <label className={`checkbox`}>
                                                <input
                                                    className={`the-checkbox`}
                                                    type="checkbox"
                                                    checked={item.topping}
                                                    onChange={() => onToppingToggle(item, index)}
                                                />
                                            </label>
                                            <label className='checker-label'>
                                                Topping?
                                            </label>
                                        </div>
                                        <div className='item-top-element'>
                                            <label className={`checkbox`}>
                                                <input
                                                    type="checkbox"
                                                    checked={item.sinker}
                                                    onChange={() => onSinkerToggle(item, index)}
                                                />
                                            </label>
                                            <label className='checker-label'>
                                                Sinker?
                                            </label>
                                        </div>
                                    <div className='item-top-element'>Amount:<td></td>{item.amount}</div>
                                </div>
                            </ul>
                        ))}
                    </nav>
                </div>
                
                <div className="bottom-container" style={{zIndex: 2}}>
                    <div className='element'>
                        <div className="text-label left-label">
                            {selectedItem ? `Batches of ${selectedItem.name}` : 'Select an item to view batches'}
                        </div>
                        {selectedItem && <button className='batch-add' onClick={() => onBatchButtonClick()}>
                            Add Batch
                        </button>}
                    </div>
                    <div className='element'>
                        <button
                            className="back-button"
                            onClick={onBackButtonClick}
                        >
                            Back
                        </button>
                    </div>
                    <div className='element'>
                        <div className="text-label right-label">
                            Select specific Items to view Batches
                        </div>
                        <button className='item-add' onClick={() => onItemAddButtonClick()}>
                            Add Item
                        </button>
                    </div>
                </div>
                {modalInfo.showModal && (
                <>
                    <div className="backdrop" onClick={() => setModalInfo({ showModal: false})}></div>
                    <animated.div className="modal fade show dark-modal" style={{ display: 'block', transform: springs.y.to(y => `translateY(${y}px)`) }} tabIndex={-1}>
                        {/* For when incorrect batch adding happens */}
                        { error && (
                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                Invalid batch amount!
                                <button type="button" className="btn-close" data-dismiss="alert" aria-label="Close" onClick={() => setError(false)}/>
                            </div>
                        )}

                        {/*Batch Add UI*/}
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add Batch</h5>
                                </div>
                                <div className="modal-body">
                                    <form style={{textAlign: "left"}} onSubmit={onBatchSubmit}> 
                                        <label htmlFor="password" style={{paddingRight: "0.5rem"}}>Order Amount: </label>
                                        <input type="text" id="password" name="orderAmount"/>

                                        {/* Clicking submit button will activite the form onSubmit event, because of type */}
                                        <div className="modal-footer">
                                            <button type="submit" className="btn btn-primary">Add</button>
                                            <button type="button" className="btn btn-secondary" onClick={
                                                () => {setError(false); setModalInfo({ showModal: false})}}>
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
            {modalInfo2.showModal && (
                <>
                    <div className="backdrop" onClick={() => setModalInfo2({ showModal: false})}></div>
                    <animated.div className="modal fade show dark-modal" style={{ display: 'block', transform: springs.y.to(y => `translateY(${y}px)`) }} tabIndex={-1}>
                        {/* For when incorrect batch adding happens */}
                        { error2 && (
                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                Invalid item name!
                                <button type="button" className="btn-close" data-dismiss="alert" aria-label="Close" onClick={() => setError2(false)}/>
                            </div>
                        )}

                        {/*Batch Add UI*/}
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add Item</h5>
                                </div>
                                <div className="modal-body">
                                    <form style={{textAlign: "left"}} onSubmit={onItemSubmit}> 
                                        <label htmlFor="password" style={{paddingRight: "0.5rem"}}>Item Name: </label>
                                        <input type="text" id="password" name="itemName"/>

                                        {/* Clicking submit button will activite the form onSubmit event, because of type */}
                                        <div className="modal-footer">
                                            <button type="submit" className="btn btn-primary">Add</button>
                                            <button type="button" className="btn btn-secondary" onClick={
                                                () => {setError2(false); setModalInfo2({ showModal: false})}}>
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
        </div>


    );
}

export default Inventory;