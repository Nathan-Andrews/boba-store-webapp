import React, { useState, useEffect } from 'react';
import axios from 'axios';

type MenuItem = {
  name: string;
  price: string;
  id: number;
  category: number;
  is_visible: boolean;
  // Add other properties as needed
};

type MenuCategory = {
  name: string;
  items: MenuItem[];
};

function MenuList() {
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.post('/populatemenulist')
      .then((response) => {
        setMenuCategories(response.data.menuCategories);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching menu data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="menu-list">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="menu-categories">
          {menuCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="menu-category">
              <h2 className="category-name">{category.name}</h2>
              <div>
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                  >
                    <div
                      style={{
                        fontSize: '90px', // Adjust the font size as needed
                        color: 'white', // Adjust the text color as needed
                        alignContent: 'center'
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: '14px', // Adjust the font size as needed
                        color: 'green', // Adjust the text color as needed
                      }}
                    >
                      {item.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MenuList;