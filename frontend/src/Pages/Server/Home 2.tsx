import React, {useState, ReactNode, CSSProperties, FC, ChangeEvent} from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';

import 'bootstrap/dist/css/bootstrap.min.css';
import "../../Styles/Server.css";

import Background from '../Background';

import { useOrder, OrderComponent, createOrderComponent} from './OrderContext'

// Temporary stuff
import info from "./Info"
import { Duplex } from 'stream';
const {buttons, items, sinkers, toppings} = info

type Tuple<A, B> = [A, B];

// Smaller function components here for DRY.
// custom button component
interface ButtonArgs{
  className : string
  style : CSSProperties
  onClick : () => void
  children : ReactNode
}
const Button : FC<ButtonArgs> = ({ className, style, onClick, children }) => (
  <button className={className} style={style} onClick={onClick}>
    {children}
  </button>
);
// custom order item component
interface OrderItemArgs {
  order : OrderComponent
  index : number
  copyOrder : (index : number) => void
  removeOrder : (index : number) => void
  setModalInfo : React.Dispatch<React.SetStateAction<ModalInfoType>>
  orders : OrderComponent[]
}
const OrderItemExtra = (extra : string, index : number) => (
  <div className='row list-row' key={index + 'i'}>
    <div className='col-md-2 mod-col' style={{borderBottomLeftRadius:"0.2rem", zIndex: 3}}></div>
    <div className='col-10 d-flex align-items-center mod-col' style={{zIndex: 3, borderBottomRightRadius:"0.2rem"}}>+ {extra}</div>
  </div>
)
const OrderItem : FC<OrderItemArgs> = ({ order, index, copyOrder, removeOrder, setModalInfo, orders }) => {
  const sinkers = orders[index].sinkers
  const toppings = orders[index].toppings

  return (
    <div key={index} style={{paddingBottom:"1rem", zIndex: 2}}>
      <div className='row list-row'>
        <div className='col' style={{zIndex: 2,  background:'#5A616A',borderTopLeftRadius:'0.2rem',borderBottomLeftRadius:'0.2rem',padding: "3px"}}>
          <h3 className='server-text' style={{zIndex : 2}}>
            {order.item.name}
          </h3>
        </div>

        <div className='col-auto d-flex align-items-center' style={{zIndex: 2, background:"#5A616A",borderTopRightRadius:'0.2rem',borderBottomRightRadius:'0.2rem',padding: "3px"}}>
          <Button 
            className="btn btn-outline-light" 
            style={{marginRight:'0.3rem'}} 
            onClick={() => setModalInfo({ showPopup: true, selectedPage: order.item.name, selectedIndex:index})}
            children = "modify"
          />

          <Button 
            className="btn btn-outline-light" 
            style={{marginRight:'0.3rem'}} 
            onClick={() => copyOrder(index)}
            children = "+"
          />

          <Button 
            className="btn btn-outline-light" 
            style={{}} 
            onClick={() => removeOrder(index)}
            children = "-"
          />
        </div>
      </div>

      {
        sinkers.map((sinker : string,i : number) => (
          (sinker === '') ? (<div style={{zIndex : 3}} key={i}></div>) : (OrderItemExtra(sinker, i)))
        )
      }
      {
        toppings.map((topping : string, i : number) => (
          (topping === '') ? (<div style={{zIndex: 3}} key={i}></div>) : (OrderItemExtra(topping, i)))
        )
      }
    </div>
)};
// Custom modal component
interface ModalInfoType {
  showPopup: boolean,
  selectedPage: string,
  selectedIndex: number
}
interface ModificationModalArgs {
  orderArray : OrderComponent[]
  modalInfo : ModalInfoType
  setModalInfo : React.Dispatch<React.SetStateAction<ModalInfoType>>
  modifyOrder : (index: number, property: 'size' | 'toppings' | 'sinkers', value: any, valueIndex?: number) => void
}
interface CheckoutModalArgs {
  checkoutModal : boolean
  setCheckoutModal : React.Dispatch<React.SetStateAction<boolean>>
  cost: number
}
interface HistoryModalArgs {
  historyModal : {show :boolean, input: number}
  setHistoryModal : React.Dispatch<React.SetStateAction<{show :boolean, input: number}>>
  handleInputChange : (event: ChangeEvent<HTMLInputElement>) => void
  setOrderHistoryDisplay : (show: boolean, id: number) => void
}
interface WarningPopupArgs {
  warningInfo : {show : boolean, message : string};
  setWarningInfo : React.Dispatch<React.SetStateAction<{show : boolean, message : string}>>
}
interface OptionArgs {
  title: string;
  items: any[];
  selectedItem: any;
  toggleFunction: Function;
}
interface SizeOptionArgs {
  title: string;
  selectedItem: any;
  on : boolean
  toggleFunction: Function;
}
const OptionsGroup: React.FC<OptionArgs> = ({ title, items, selectedItem, toggleFunction }) => (
  <div className="col-4 text-center">
    <h4> {title} </h4>
    <div className="selection-list">
      <div key={1} className="btn-group-vertical" role="group" aria-label="Vertical button group" style={{marginTop:".25rem"}}>
        {items.map((item, index) => (
          <>
            <input 
              key={index}
              type="radio"
              className="btn-check"
              name="btnradio"
              id={'btnradio' + index}
              autoComplete="off"
              checked={selectedItem[index] === item}
              onChange={() => toggleFunction(index)}
            />
            <label key={index + 'l'} className={`btn ${selectedItem[index] === item ? 'btn-light' : 'btn-outline-light'}`} onClick={() => toggleFunction(index)}>
              {item}
            </label>
          </>
        ))}
      </div>
    </div>
  </div>
);
const SizeOption : React.FC<SizeOptionArgs> = ({ title, on, selectedItem, toggleFunction }) => (
  <>
    <input
      type="radio"
      className="btn-check"
      name="btnradio"
      id="btnradio1"
      autoComplete="off"

      checked={on}
      onChange={() => toggleFunction()}
    />

    <label className="btn btn-outline-light" onClick={() => toggleFunction()}>{title}</label>
  </>
);

