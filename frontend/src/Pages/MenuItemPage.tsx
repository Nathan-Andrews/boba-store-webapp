import React, { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
/**
 * Type definition for a menu item.
 *
 * @typedef {Object} MenuItem
 * @property {number} id - The ID of the menu item.
 * @property {string} name - The name of the menu item.
 * @property {string} category - The category of the menu item.
 * @property {number} price - The price of the menu item.
 * @property {boolean} is_visible - Whether the menu item is visible.
 * @property {number} region - The region of the menu item.
 * // Add other properties as needed
 */
export type MenuItem = {
  name: string;
  price: string;
  id: number;
  category: number;
  is_visible: boolean;
  region: number;
  // Add other properties as needed
};

/**
 * Represents a region with specific properties.
 * @typedef {Object} Region
 * @property {number} id - The unique identifier for the region.
 * @property {string} name - The name of the region.
 */
export type Region = {
  id: number;
  name: string;
};

/**
 * Represents a region with specific properties.
 * @typedef {Object} MenuCategory 
 * @property {string} name - name of the category
 * @property {Array} MenuItem - lists of menu items under this category
 */
export type MenuCategory = {
  name: string;
  items: MenuItem[];
};
/**
 * 
 * @param checkbox
 * @returns the region dialog letting the users choose the region
 */
export const RegionDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  regionsMap: { [key: number]: string };
  selectedRegions: string[];
  setSelectedRegions: React.Dispatch<React.SetStateAction<string[]>>;
  handleRegionSelection: () => void;
}> = ({
  isOpen,
  onClose,
  regionsMap,
  selectedRegions,
  setSelectedRegions,
  handleRegionSelection,
}) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onClose}
    contentLabel="Region Selection Modal"
    style={{
      overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999, // Make sure it's above other elements
      },
      content: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '400px',
        width: '100%',
        maxHeight: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
    }}
  >
    <h2 style={{ textAlign: 'center', fontSize: '24px' }}>Select Regions</h2>
    {Object.entries(regionsMap).map(([key, value]) => (
      <div key={key} style={{ textAlign: 'center', fontSize: '18px' }}>
        <input
          type="checkbox"
          id={key.toString()}
          value={value}
          checked={selectedRegions.includes(value)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRegions([...selectedRegions, value]);
            } else {
              setSelectedRegions(
                selectedRegions.filter((region) => region !== value)
              );
            }
          }}
        />
        <label htmlFor={key.toString()}>{value}</label>
      </div>
    ))}
    <button
      style={{
        marginTop: '16px',
        padding: '8px 16px',
        fontSize: '18px',
        alignSelf: 'center',
      }}
      onClick={handleRegionSelection}
    >
      OK
    </button>
  </Modal>
);

const closeButtonStyle: React.CSSProperties = {
  position: 'fixed',
  top: '10px', // Adjust the top position as needed
  right: '10px', // Adjust the right position as needed
  zIndex: 999, // Make sure it's above other elements
  fontSize: '25px',
  fontWeight: 'bolder',
};

const regionStyle: React.CSSProperties = {
  position: 'fixed',
  top: '10px', // Adjust the top position as needed
  left: '10px', // Adjust the left position as needed
  zIndex: 999, // Make sure it's above other elements
  fontSize: '25px',
  fontWeight: 'bolder',
};
/**
 * 
 * @returns the menu item page 
 */
