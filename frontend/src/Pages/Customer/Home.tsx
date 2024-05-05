import React, {useState, ReactNode, CSSProperties, FC, useEffect } from 'react';

import { useSpring, animated } from '@react-spring/web'

import 'bootstrap/dist/css/bootstrap.min.css';
import "../../Styles/Server.css";

// Temporary stuff
import info from "./Info"
import { useNavigate } from 'react-router-dom';
const {buttons, items, sinkers, toppings} = info

type MenuItem = {
  id: number;
  name: string;
  category: string; 
  price: number;
  is_visible: boolean;
  region: number;
};

// OrderComponent is information for a single order item, and create/copy order component are functions to create OrderComponent(s).
export interface OrderComponent{
  item: MenuItem
  size : string
  toppings : string[]
  sinkers : string[]
};
const copyOrderComponent = (orderComponent : OrderComponent) => {
  return {
      item : orderComponent.item,
      size : orderComponent.size,
      toppings: [...orderComponent.toppings],
      sinkers: [...orderComponent.sinkers]
  }
}
export const createOrderComponent = (item : MenuItem) : OrderComponent => {
  return {
  item: item,
  size: 'medium',
  toppings: toppings.map(() => ''),
  sinkers: sinkers.map(() => ''),
  };
};
// Custom Hook for orders, abstracts all of the work here
const useOrder = (initialCost : number, hardCost : number) => {
  const [cost, setCost] = useState(initialCost);
  const [orderArray, setOrderArray] = useState<Array<OrderComponent>>([]);

  const addToOrder = (item : OrderComponent) : void => {
    setCost(prevCost => prevCost + hardCost);
    setOrderArray(prevOrderArray => [...prevOrderArray, item]);
  };

  const removeFromOrder = (index : number) => {
    setCost(prevCost => prevCost - hardCost);
    setOrderArray(prevOrderArray => prevOrderArray.filter((_, i) => i !== index));
  };

  const copyToOrder = (index : number) => {
    const newArray = orderArray.slice();
    
    newArray.splice(index + 1, 0, copyOrderComponent(newArray[index]));
    
    setCost(cost + hardCost);
    setOrderArray(newArray);
  }

  return {
    cost,
    orderArray,
    addToOrder,
    removeFromOrder,
    copyToOrder,
    setOrderArray
  };
};
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
            <label key={index + 'l'} className={`btn ${selectedItem[index] === item ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => toggleFunction(index)}>
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

    <label className="btn btn-outline-primary" onClick={() => toggleFunction()}>{title}</label>
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
        <div className="modal fade show" style={{ display: 'block'}} role='dialog' tabIndex={-1} onClick={(e) => {if (e.target === e.currentTarget) {setModalInfo({ showPopup: false, selectedPage: '', selectedIndex: -1});}}}>
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

// Main component
function Home() {
  const [springs, api] = useSpring(() => ({
    from: { y: -500 },
  }))

  const hardCost = 5.13;
  const { cost, orderArray, addToOrder, removeFromOrder, copyToOrder, setOrderArray} = useOrder(0.0, hardCost);

  const [region, setRegion] = useState('NULL')

  const [display, setDisplay] = useState('');

  const [weatherInfo, setWeatherInfo] = useState({
    show: false,
    data: "",
  });

  const navigate = useNavigate();

  const [modalInfo, setModalInfo] = useState({
    showPopup: false,
    selectedPage: '',
    selectedIndex: -1
  });

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

  const onCheckout = () => {
    localStorage.setItem("order", JSON.stringify(orderArray))

    navigate("/CustomerCheckout");
  }

  useEffect(() => {
    const orderJSON = localStorage.getItem("order")
    if (orderJSON === null)
      return;

    setOrderArray(JSON.parse(orderJSON))
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        console.log("Latitude is :", position.coords.latitude);
        console.log("Longitude is :", position.coords.longitude);
      },
      function(error) {
        console.error("Error Code = " + error.code + " - " + error.message);
      }
    );
  })

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        const lat = position.coords.latitude
        const long = position.coords.longitude

        fetch(`https://api.weatherapi.com/v1/current.json?key=4c055491ee034328828200157230212&q=${lat},${long}`)
          .then(response => {
            response.json().then(json => {
              const current = json.current;
              const temp = current.temp_f;

              const location = json.location;
              const locationName = location.name;

              const recommendation = temp < 65 ? "warm" : "cold"

              setWeatherInfo({
                show: true,
                data: `It is currently ${temp}°F in ${locationName}, we recommend getting a ${recommendation} drink!`
              })

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
            })
          })
      },

      function(error) {
        console.error("Error Code = " + error.code + " - " + error.message);
      }
    );
  }, [])

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
    <>
    <div style={closeButtonStyle}>
        <button className="close-button" onClick={navigateBack}>
            X
        </button>
    </div>
    {weatherInfo.show && (
        <animated.div className="modal fade show dark-modal" style={{ display: 'block', transform: springs.y.to(y => `translateY(${y}px)`) }} tabIndex={-1}>
          {/* For when incorrect login happens */}
          <div className="alert alert-danger alert-dismissible fade show" style={{textAlign: 'center'}} role="alert">
              {weatherInfo.data}
              <button type="button" className="btn-close" data-dismiss="alert" aria-label="Close" onClick={() => setWeatherInfo({show: false, data: ""})}/>
          </div>
        </animated.div>
    )}

    <div style={{zIndex: 2}}>
      <header className='server-header'>
        <div className="container-fluid"> {/* or container-flow */}
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

                <h3 style={{marginLeft: '2.35rem', marginTop: '78vh', position: 'absolute'}} className='customer-region-label'>Region: {region}</h3>
                <button style={{marginLeft: '2rem', width: '12.75rem', marginTop: '82.5vh', position: 'absolute'}} className='btn btn-primary'>Show Regional Items</button>
                
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

            <div className='row' style={{marginTop:'-3rem'}}>
              <div className='col-md-6'></div>
              <div className='col-4' style={{marginTop:'.5rem', zIndex: 2}}>
                <h3 className='server-text'>cost: ${cost.toFixed(2)}</h3>
              </div>
              <div className='col-2' style={{marginTop:'.5rem'}}>
                <div className="d-grid gap-2" style={{zIndex: 2}}>
                  <button style={{zIndex: 2}} className='btn btn-primary' onClick={onCheckout}>checkout</button>
                </div>
              </div>
            </div>
        </div>
      </header>
    </div>
    </>
  );
}

export default Home;