const ModificationModal : FC<ModificationModalArgs> = ({ orderArray, modalInfo, setModalInfo, modifyOrder }) => {
  if (!modalInfo.showPopup) return null;

  const currentPage = modalInfo.selectedPage
  const currentIndex = modalInfo.selectedIndex
  const order = orderArray[currentIndex]

  const toggleComponentTopping = (toppingArrayIndex: number) => {modifyOrder(currentIndex, 'toppings', toppings[toppingArrayIndex], toppingArrayIndex)};
  const toggleComponentSinkers = (sinkerArrayIndex: number) => {modifyOrder(currentIndex, 'sinkers', sinkers[sinkerArrayIndex], sinkerArrayIndex)};
  const toggleComponentSize = (size : string) => {modifyOrder(currentIndex, 'size', size)}

  return (
      <>
        <div className="backdrop"></div>
        <div className="modal fade show dark-modal" style={{ display: 'block', marginTop:'4rem'}} role='dialog' tabIndex={-1} onClick={(e) => {if (e.target === e.currentTarget) {setModalInfo({ showPopup: false, selectedPage: '', selectedIndex: -1});}}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h3> {currentPage} </h3>
              </div>
              <div className="modal-body">
                <div className="row" style={{zIndex: 2}}>
                  <OptionsGroup key={1} title="Sinkers" items={sinkers} selectedItem={order.sinkers} toggleFunction={toggleComponentSinkers} />
                  <OptionsGroup key={2} title="Toppings" items={toppings} selectedItem={order.toppings} toggleFunction={toggleComponentTopping} />
                  <div className="col-4 text-center">
                    <h4> Size </h4>
                    <div className='btn-group' role='group' aria-label='size toggle button group' style={{marginTop:".25rem"}}>
                      <SizeOption
                        title={"S"}
                        on={order.size === 'small'}
                        selectedItem={order}
                        toggleFunction={() => toggleComponentSize('small')}
                      />

                      <SizeOption
                        title={"M"}
                        selectedItem={order}
                        on={order.size === 'medium'}
                        toggleFunction={() => toggleComponentSize('medium')}
                      />

                      <SizeOption
                        title={"L"}
                        selectedItem={order}
                        on={order.size === 'large'}
                        toggleFunction={() => toggleComponentSize('large')}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className='btn btn-secondary' onClick={() => setModalInfo({showPopup: false, selectedPage: '', selectedIndex: -1})}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
};


const CheckoutModal : FC<CheckoutModalArgs> = ({ checkoutModal, setCheckoutModal, cost }) => {
  if (!checkoutModal) return null;
  
  const navigate = useNavigate();

  const taxCost = cost * 0.08;

  return (
      <>
        <div className="backdrop"></div>
        <div className="modal fade show dark-modal modal-sm" style={{ display: 'block', marginTop:'8rem'}} role='dialog' tabIndex={-1} onClick={(e) => {if (e.target === e.currentTarget) {setCheckoutModal(false);}}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header text-center">
                <h3 className="modal-title w-100"> checkout </h3>
              </div>
              <div className="modal-body">
                <div className='row'>
                        <div className='col-6 d-flex justify-content-between text-center' style={{zIndex:2}}>
                            <button className='btn btn-primary' onClick={() => navigate('/CashiersCash')}><h3>Enter Cash</h3></button>
                        </div>
                        <div className='col-6' style={{zIndex:2}}>
                            <button className='btn btn-primary' onClick={() => navigate('/CashiersCard')}><h3>Prompt Card</h3></button>
                        </div>
                    </div>
              </div>
              <div className="modal-footer">
                <h4 className='server-text' style={{paddingRight:'20%'}}>total: ${(cost + taxCost).toFixed(2)}</h4>
                <button className='btn btn-secondary' onClick={() => setCheckoutModal(false)}>
                  back
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
};


const HistoryModal : FC<HistoryModalArgs> = ({ historyModal, setHistoryModal, handleInputChange, setOrderHistoryDisplay}) => {
  if (!historyModal.show) return null;

  return (
      <>
        <div className="backdrop"></div>
        <div className="modal fade show dark-modal modal-md" style={{ display: 'block', marginTop:'8rem'}} role='dialog' tabIndex={-1} onClick={(e) => {if (e.target === e.currentTarget) {setHistoryModal({show: false,input: -1});}}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header text-center">
                <h3 className="modal-title w-100"> view and edit past orders </h3>
              </div>
              <div className="modal-body">
                <div className='row'>
                        <div className='col-auto d-flex justify-content-between text-center' style={{zIndex:2}}>
                            <h3>Order #</h3>
                        </div>
                        <div className='col-6' style={{zIndex:2}}>
                          <input
                            className="form-control form-control-lg"
                            type="number"
                            placeholder="enter order number"
                            id="inputBox"
                            onChange={handleInputChange}/>
                        </div>
                    </div>
              </div>
              <div className="modal-footer">
                <button className='btn btn-primary' onClick={() => setOrderHistoryDisplay(true,historyModal.input)}>
                  go
                </button>
                <button className='btn btn-secondary' onClick={() => setHistoryModal({show: false,input: -1})}>
                  back
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
};

const WarningPopup : FC<WarningPopupArgs> = ({warningInfo, setWarningInfo}) => {
  return (<>
    {warningInfo.show && (
        <div className="alert alert-danger alert-dismissible" role="alert" style={{marginTop:'-2rem', position:'fixed', zIndex:3}}>
          <div>{warningInfo.message}</div>
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setWarningInfo({show: false, message: ''})}></button>
        </div>
    )}
  </>)
};

// Main component
function Home() {
  const navigate = useNavigate();

  const hardCost = 5.13;
  const { cost, setCost, orderArray, addToOrder, removeFromOrder, copyToOrder, setOrderArray} = useOrder(0.0, hardCost);

  const [display, setDisplay] = useState('');

  const [modalInfo, setModalInfo] = useState({
    showPopup: false,
    selectedPage: '',
    selectedIndex: -1
  });

  const [checkoutModal, setCheckoutModal] = useState(false);

  const [historyModal, setHistoryModal] = useState({
    show: false,
    input: 0
  });

  const [orderHistory,setOrderHistory] = useState({
    show: false,
    orderId: -1
  });

  const [warningInfo, setWarningInfo] = useState({
    show: false,
    message: ''
  });

  const failHistoryDisplay = () => {
    console.log("fail history");
    
    setOrderHistory({show: orderHistory.show,orderId: orderHistory.orderId});

    setHistoryModal({show: false,input: -1});

    setWarningInfo({show:true, message:'that order # does not exist'})
  }

  const setOrderHistoryDisplay = (show : boolean, id : number) =>  {
    axios.get(`/api/getOrderComponents/${id}`).then(response => {
      if (response.data.success) {
        var data = response.data.orderComponents;

        console.log("l: " + data.length);

        if (data.length == 0) {
          failHistoryDisplay();
          return;
        }

        setCost(0);
        setOrderArray([]);

        for (var i = 0; i < data.length; i++) {
          var item_id = data[i].menu_item;
          console.log(item_id);

          var l = items?.get("All Items")?.length;
          for (var j = 0; l && j < l; j++) {
            var m_item = items?.get("All Items")?.at(j);
            if (m_item && m_item.id == item_id) {
              console.log(m_item.name);
              for (var k = 0; k < data[i].count; k++) addToOrder(createOrderComponent(m_item));
              break;
            }
          }
        }
      }
      else {
        console.log("failure");
        failHistoryDisplay();
        return;
        console.error('Error adding order:', response.data.message);
      }
    })
    setOrderHistory({show: show,orderId: id});

    setHistoryModal({show: false,input: -1});

    setDisplay('');
  };

  const updateOrderHistory = () => {
    console.log("updateOrderHistory");

    var items : Tuple<number,number>[] = [];

    for (var i = 0; i < orderArray.length; i++) {
        const item : Tuple<number,number> = [orderArray[i].item.id,1];
        items.push(item);
    }

    fetch(`/api/updateOrder/${orderHistory.orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({items}),
    })
  }

  const deleteOrderHistory = () => {
    setOrderArray([]);
    setCost(0);

    var items : Tuple<number,number>[] = [];

    fetch(`/api/updateOrder/${orderHistory.orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({items}),
    })

    setDisplay('');
    
    setOrderHistory({show : false, orderId : -1});
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    console.log(value);

    setHistoryModal({show: true, input: Number(value)});
  };

  const modifyComponent = (index : number, property: 'size' | 'toppings' | 'sinkers', value: any, valueIndex?: number) => {
    setOrderArray(() => {
      var newArray = [...orderArray]
      if (property === 'size'){
        newArray[index].size = value;
      }else if (valueIndex != null){
        const table = property === 'toppings' ? toppings : sinkers
        const ownsAlready = newArray[index][property][valueIndex] === table[valueIndex]
        newArray[index][property][valueIndex] = ownsAlready ? '' : table[valueIndex];
      }

      return newArray;
    });
  }

  return (
    <>
    <div style={{zIndex: 2}}>
      <header className='server-header'>
        <div className="container-fluid"> {/* or container-flow */}
            {orderHistory.show && (<h3 className='server-text' style={{paddingLeft: '51%', position:'fixed'}}> order #{orderHistory.orderId}</h3>)}
            <div className="row" style={{paddingTop: "3rem", paddingBottom: "3rem"}}>
                <div className="col-md-6 d-flex flex-column justify-content-between text-center" style={{paddingTop: "2rem", borderRight: "7px solid #5A616A",minHeight: "80vh", zIndex: 2}}>
                  {display == '' && (
                    <div className='row' style={{zIndex: 2, marginLeft:'1rem', marginRight:'1rem'}}>
                      {buttons.map((item : string, index : number) => (
                        <div className='col-6' style={{marginBottom:'.5rem'}}>
                          <Button 
                            className='btn btn-secondary btn-lg btn-block w-100' 
                            style={{marginTop:"0.5rem", marginBottom:"0.5",height: "7rem", zIndex: 2, position: 'relative' }} 
                            key={index} 
                            onClick={() => setDisplay(item)}>
                              <div style={{position: 'absolute',
                                    top: 0,
                                    left: '50%',
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url("${item}.png")`,
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "contain"}}></div>
                                <div className="row">
                                  <div className="col-7 text-center">
                                    {item}
                                  </div>
                                </div>
                            </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {display != '' && (
                    <>
                      <h2 className="server-text" style={{zIndex: 2}}> {display} </h2>
                      <div className="drink-list" style={{zIndex: 2}}>
                        {
                          items?.get(display)?.map((item, index) => (
                            <Button 
                              children={item.name} 
                              className='btn btn-secondary btn-lg' 
                              style={{margin: "0.5rem 0.5rem",width: "8rem",height: "7rem"}} 
                              key={index} 
                              onClick={() => addToOrder(createOrderComponent(item))}
                            />
                          ))
                        }
                      </div>
                      <div className="row">
                        <div className="col"></div>
                        <div className="col-12 col-sm-auto" style={{zIndex: 2}}>
                          <Button
                            children={"back"}
                            className='btn btn-outline-primary'
                            style={{margin: "0.5rem 0.5rem",width: "5rem"}}
                            onClick={() => setDisplay('')}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Order Labels */}
                <div className="col-md-6"style={{zIndex : 2}}>
                  <div className='order-list' style={{paddingTop: "2rem",minHeight: "80vh", zIndex: 2}}>
                    {orderArray.map((value,index) => 
                      (
                        <OrderItem
                          key={index}
                          order={value}
                          index={index}
                          copyOrder={copyToOrder}
                          removeOrder={removeFromOrder}
                          setModalInfo={setModalInfo}
                          orders={orderArray}
                        />
                      )
                    )}
                  </div>
                </div>
            </div>

            <ModificationModal 
              orderArray={orderArray}
              modalInfo={modalInfo}
              setModalInfo={setModalInfo}
              modifyOrder={modifyComponent}
            />

            <CheckoutModal
              checkoutModal={checkoutModal}
              setCheckoutModal={setCheckoutModal}
              cost={cost}
            />

            <HistoryModal
              historyModal={historyModal}
              setHistoryModal={setHistoryModal}
              handleInputChange={handleInputChange}
              setOrderHistoryDisplay={setOrderHistoryDisplay}
            />

            <WarningPopup
              warningInfo={warningInfo}
              setWarningInfo={setWarningInfo}
            />

            {!orderHistory.show && (
              <div className='row' style={{marginTop:'-3rem'}}>
                <div className='col-2' style={{marginTop:'.5rem', zIndex: 2}}>
                  <button style={{marginLeft:'0.25rem', marginRight:'0.25rem', zIndex: 2}}
                  className='btn btn-primary'
                  onClick={() => setHistoryModal({show: true,input: -1})}>view past orders</button>
                </div>
                <div className='col-md-4'></div>
                <div className='col-3' style={{marginTop:'.5rem', zIndex: 2}}>
                  <h3 className='server-text'>cost: ${cost.toFixed(2)}</h3>
                </div>
                <div className='col-1' style={{marginTop:'.5rem'}}>
                  <div className="d-grid gap-2" style={{zIndex: 2}}>
                    <button style={{zIndex: 2}}
                    className='btn btn-danger'
                    disabled={orderArray.length <= 0}
                    onClick={() => {setOrderArray([]); setCost(0); setDisplay('')}}>cancel</button>
                  </div>
                </div>
                <div className='col-2' style={{marginTop:'.5rem'}}>
                  <div className="d-grid gap-2" style={{zIndex: 2}}>
                    <button style={{zIndex: 2}}
                    className='btn btn-primary'
                    disabled={orderArray.length <= 0}
                    onClick={() => setCheckoutModal(true)}>checkout</button>
                  </div>
                </div>
              </div>
            )}
            {orderHistory.show && (
              <div className='row' style={{marginTop:'-3rem'}}>
                <div className='col-3' style={{marginTop:'.5rem', zIndex: 2}}>
                  <button style={{marginLeft:'0.25rem', marginRight:'0.25rem', zIndex: 2}}
                  className='btn btn-primary'
                  onClick={() => {setOrderHistory({show: false,orderId : -1}); setCost(0); setOrderArray([])}}>new order</button>
                  <button style={{marginLeft:'0.25rem', marginRight:'0.25rem', zIndex: 2}}
                  className='btn btn-primary'
                  onClick={() => setHistoryModal({show: true,input: -1})}>view past orders</button>
                </div>
                <div className='col-6'></div>
                <div className='col-3' style={{marginTop:'.5rem', zIndex: 2}}>
                  <button style={{paddingLeft:'1.5rem',paddingRight:'1.5rem', marginLeft:'0.25rem', marginRight:'0.25rem',zIndex: 2}}
                    className='btn btn-danger'
                    disabled={orderArray.length <= 0}
                    onClick={deleteOrderHistory}>delete</button>
                  <button style={{paddingLeft:'2.5rem',paddingRight:'2.5rem', marginLeft:'0.25rem', marginRight:'0.25rem',zIndex: 2}}
                    className='btn btn-primary'
                    disabled={orderArray.length <= 0}
                    onClick={updateOrderHistory}>save</button>
                </div>
              </div>
            )}
        </div>
      </header>
    </div>
    </>
  );
}

export default Home;