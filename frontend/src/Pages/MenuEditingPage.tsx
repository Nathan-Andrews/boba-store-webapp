import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
/**
 * Represents an ingredient in the menu.
 * @typedef {Object} Ingredient
 * @property {number} id - The unique identifier for the ingredient.
 * @property {number} price - The price of the ingredient.
 * @property {string} name - The name of the ingredient.
 */
export type Ingredient = {
    id:number;
    price: number;
    name: string;
}

/**
 * Represents a category in the menu.
 * @typedef {Object} Category
 * @property {number} id - The unique identifier for the category.
 * @property {string} name - The name of the category.
 */
export type Category = {
  id:number;
  name: string;
}

/**
 * Represents a region in the menu.
 * @typedef {Object} Region
 * @property {number} id - The unique identifier for the region.
 * @property {string} name - The name of the region.
 */
export type Region = {
  id:number;
  name: string;
}

/**
 * Represents an item in the menu.
 * @typedef {Object} MenuItem
 * @property {number} id - The unique identifier for the item.
 * @property {string} name - The name of the item.
 * @property {number} price - The price of the item.
 * @property {boolean} is_visible - Indicates whether the item is visible.
 * @property {number|null} region - The region identifier for the item.
 */
export type items= {
    id: number;
    name: string;
    price: number;
    is_visible: boolean;
    region : number|null;
}

/**
 * EditItemDialog component for editing an item.
 * @param {Object} props - The component props.
 * @param {{ id: number, name: string, price: number }} props.item - The item being edited.
 * @param {(id: number, name: string, price: number) => void} props.onSave - Callback when saving changes.
 * @param {() => void} props.onClose - Callback when closing the dialog.
 */
export const EditItemDialog: React.FC<{
    item: { id: number; name: string; price: number };
    onSave: (id: number, name: string, price: number) => void;
    onClose: () => void;
    }> = ({ item, onSave, onClose }) => {
    const [name, setName] = useState(item.name);
    const [price, setPrice] = useState(item.price.toString());

    const handleSave = () => {
        onSave(item.id, name, parseFloat(price));
        
        axios.put(`/api/changePrice/${item.id}`, { price: parseFloat(price) })
        .then((response) => {
          if (response.data.message === 'Price updated successfully') {
            // Handle successful price update
          } else {
            console.error('Failed to update the price:', response.data.message);
          }
        })
        .catch((error) => {
          console.error('Error updating the price:', error);
        });
  
      // Update the name
      axios.put(`/api/changeName/${item.id}`, { name })
        .then((response) => {
          if (response.data.message === 'Name updated successfully') {
            // Handle successful name update
          } else {
            console.error('Failed to update the name:', response.data.message);
          }
        })
        .catch((error) => {
          console.error('Error updating the name:', error);
        });

        onClose();
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputPrice = e.target.value;
      if (/^\d*\.?\d*$/.test(inputPrice)) {
        setPrice(inputPrice);
      }
    
  };

    return (
        <div className="edit-dialog">
        <h2>Edit Item: {item.name}</h2>
        <label>
            Name:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
            Price:
        <input
            type="text"
            value={price}
            onChange={handlePriceChange} 
        />
        </label>
        <button onClick={handleSave} style={{marginRight: '10px'}}>Save</button>
        <button onClick={onClose}>Cancel</button>
    </div>
    );
};


/**
 * 
 * @returns menu editing page
 */
