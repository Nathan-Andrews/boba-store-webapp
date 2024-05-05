import axios from 'axios';

type MenuItem = {
  id: number;
  name: string;
  category: string; 
  price: number;
  is_visible: boolean;
  region: number;
};

async function getMenuItems() : Promise<MenuItem[]> {
  try {
      const response = await axios.get('/getMenuItems');
      const responseData = response.data;

      if (responseData.success) {
          return responseData.data;
      } else {
          console.error('Error fetching menuItems:', responseData.message);
          throw new Error('Error fetching menuItems');
      }
  } catch (error) {
      console.error('Error fetching menuItems:', error);
      throw error;
  }
}


const buttons = [
    "Tea",
    "Coffee",
    "Slushes",
    "Misc",
    "All Items"
  ];


var tea : MenuItem[] = [];

var coffee : MenuItem[] = [];

var slushes : MenuItem[] = [];

var misc : MenuItem[] = [];

var all : MenuItem[] = [];


getMenuItems()
  .then((response) => {
    for (var i = 0; i < response.length; i++) {
      var item = response[i];

      if (!item.is_visible) continue;

      // needs to be updated to hold price
      if (item.category == "1") {
        slushes.push(item);
      }
      else if (item.category == "2") {
        tea.push(item);
      }
      else if (item.category == "3") {
        coffee.push(item);
      }
      else {
        misc.push(item);
      }

      all.push(item);
    }
  })
  .catch((error) => {
    console.error('Promise rejected with error: ' + error);
  });


var items = new Map<string,MenuItem[]>([
  ["Tea",tea],
  ["Coffee",coffee],
  ["Slushes",slushes],
  ["Misc",misc],
  ["All Items",all]
]);

const sinkers = [
  "Boba Pearls",
  "Popping Boba",
  "Jelly Cubes",
  "Aloe Vera",
  "Lychee Fruit Bits",
  "Tapioca Balls",
  "Coconut Jelly",
  "Mango Pudding",
  "Coffee Jelly",
  "Grass Jelly"
];

const toppings = [
  "Whipped Cream",
  "Chocolate Drizzle",
  "Caramel Drizzle",
  "Rainbow Sprinkles",
  "Toasted Coconut Flakes",
  "Crushed Oreo Cookies",
  "Chopped Nuts"
];

export default {buttons, items, sinkers, toppings}