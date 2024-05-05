import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../reports.css';
import { useSpring, animated } from '@react-spring/web'
import axios from 'axios';


interface RestockItem {
    name: string;
    id: number;
    price: number;
    sinker: boolean;
    topping: boolean;
  }

function Reports() {
    const navigate = useNavigate();
 
    const [restockData, setRestockData] = useState<any[]>([]);
    const [salesData, setSalesData] = useState<any[]>([]);

    const [selectedReport, setSelectedReport] = useState<string | null>(null);

    const onBackButtonClick = () => {
        console.log("hello!");
        const navigation = "/Managers";
        setSelectedReport(null);
        navigate(navigation);
        
    }

    const fetchRestockData = async () => {
        try {
          const response = await axios.get('/restockReport');
          const getData = response.data.ingredientsLessThan50;
          setRestockData(getData);
        } catch (error) {
          console.error('Error getting restock list items', error);
        }
      };

      const fetchSalesData = async (startTime: string, endTime: string) => {
        try {
          // Convert startTime and endTime to ISO string format
         
      
          const response = await axios.get('/salesReport', {
            params: {
              startTime: startTime,
              endTime: endTime,
            },
          });
      
          const getData = response.data;
          setSalesData(getData);
        } catch (error) {
          console.error('Error getting sales report items', error);
        }
      };
      useEffect(() => {
        fetchRestockData();
      }, []);

    const onReportButtonClick = async (report: string) => {
        console.log("report pressed: " + report);

        setSelectedReport(report);
        if (report == "Restock") {
            await fetchRestockData();
        }
        if (report === "Sales") {
            const startTimeInput = document.querySelector('.timelabel.startinput') as HTMLInputElement;
            const endTimeInput = document.querySelector('.timelabel.endinput') as HTMLInputElement;
        
            const startTime = new Date(startTimeInput.value).getTime();
            const endTime = new Date(endTimeInput.value).getTime();

            console.log(startTime.toString(),endTime.toString());
        
            await fetchSalesData(startTime.toString(), endTime.toString());
          }
    }

    return (
        <div>
            <div className="reports-container">
                <div className="content-container" style={{zIndex: 2}}>
                    <nav className="panel" style={{zIndex: 2}}>
                        {/* Left panel content */}
                        
                        {selectedReport === 'Restock' && (
                            <div>
                            {restockData.map((item, index) => (
                                <div className="report-object">
                            <div key={index} className="item-top-bar">
                                <label className="report-object-container">{`Restock Needed: ${item.ingredientName}`}</label>
                            </div>
                            </div>
                            ))}
                       
                       </div>)}
                       {selectedReport === 'Sales' && (
                        <div>
                            {salesData.map((item, index) => (
                            <div className="report-object">
                                
                                    <div key={index} className="item-top-bar">
                                        <label className="report-object-container">{`Item: ${item.name}, Sales: ${item.total_sales}`}</label>
                                    </div>
                                
                            </div>
                            ))}
                        </div>
                           
                        )}
                        {selectedReport == null && (
                            <div className="nothing">
                            <div className='bignothing'>
                                <label className='middlebignothing'>
                                    Nothing selected...
                                </label>
                               
                            </div>
                            </div>
                        )}
                       
                    </nav>
                    <nav className="panel" style={{zIndex: 2}}>
                        {/* Right panel content */}
                        <ul key={0} className='item-object'>
                            <div className='item-top-bar'>
                                <label className='report name'>Sales Report</label>
                                
                                <div className='report'>
                                    <button className="reportviewer" onClick={() => onReportButtonClick("Sales")}>View Report</button>
                                </div>
                            </div>
                            <div className='item-top-bar'>
                                <div className="report time-inputs">
                                    <div className='time'>
                                        <label className="timelabel start">Start Time:</label>
                                        <input type="datetime-local" className="timelabel startinput" />
                                    </div>
                                    <div className='time'>
                                        <div className="timelabel end"><label className="godhelpme">End Time:</label></div>
                                        <input type="datetime-local" className="timelabel endinput" />
                                    </div>
                                    
                                    
                                </div>
                            </div>
                            <div className='item-bottom-bar'>
                                <label className='desc'>
                                    All of the sales of an item in a time window
                                </label>
                            </div>
                        </ul>
                        <ul key={0} className='item-object'>
                            <div className='item-top-bar'>
                                <label className='report name'>Excess Report</label>
                                <div className='report'>
                                    <button className="reportviewer" onClick={() => onReportButtonClick("Excess")}>View Report</button>
                                </div>
                            </div>
                            <div className='item-top-bar'>
                                <div className="report time-inputs">
                                    <div className='time'>
                                        <label className="timelabel start">Start Time:</label>
                                        <input type="datetime-local" className="timelabel startinput" />
                                    </div>
                                    <div className='time'>
                                        <div className="timelabel end"><label className="godhelpme">End Time:</label></div>
                                        <input type="datetime-local" className="timelabel endinput" />
                                    </div>
                                    
                                    
                                </div>
                            </div>
                            <div className='item-bottom-bar'>
                                <label className='desc'>
                                    Items that only sell less than 10% of their stock in a time window
                                </label>
                            </div>
                        </ul>
                        <ul key={0} className='item-object'>
                            <div className='item-top-bar'>
                                <label className='report name'>Restock Report</label>
                                <div className='report'>
                                    <button className="reportviewer"onClick={() => onReportButtonClick("Restock")}>View Report</button>
                                </div>
                            </div>
                            <div className='item-bottom-bar'>
                                <label className='desc'>
                                    Items that are dangerously low and must be restocked
                                </label>
                            </div>
                        </ul>
                        <ul key={0} className='item-object'>
                            <div className='item-top-bar'>
                                <label className='report name'>Pairs Report</label>
                                <div className='report'>
                                    <button className="reportviewer" onClick={() => onReportButtonClick("Pairs")}>View Report</button>
                                </div>
                            </div>
                            <div className='item-top-bar'>
                                <div className="report time-inputs">
                                    <div className='time'>
                                        <label className="timelabel start">Start Time:</label>
                                        <input type="datetime-local" className="timelabel startinput" />
                                    </div>
                                    <div className='time'>
                                        <div className="timelabel end"><label className="godhelpme">End Time:</label></div>
                                        <input type="datetime-local" className="timelabel endinput" />
                                    </div>
                                </div>
                            </div>
                            <div className='item-bottom-bar'>
                                <label className='desc'>
                                    Items that sell well together in a time window
                                </label>
                            </div>
                        </ul>
                        <ul key={0} className='item-object'>
                            <div className='item-top-bar'>
                                <label className='report name'>Product Usage</label>
                                <div className='report'>
                                    <button className="reportviewer" onClick={() => onReportButtonClick("Product")}>View Report</button>
                                </div>
                            </div>
                            <div className='item-top-bar'>
                                <div className="report time-inputs">
                                    <div className='time'>
                                        <label className="timelabel start">Start Time:</label>
                                        <input type="datetime-local" className="timelabel startinput" />
                                    </div>
                                    <div className='time'>
                                        <div className="timelabel end"><label className="godhelpme">End Time:</label></div>
                                        <input type="datetime-local" className="timelabel endinput" />
                                    </div>
                                </div>
                            </div>
                            <div className='item-bottom-bar'>
                                <label className='desc'>
                                    Display the inventory used per item in a time window
                                </label>
                            </div>
                        </ul>
                       
                    </nav>
                </div>
                <div className="bottom-container">
                    <div className='element'>
                        <div className="text-label left-label">
                            View results of a report
                        </div>
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
                            Select a report to view
                        </div>
                    </div>
                </div>
        </div>
        </div>


    );
}

export default Reports;