export function MenuItemPage() {
  const navigate = useNavigate();

  //receiving data from backend
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .post('/populatemenulist')
      .then((response) => {
        setMenuCategories(response.data.menuCategories);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching menu data:', error);
        setLoading(false);
      });
  }, []);

  // Function to navigate back to the HomePage
  const navigateBack = () => {
    navigate('/');
  };

  const [modalInfo, setModalInfo] = useState({
    showModal: false,
    selectedItem: '',
  });

  const featuredItems = [
    { 
        label: "Bucket of Milk",
        imageSrc: "/bucket.png",
        price: "$330.00",
    },
    { 
        label: "Coffee Slushie",
        imageSrc: "/coffeeslushie.png",
        price: "$6.00",
    }
    ];

  const onMenuItemClick = (item: string) => {
    setModalInfo({
      showModal: true,
      selectedItem: item,
    });
  };

  const closeModal = () => {
    setModalInfo({
      showModal: false,
      selectedItem: '',
    });
  };

  const [springs] = useSpring(() => ({
    from: { y: -500 },
  }));

  const [regionsMap, setRegionsMap] = useState<{ [key: number]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // State to track the selected region
  const [selectedRegion, setSelectedRegion] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    // Fetch regions and map them to their IDs
    axios
      .post('/populateregions')
      .then((response) => {
        const regionsData: Region[] = response.data.regions;
        const regionsMapping: { [key: number]: string } = {};
        regionsData.forEach((region: Region) => {
          regionsMapping[region.id] = region.name;
        });
        setRegionsMap(regionsMapping);
      })
      .catch((error) => {
        console.error('Error fetching regions:', error);
      });
  }, []);

  const openRegionDialog = () => {
    setIsModalOpen(true);
  };

  const closeRegionDialog = () => {
    setIsModalOpen(false);
  };

  const handleRegionSelection = () => {
    const selectedRegionIds = Object.entries(regionsMap)
      .filter(([key, value]) => selectedRegions.includes(value))
      .map(([key, value]) => ({ id: parseInt(key, 10), name: value }));

    // Handle the selected region IDs as needed
    console.log('Selected Region IDs:', selectedRegionIds);

    // Update the selected region state
    setSelectedRegion(selectedRegionIds.length > 0 ? selectedRegionIds[0] : null);

    // Close the modal
    closeRegionDialog();
  };

  // Filter items based on the selected region
  const filteredItems = menuCategories
  .flatMap((category) =>
    category.items.filter((item) =>
      item.is_visible && ((selectedRegion && item.region === selectedRegion.id) || item.region === null)
    )
  );

const filteredItemsNonNull = filteredItems;

  return (
    <div>
      <div style={closeButtonStyle}>
        <button className="close-button" onClick={navigateBack}>
          X
        </button>
      </div>

      <div style={regionStyle}>
        <button className="close-button" style={{marginTop: '50px'}} onClick={openRegionDialog}>
          Regional Exclusives
        </button>
      </div>
      <div className="menu-header" style={{ zIndex: 2 }}>
        <h1 style={{ color: 'white', fontSize: '120px', fontWeight: 'bold', zIndex: 2 }}>
          Menu Board
        </h1>

        {/* Featured items */}
        <div className="featured-container" style={{ zIndex: 2 }}>
          {featuredItems.map((item, itemIndex) => (
            <div className="featured-label" style={{ margin: '1rem' }} key={itemIndex}>
              <div className="label-content">
                <img className="label-image" src={item.imageSrc} alt={item.label} />
                <div className="text-content">
                  <div className="label-name">{item.label}</div>
                  <div className="label-price">{item.price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Menu categories and items */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="menu-categories">
            {menuCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} style={{ margin: '3rem 0', zIndex: 2 }}>
                <h1
                  style={{
                    color: 'white',
                    fontSize: '90px',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center', // Center horizontally
                    alignItems: 'center', // Center vertically
                    height: '200px', // Set the desired height
                  }}
                >
                  {category.name}
                </h1>
                {category.items
                  .filter((item) => item.is_visible && (item.region === selectedRegion?.id || item.region === null))
                  .map((item, itemIndex) => (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column', // Display items in a column
                        alignItems: 'center', // Center horizontally
                        marginBottom: '1rem', // Add spacing between items
                      }}
                      className="menu-item"
                      key={itemIndex}
                      // onClick={() => onMenuItemClick(item.name)}
                    >
                      <div
                        style={{
                          fontSize: '30px',
                          color: 'white',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: '30px',
                          color: 'white',
                        }}
                      >
                        ${item.price}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalInfo.showModal && (
        <>
          <div className="backdrop" onClick={closeModal}></div>
          <animated.div
            className="modal fade show"
            style={{ display: 'block', transform: springs.y.to((y) => `translateY(${y}px)`) }}
            tabIndex={-1}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{modalInfo.selectedItem}</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">{/* Add menu item details here */}</div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </animated.div>
        </>
      )}

      <RegionDialog
        isOpen={isModalOpen}
        onClose={closeRegionDialog}
        regionsMap={regionsMap}
        selectedRegions={selectedRegions}
        setSelectedRegions={setSelectedRegions}
        handleRegionSelection={handleRegionSelection}
      />

      {/* Display items based on the selected region */}
      
    </div>
  );
}

export default MenuItemPage;