const MenuEditingPage: React.FC = () => {

    //receiving ingredients from backend
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        axios.post('/populateingredients')
        .then((response) => {
            setIngredients(response.data.ingredients);
            setLoading(false);
        })
        .catch((error) => {
            console.error('Error fetching menu data:', error);
            setLoading(false);
        });
    }, []);

    // region selection dialog for adding a new item
    const [regionsMap, setRegionsMap] = useState<{ [key: number]: string }>({});
    useEffect(() => {
      // Fetch regions and map them to their IDs
      axios.post('/populateregions')
        .then((response) => {
          const regionsData = response.data.regions;
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

    const RegionSelection: React.FC<{
      onSelectRegion: (regionId: number,regionName: string) => void;
      onClose: () => void;
    }> = ({ onSelectRegion, onClose }) => {
      const [regions, setRegions] = useState<Region[]>([]);
  
      useEffect(() => {
        // Fetch regions from your API endpoint
        axios.post('/populateregions')
          .then((response) => {
            setRegions(response.data.regions);
          })
          .catch((error) => {
            console.error('Error fetching regions:', error);
          });
      }, []);
  
      const handleRegionSelect = (regionId: number, regionName: string) => {
        onSelectRegion(regionId, regionName);
        onClose();
      };
  
      return (
        <div className="region-selection">
          <h3>Select a Region:</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {regions.map((region) => (
              <li
                key={region.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center', // Center items horizontally
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id={region.id.toString()}
                    name={region.name}
                    onChange={() => handleRegionSelect(region.id,region.name)}
                    style={{ marginRight: '2px' }}
                  />
                  <label htmlFor={region.id.toString()} style={{ marginLeft: '5px', marginRight: '8px' }}>
                    {region.name}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    };
    // catagory selection dialog for adding a new item
    const CategorySelection: React.FC<{
      onSelectCategory: (categoryName: string) => void;
      onClose: () => void;
    }> = ({ onSelectCategory, onClose }) => {
      const [categories, setCategories] = useState<Category[]>([]);
  
      useEffect(() => {
        // Fetch categories from your API endpoint
        axios.post('/populatecategories')
          .then((response) => {
            setCategories(response.data.categories);
          })
          .catch((error) => {
            console.error('Error fetching categories:', error);
          });
      }, []);
  
      const handleCategorySelect = (categoryName: string) => {
        onSelectCategory(categoryName);
        onClose();
      };
  
      return (
        <div className="category-selection">
          <h3>Select a Category:</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {categories.map((category) => (
              <li
                key={category.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center', // Center items horizontally
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id={category.id.toString()}
                    name={category.name}
                    onChange={() => handleCategorySelect(category.name)}
                    style={{ marginRight: '2px' }}
                  />
                  <label htmlFor={category.id.toString()} style={{ marginLeft: '5px', marginRight: '8px' }}>
                    {category.name}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    };
    
    // AddItemDialog component for adding a new item
    const AddItemDialog: React.FC<{
    onAdd: (name: string, price: number, selectedIngredients: { id: number, quantity: number }[],selectedRegionId: number | null) => void;
    onClose: () => void;
    }> = ({ onAdd, onClose }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [selectedIngredients, setSelectedIngredients] = useState<{ id: number, quantity: number }[]>([]);
    const [isCategorySelectionVisible, setCategorySelectionVisible] = useState(false);
    const [isRegionSelectionVisible, setRegionSelectionVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedRegionID, setSelectedRegionID] = useState<number | null>(null);

    const handleOpenCategorySelection = () => {
      setCategorySelectionVisible(true);
    };


    /**
         * Handles category selection and closes the window.
         * @param {string} categoryName - The name of the selected category.
         */

    const handleCategorySelect = (categoryName: string) => {
      setSelectedCategory(categoryName);
      setCategorySelectionVisible(false);
    };
    const handleOpenRegionSelection = () => {
      setRegionSelectionVisible(true);
    };
    /**
     * Handles region selection and closes the window.
     * @param {number} regionId - The ID of the selected region.
     * @param {string} regionName - The name of the selected region.
     */
    const handleRegionSelect = (regionId: number, regionName: string) => {
      setSelectedRegionID(regionId);
      setSelectedRegion(regionName);
      setRegionSelectionVisible(false);
    };
    
    const handleAdd = () => {
        if (name && price) {
          const selectedIngredientsData = selectedIngredients
            .filter((ingredient) => ingredient.quantity > 0)
            .map((ingredient) => ({
              id: ingredient.id,
              quantity: ingredient.quantity
            }));
            
            const data = {
                name: name,
                price: parseFloat(price),
                selectedIngredients: selectedIngredientsData,
                categoryName: selectedCategory,
                region: selectedRegionID
              };
          
            // Send a PUT request to the server
            fetch('/api/addMenuItem', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
                .then((response) => response.json())
                .then((result) => {
                    if (result.success) {
                        // Item added successfully
                    } else 
                    {
                    console.error('Failed to add the menu item:', result.message);
                    }
                })
                .catch((error) => {
                  console.error('Internal server error:', error);
                });
          onAdd(name, parseFloat(price), selectedIngredientsData ,selectedRegionID);
          onClose();
        }
      };
    /**
     * Handles the change in price input.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The event object.
     */
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputPrice = e.target.value;
        if (/^\d*\.?\d*$/.test(inputPrice)) {
        setPrice(inputPrice);
        }
    };
    /**
     * Increments the quantity of the selected ingredient.
     * @param {number} ingredientId - The ID of the selected ingredient.
     */
    const handleIngredientIncrement = (ingredientId: number) => {
        setSelectedIngredients((prevSelectedIngredients) => {
        const ingredientIndex = prevSelectedIngredients.findIndex((item) => item.id === ingredientId);
        if (ingredientIndex !== -1) {
            prevSelectedIngredients[ingredientIndex].quantity += 1;
        } else {
            prevSelectedIngredients.push({ id: ingredientId, quantity: 1 });
        }
        return [...prevSelectedIngredients];
        });
    };
    /**
     * Decrements the quantity of the selected ingredient.
     * @param {number} ingredientId - The ID of the selected ingredient.
     */
    const handleIngredientDecrement = (ingredientId: number) => {
        setSelectedIngredients((prevSelectedIngredients) => {
        const ingredientIndex = prevSelectedIngredients.findIndex((item) => item.id === ingredientId);
        if (ingredientIndex !== -1) {
            if (prevSelectedIngredients[ingredientIndex].quantity > 0) {
                prevSelectedIngredients[ingredientIndex].quantity -= 1;
            }
            if (prevSelectedIngredients[ingredientIndex].quantity === 0) {
                prevSelectedIngredients.splice(ingredientIndex, 1);
            }
        }
        return [...prevSelectedIngredients];
        });
    };

    return (
        <div className="edit-dialog">
          <h2>Add New Item </h2>
          <div className="input-container">
          {selectedCategory && (
            <div className="selected-category">
              <p>Selected Category: {selectedCategory}</p>
            </div>
          )}
          <button onClick={handleOpenCategorySelection} style={{ marginRight: '10px' }}>Select Category</button>
          {isCategorySelectionVisible && (
            <CategorySelection
              onSelectCategory={handleCategorySelect}
              onClose={() => setCategorySelectionVisible(false)}
            />
          )}
          <button onClick={handleOpenRegionSelection}>Select Region</button>
        {selectedRegion && (
          <div className="selected-region">
            <p>Selected Region: {selectedRegion}</p>
          </div>
        )}
        {isRegionSelectionVisible && (
          <RegionSelection
            onSelectRegion={handleRegionSelect}
            onClose={() => setRegionSelectionVisible(false)}
          />
        )}
                    
            <div className="input-column">
              <label>
                Name:
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Price:
                <input type="text" value={price} onChange={handlePriceChange} />
              </label>
            </div>
            <div className="ingredients-column">
              <h3>Ingredients:</h3>
              <div className="scrollable-ingredients-box">
                <table className="ingredient-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Add</th>
                      <th>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ingredient) => (
                      <tr key={ingredient.id}>
                        <td>{ingredient.name}</td>
                        <td>${ingredient.price}</td>
                        <td>{selectedIngredients.find((item) => item.id === ingredient.id)?.quantity || 0}</td>
                        <td>
                          <button onClick={() => handleIngredientIncrement(ingredient.id)}>+</button>
                        </td>
                        <td>
                          <button onClick={() => handleIngredientDecrement(ingredient.id)}>-</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="button-container">
            <button onClick={handleAdd} style={{margin:'5px'}}>Add</button>
            <button onClick={onClose}>Cancel</button>
        </div>
        </div>
      );
    };

    const [items, setItems] = useState<items[]>([]);
    const [itemLoading, setItemLoading] = useState(true);
    useEffect(() => {
      axios
      .post('/populatemenuitems')
      .then((response) => {
          setItems(response.data.items);

          setItemLoading(false);
      })
      .catch((error) => {
          console.error('Error fetching menu data:', error);
          setItemLoading(false);
      });
  }, []);
  
    const [editItem, setEditItem] = useState<{ id: number; name: string; price: number } | null>(null);
    const [addItem, setAddItem] = useState(false);

    const handleEditClick = (id: number) => {
        const itemToEdit = items.find((item) => item.id === id);
        if (itemToEdit) {
            setEditItem(itemToEdit);
        }
    };
    const navigate = useNavigate();

    // Function to navigate back to the HomePage
    const navigateBack = () => {
        navigate('/Managers');
    };
    
    const handleAddClick = () => {
        setAddItem(true);
    };

    const handleSaveEdit = (id: number, name: string, price: number) => {
        setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, name, price } : item)));
        setEditItem(null);
    };

    const handleAddItem = (name: string, price: number, selectedIngredients: { id: number; quantity: number }[], selectedRegionId: number | null) => {
      const newItem: items = { id: items.length + 1, name, price, is_visible: true, region: selectedRegionId ?? null };
        setItems([...items, newItem]);
        setAddItem(false);
    };

    const handleToggleItem = (id: number, isVisible: boolean, name: string) => {
      
      const confirmationMessage = isVisible
        ? `Are you sure you want to hide ${name}?`
        : `Are you sure you want to show ${name}?`;

        const confirmed = window.confirm(confirmationMessage);

        if (confirmed) {
          const endpoint = isVisible ? 'hideItem' : 'activateItem';
          const action = isVisible ? 'removed' : 'brought back';
      
    

      axios.put(`/api/${endpoint}/${name}`)
        .then((response) => {
          if (response.data.message === `Menu item ${action} successfully`) {
            // Handle the success case if needed
            setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === id ? { ...item, is_visible: !item.is_visible } : item
            )
          );
          } else {
            console.error(`Failed to ${action} the menu item: ${response.data.message}`);
          }
        })
        .catch((error) => {
          console.error(`Error ${action} the menu item:`, error);
        });
      }
    };


    return (
      <div className="item-list-container">
        <header className="item-list-header">
          <h1>Menu Items</h1>
        </header>
        <table className="item-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Region</th>
              <th>Edit</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
          {items
            .filter((item) => item.is_visible)
            .map((item) => (
              <tr key={item.id}>
                <td className="menu-item-cell">{item.id}</td>
                <td className="menu-item-cell">{item.name}</td>
                <td className="menu-item-cell">${item.price.toFixed(2)}</td>
                <td className="menu-item-cell">{item.region !== null ? regionsMap[item.region] : 'N/A'}</td>
                <td className="menu-item-cell">
                  <button onClick={() => handleEditClick(item.id)}>Edit</button>
                </td>
                <td className="menu-item-cell">
                  <button
                    onClick={() =>  handleToggleItem(item.id, item.is_visible, item.name)}
                    className={item.is_visible ? 'green-button' : 'red-button'}
                  >
                    {item.is_visible ? 'Delete' : 'Show'}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      
    <div className="item-list-buttons">
        <button className="man-button" onClick={handleAddClick}>Add Item</button>
        <button className="man-button" onClick={navigateBack}>Back</button>
        {editItem && (
            <div className="dialog-overlay">
            <EditItemDialog
                item={editItem}
                onSave={handleSaveEdit}
                onClose={() => setEditItem(null)}
            />
            </div>
        )}
        {addItem && (
            <div className="dialog-overlay">
            <AddItemDialog
                onAdd={handleAddItem}
                onClose={() => setAddItem(false)}
            />
            </div>
        )}
      </div>
      
    </div>
  );
};

export default MenuEditingPage;
