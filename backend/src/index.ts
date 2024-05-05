import express, { Request, Response } from 'express';
import path from 'path';
import { Credentials, OAuth2Client, TokenPayload, auth } from 'google-auth-library';
import axios from 'axios';
import pgPromise from 'pg-promise';
import { Pool } from 'pg';

import cookieParser from 'cookie-parser'
import cors from 'cors'
import { log } from 'console';

const dotenv = require('dotenv');

dotenv.config()

const app = express();

const pgp = pgPromise();
const dbConfig = {
  host: 'csce-315-db.engr.tamu.edu',
  port: 5432,
  database: 'csce331_550_02db',
  user: 'csce331_550_02user',
  password: '0',
};

// dumb but ik
const CLIENT_ID = "495132918520-6sjmvhd6usffgumfgek6kfcrbs6rmt7p.apps.googleusercontent.com"
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://project3-7d8z.onrender.com/auth/google/callback';

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const db = pgp(dbConfig);
//type definition

type MenuItem = {
    id: number;
    name: string;
    category: string; 
    price: number;
    is_visible: boolean;
    region: number;
    // Add other properties as needed
};

type Ingredient = {
    id:number;
    price: number;
    name: string;
}

type Category = {
    id:number;
    name: string;
}

type Region = {
    id:number;
    name: string;
}

type items= {
    id: number;
    name: string;
    price: number;
    is_visible: boolean;
    region: number;
}

type Tuple<A, B> = [A, B];

interface GoogleUserInfo {
    email?: string;
    name?: string;
    picture?: string;
}



app.use(express.json());
app.use(cors())
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, '../../frontend/build')));
app.use(express.static(path.join(__dirname, '../../../app/frontend/build')));

async function verifyToken(token: string): Promise<boolean> {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID, 
        });

        const payload = ticket.getPayload();
        console.log(payload)
        if (payload?.email && payload?.email?.endsWith('@tamu.edu')){
            return true;
        }

        return false;
    } catch (error) {
        // Handle the error appropriately
        console.error('Error verifying token:', error);
        
        return false;
    }
}

app.post('/verify-google-token', async (req, res) => {
    try {
        const { token } = req.body;
        const userInfo = await verifyToken(token);
        res.json(userInfo);
    } catch (error) {
        res.status(401).send('Invalid token');
    }
});

app.get('/auth/google', (req: Request, res: Response) => {
    const redirectPath : string = req.query.redirect?.toString() || '/'; 

    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'email', 'profile'],
        prompt: 'consent',
        redirect_uri: 'https://project3-7d8z.onrender.com/auth/google/callback',
        state: redirectPath
    });

    res.json({url : url});
});

app.post('/addIngredient/:name', async (req, res) => {
    const { name } = req.params;
  
    try {
      const maxIdResult = await db.one('SELECT MAX(id) AS max_id FROM ingredients');
      const nextId = maxIdResult.max_id + 1 || 1;
  
      const price = 1;
      const sinker = false;
      const topping = false;
  
      await db.none('INSERT INTO ingredients (id, name, price, sinker, topping) VALUES ($1, $2, $3, $4, $5)', [
        nextId,
        name,
        price,
        sinker,
        topping,
      ]);
  
      res.json({ message: 'Ingredient added successfully', success: true});
    } catch (error) {
      console.error('Error adding ingredient:', error);
      res.status(500).json({ success: false, message: 'Error adding ingredient' });
    }
  });

app.get('/getTotalAmount/:ingredientId', (req, res) => {
    const { ingredientId } = req.params;
  
    db.one('SELECT SUM(amount) AS total_amount FROM batches WHERE ingredient_id = $1', [ingredientId])
      .then((result) => {
        const totalAmount = result.total_amount || 0; // Default to 0 if no value is returned
  
        res.json({ totalAmount });
      })
      .catch((error) => {
        console.error('Error calculating total amount:', error);
        res.status(500).json({ success: false, message: 'Error calculating total amount' });
      });
});

app.get('/auth/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
        res.status(400).send('Authorization code is missing');
        return;
    }

    try {
        const { tokens } = await client.getToken({
            code,
            redirect_uri: 'https://project3-7d8z.onrender.com/auth/google/callback', 
        });

        client.setCredentials(tokens);

        // Verify if the email is a .tamu email
        const userInfoResponse = await client.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' });
        const userInfo = userInfoResponse.data as GoogleUserInfo;

        if (!userInfo.email || !userInfo.email.endsWith('@tamu.edu')) {
            res.redirect("/?login=failed")

            return;
        }

        res.cookie('auth_token', tokens.id_token, { httpOnly: true, secure: true });
        
        const originalPath = req.query.state as string || '/';
        res.redirect(originalPath); 
    } catch (error) {
        console.error('Error during authentication', error);
        res.status(500).send('Authentication failed');
    }
});

app.get('/verify', (req, res) => {
    const authToken = req.cookies['auth_token'];

    if (authToken === null) {
        res.json({
            valid: false
        })

        return;
    }
    
    verifyToken(authToken)
        .then((value) => {
            res.json({
                valid: value
            })
        })
        .catch((error : string) => {
            res.json({
                valid: false
            })
        })
});

app.get('/getCategories', (req, res) => {
    db.any("SELECT * FROM categories")
        .then((data: any[]) => {
            res.json({
                success: true,
                data: data,
            });
        })
        .catch((error: any) => {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching categories'
            });
        });
});

app.get('/getOrders', async (req, res) => {
    try {
        const orders = await db.any('SELECT * FROM orders');
        res.json(orders);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getOrderByKey/:orderKey', async (req, res) => {
    const { orderKey } = req.params;

    try {
        const order = await db.oneOrNone('SELECT * FROM orders WHERE order_key = $1', [orderKey]);

        if (order) {
            res.json({
                success: true,
                order,
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
    } catch (error) {
        console.error('Error retrieving order:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving order',
        });
    }
});

app.get('/api/getOrderComponents/:orderKey', async (req, res) => {
    const { orderKey } = req.params;

    try {
        const orderComponents = await db.any('SELECT * FROM order_menu_components WHERE order_key = $1', [orderKey]);

        res.json({ success: true, message: 'Order components retrieved successfully', orderComponents });
    } catch (error) {
        console.error('Error fetching order components:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/getAccount', async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
  
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Invalid email parameter' });
      }
  
      const pool = new Pool(dbConfig);
  
      const client = await pool.connect();
      const query = 'SELECT * FROM accounts WHERE email = $1';
      const result = await client.query(query, [email]);
  
      client.release(); // Release the client back to the pool
  
      await pool.end(); // Close all connections in the pool
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
  
      res.status(200).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/changePermission', async (req: Request, res: Response) => {
    try {
      const { email, newPermission } = req.body;
  
      if (!email || typeof email !== 'string' || typeof newPermission !== 'number') {
        return res.status(400).json({ error: 'Invalid email or permission data' });
      }
  
      const pool = new Pool(dbConfig);
  
      const client = await pool.connect();
      const query = 'UPDATE accounts SET permission = $1 WHERE email = $2';
      const result = await client.query(query, [newPermission, email]);
  
      client.release(); // Release the client back to the pool
  
      await pool.end(); // Close all connections in the pool
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'User not found or permission not updated' });
      }
  
      res.status(200).json({ message: 'User permission updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.get('/getMenuItems', (req, res) => {
    db.any("SELECT * FROM menu_items")
        .then((data: any[]) => {
            res.json({
                success: true,
                data: data,
            });
        })
        .catch((error: any) => {
            console.error('Error fetching menu items:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching menu items'
            });
        });
});

async function getMenuItems() {
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

app.get('/getMenuComponents', (req, res) => {
    db.any("SELECT * FROM menu_components")
        .then((data: any[]) => {
            res.json({
                success: true,
                data: data,
            });
        })
        .catch((error: any) => {
            console.error('Error fetching menu items:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching menu items'
            });
        });
});

app.get('/getBatches', (req, res) => {
    db.any("SELECT * FROM batches")
        .then((data: any[]) => {
            res.json({
                success: true,
                data: data,
            });
        })
        .catch((error: any) => {
            console.error('Error fetching batches:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching batches'
            });
        });
});

app.post('/addBatch', async (req, res) => {
    const {in_date, amount, ingredient_id } = req.body;
    const expiration_date = in_date + 60*60*24*7*1000;

    if (!in_date || !expiration_date || typeof amount !== 'number' || typeof ingredient_id !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'Invalid request data',
        });
    }

    try {
        const maxBatchKeyResult = await db.one('SELECT MAX(batch_key) AS max_batch_key FROM batches');
        const nextBatchKey = maxBatchKeyResult.max_batch_key + 1 || 1;

        await db.none('INSERT INTO batches (batch_key, in_date, expiration_date, amount, ingredient_id) VALUES($1, $2, $3, $4, $5)',
            [nextBatchKey, in_date, expiration_date, amount, ingredient_id]);

        res.json({
            success: true,
            message: 'Batch added successfully',
        });
    } catch (error) {
        console.error('Failed to add batch:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add batch',
        });
    }
});

app.post('/removeBatch', async (req, res) => {
    const { batch_key } = req.body;

    // Check if required data is provided
    if (!batch_key || typeof batch_key !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'Invalid request data',
        });
    }

    try {
        // Check if the batch exists before attempting to remove it
        const existingBatch = await db.oneOrNone('SELECT * FROM batches WHERE batch_key = $1', batch_key);

        if (!existingBatch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found',
            });
        }

        // Remove the batch
        await db.none('DELETE FROM batches WHERE batch_key = $1', batch_key);

        res.json({
            success: true,
            message: 'Batch removed successfully',
        });
    } catch (error) {
        console.error('Failed to remove batch:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove batch',
        });
    }
});

app.post('/addAmountToBatch', async (req, res) => {
    const { amountToAdd, batchKey } = req.body;

    if (!amountToAdd || typeof amountToAdd !== 'number' || !batchKey) {
        return res.status(400).json({
            success: false,
            message: 'Invalid request data',
        });
    }

    try {
        await db.none('UPDATE batches SET amount = amount + $1 WHERE batch_key = $2', [amountToAdd, batchKey]);

        res.json({
            success: true,
            message: 'Batch amount added successfully',
        });
    } catch (error) {
        console.error('Failed to add batch amount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add batch amount',
        });
    }
});
  
app.post('/setBatchAmount', async (req, res) => {
    const { amountToAdd, batchKey } = req.body;

    if (!amountToAdd || typeof amountToAdd !== 'number' || !batchKey) {
        return res.status(400).json({
            success: false,
            message: 'Invalid request data',
        });
    }

    try {
        await db.none('UPDATE batches SET amount = $1 WHERE batch_key = $2', [amountToAdd, batchKey]);

        res.json({
            success: true,
            message: 'Batch amount added successfully',
        });
    } catch (error) {
        console.error('Failed to add batch amount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add batch amount',
        });
    }
});

app.get('/salesReport', async (req: Request, res: Response) => {
    try {
      const { startTime, endTime } = req.query;
  
      if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Both startTime and endTime are required in the query parameters.' });
      }
  
      const salesReport = await db.any(
        `SELECT
            mi.name,
            COUNT(*) AS total_sales
        FROM
            order_menu_components omc
        JOIN
            menu_items mi ON omc.menu_item = mi.id
        JOIN
            orders o ON omc.order_key = o.order_key
        WHERE
            o.timestamp BETWEEN $1 AND $2
        GROUP BY
            mi.name
        ORDER BY
            total_sales DESC;`,
        [startTime, endTime]
      );
  
      res.json(salesReport);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}); 
app.post('/removeAmountToBatch', async (req, res) => {
    const { amountToRemove, batchKey } = req.body;

    if (!amountToRemove || typeof amountToRemove !== 'number' || !batchKey) {
        return res.status(400).json({
            success: false,
            message: 'Invalid request data',
        });
    }

    try {
        await db.none('UPDATE batches SET amount = amount - $1 WHERE batch_key = $2', [amountToRemove, batchKey]);

        res.json({
            success: true,
            message: 'Batch amount removed successfully',
        });
    } catch (error) {
        console.error('Failed to remove batch amount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove batch amount',
        });
    }
});

app.get('/getBatchesByIngredient/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            success: false,
            message: 'Invalid request data',
        });
    }

    try {
        const batches = await db.any(`SELECT * FROM batches WHERE ingredient_id = ${id}`);

        res.json({
            success: true,
            data: batches,
        });
    } catch (error) {
        console.error('Failed to fetch batches by id...', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch batches by id...',
        });
    }
});

app.put('/toggleSinker/:id', (req, res) => {
    const { id } = req.params;
  
    db.one('SELECT sinker FROM ingredients WHERE id = $1', [id])
      .then((result) => {
        const currentSinkerValue = result.sinker;
        const newSinkerValue = !currentSinkerValue;
  
        return db.none('UPDATE ingredients SET sinker = $1 WHERE id = $2', [newSinkerValue, id]);
      })
      .then(() => {
        res.json({ message: 'Sinker value toggled successfully' });
      })
      .catch((error) => {
        console.error('Error toggling sinker value:', error);
        res.status(500).json({ success: false, message: 'Error toggling sinker value' });
    });
});

app.put('/toggleTopping/:id', (req, res) => {
    const { id } = req.params;
  
    db.one('SELECT topping FROM ingredients WHERE id = $1', [id])
      .then((result) => {
        const currentToppingValue = result.topping;
        const newToppingValue = !currentToppingValue;
  
        return db.none('UPDATE ingredients SET topping = $1 WHERE id = $2', [newToppingValue, id]);
      })
      .then(() => {
        res.json({ message: 'Topping value toggled successfully' });
      })
      .catch((error) => {
        console.error('Error toggling topping value:', error);
        res.status(500).json({ success: false, message: 'Error toggling topping value' });
      });
});

app.get('/getIngredientsWithData', (req, res) => {
    db.any("SELECT * FROM ingredients")
    .then((data: any[]) => {
        res.json({
            success: true,
            data: data
        })
    })
    .catch((error: any) => {
        console.error('Error fetching ingredients with data:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching ingredients with data'
            });
    })
})

app.get('/getIngredients', (req, res) => {
    db.any("SELECT * FROM ingredients ORDER BY id")
        .then((data: any[]) => {
            res.json({
                success: true,
                data: data,
            });
        })
        .catch((error: any) => {
            console.error('Error fetching ingredients:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching ingredients'
            });
        });
});

app.post('/addIngredient/:name', async (req, res) => {
    const { name } = req.params;
  
    try {
      const maxIdResult = await db.one('SELECT MAX(id) AS max_id FROM ingredients');
      const nextId = maxIdResult.max_id + 1 || 1;
  
      const price = 1;
      const sinker = false;
      const topping = false;
  
      await db.none('INSERT INTO ingredients (id, name, price, sinker, topping) VALUES ($1, $2, $3, $4, $5)', [
        nextId,
        name,
        price,
        sinker,
        topping,
      ]);
  
      res.json({ success:true, message: 'Ingredient added successfully' });
    } catch (error) {
      console.error('Error adding ingredient:', error);
      res.status(500).json({ success: false, message: 'Error adding ingredient' });
    }
  });

app.get('/restockList', async (req, res) => {
    try {
        const result = await restockList();
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching restock list:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

async function getIngredients() {
    try {
        const response = await axios.get('/getIngredients');
        return response.data;
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        throw error;
    }
}

async function getIngredientsWithData() {
    try {
        const response = await axios.get('/getIngredientsWithData');
        return response.data;
    } catch (error) {
        console.error('Error fetching ingredients with data:', error);
        throw error;
    }
}

async function getTotalAmountForIngredient(ingredientId: number): Promise<number> {
    try {
      const result = await db.one('SELECT SUM(amount) AS total_amount FROM batches WHERE ingredient_id = $1', [ingredientId]);
      const totalAmount = result.total_amount || 0; // Default to 0 if no value is returned
      return totalAmount;
    } catch (error) {
      console.error('Error calculating total amount:', error);
      throw new Error('Error calculating total amount');
    }
}

app.get('/restockReport', async (req: Request, res: Response) => {
    try {
      const ingredients = await db.any('SELECT * FROM ingredients');
      const ingredientsLessThan50: any[] = [];
  
      for (const ingredient of ingredients) {
        const ingredientId = ingredient.id;
        const ingredientName = ingredient.name;
        const totalAmount = await getTotalAmountForIngredient(ingredientId);
  
        if (totalAmount < 50) {
          ingredientsLessThan50.push({ingredientName});
        }
      }
  
      res.json({
        success: true,
        message: 'Restock report generated successfully',
        ingredientsLessThan50,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
});

async function restockList() {
    const menuItems = await getIngredients();

    const sql = `
        SELECT 
            ingredient_id,
            SUM(amount) AS total_amount
        FROM 
            batches
        GROUP BY 
            ingredient_id
        ORDER BY
            ingredient_id;
    `;

    try {
        const result = await db.any(sql);

        const ingredients = [];
        for (const row of result) {
            const ingredientId = row.ingredient_id;
            const totalAmount = row.total_amount;

            if (totalAmount < 50) {
                ingredients.push(menuItems[ingredientId - 1]);
            }
        }

        // console.log('Ingredients after filtering:', ingredients);

        return ingredients;
    } catch (error) {
        console.error('Failed to execute SQL query:', error);
        throw error;
    }
}

app.delete('/deleteIngredient/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      await db.result('DELETE FROM ingredients WHERE id = $1', [id]);
  
      res.json({ success:true, message: 'Ingredient deleted successfully' });
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      res.status(500).json({ success: false, message: 'Error deleting ingredient' });
    }
});

app.delete('/deleteMenuItem/:id', async (req, res) => {
    const menuItemId = req.params.id;

    // Check if required data is provided
    if (!menuItemId || typeof menuItemId !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'Invalid request data',
        });
    }

    try {
        // Check if the menu item exists before attempting to delete it
        const existingMenuItem = await db.oneOrNone('SELECT * FROM menu_items WHERE id = $1', menuItemId);

        if (!existingMenuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }

        // Delete the menu item
        await db.none('DELETE FROM menu_items WHERE id = $1', menuItemId);

        res.json({
            success: true,
            message: 'Menu item deleted successfully',
        });
    } catch (error) {
        console.error('Failed to delete menu item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete menu item',
        });
    }
});

// MENU HANDLER

// populate ingredients
app.post('/populateingredients', async (req, res) => {
    try {
        // Query the database to get ingredients
        const ingredientsQuery = 'SELECT * FROM ingredients';
        const ingredients = await db.any(ingredientsQuery);

        // returns an array of ingredients
        const mappedIngredients: Ingredient[] = ingredients.map((ingredient: any) => ({
            id: ingredient.id,
            name: ingredient.name,
            price: ingredient.price
        }));
        res.json({ success: true, ingredients: mappedIngredients });
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        return [];
    }
});

// populate categories
app.post('/populatecategories', async (req, res) => {
    try {
        // Query the database to get ingredients
        const categoriesQuery = 'SELECT * FROM categories';
        const categories = await db.any(categoriesQuery);

        // returns an array of ingredients
        const mappedIngredients: Category[] = categories.map((category: any) => ({
            id: category.id,
            name: category.name,
        }));
        res.json({ success: true, categories: mappedIngredients });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
});

// populate ingredients
app.post('/populateregions', async (req, res) => {
    try {
        // Query the database to get ingredients
        const regionsQuery = 'SELECT * FROM regions';
        const regions = await db.any(regionsQuery);

        // returns an array of ingredients
        const mappedIngredients: Region[] = regions.map((region: any) => ({
            id: region.id,
            name: region.name,
        }));
        res.json({ success: true, regions: mappedIngredients });
    } catch (error) {
        console.error('Error fetching regions:', error);
        return [];
    }
});

// populate menu list
app.post('/populatemenulist', async (req, res) => {
    try {
        // Query the database to get menu items
        const menuItemsQuery = 'SELECT * FROM menu_items';
        const menuItems = await db.any(menuItemsQuery);

        // Query the database to get categories
        const categoriesQuery = 'SELECT * FROM categories';
        const categories = await db.any(categoriesQuery);

        // Create an object to organize menu items by category
        const menuItemsByCategory: { [categoryId: number]: MenuItem[] } = {};

        // Organize menu items under their respective categories
        for (const menuItem of menuItems) {
            if (!menuItemsByCategory[menuItem.category]) {
                menuItemsByCategory[menuItem.category] = [];
            }

            menuItemsByCategory[menuItem.category].push({
                name: menuItem.name,
                price: menuItem.price.toFixed(2),
                id: menuItem.id,
                category: menuItem.category,
                is_visible: menuItem.is_visible,
                region: menuItem.region
            });
        }
        // Sorting by price within each category
        for (const category of categories) {
            const categoryId = category.id;
            if (menuItemsByCategory[categoryId]) {
                menuItemsByCategory[categoryId].sort((a, b) => a.price - b.price);
            }
        }

        // Create an array of menu categories following the desired format
        const updatedMenuCategories = categories.map(category => {
            return {
                name: category.name,
                items: menuItemsByCategory[category.id] || [],
            };
        });

        // Send the response with the organized menu categories
        res.json({ success: true, menuCategories: updatedMenuCategories });
    } catch (error) {
        console.error('Error populating menu list:', error);
        res.status(500).json({ success: false, message: 'Error populating menu list' });
    }
});

// populate menu list
app.post('/populatemenuitems', async (req, res) => {
    try {
        // Query the database to get menu items
        const menuItemsQuery = 'SELECT * FROM menu_items';
        const items = await db.any(menuItemsQuery);

        // Query the database to get categories
        const mappeditems: items[] = items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            is_visible: item.is_visible,
            region: item.region
        }));
        mappeditems.sort((a, b) => a.id - b.id);

        res.json({ success: true, items: mappeditems });
    } catch (error) {
        console.error('Error populating menu items:', error);
        res.status(500).json({ success: false, message: 'Error populating menu items' });
    }
});

//add item functions
async function addItem(name: any, price: number, category: any, region:number) {
    try {
        //looking for the highest id so we can add 1 as new id
        const highestIdQuery = 'SELECT max(id) FROM menu_items';
        const highestIdResult = await db.one(highestIdQuery);
        // If first entry, start from id of 1
        const highestId = highestIdResult.max || 1;
        const menuID = await db.one(
            'INSERT INTO menu_items (id, price, name, category, is_visible, region) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [highestId + 1, price, name, category, true, region]
        );
        return menuID.id;
    } catch (error) {
        console.error('Error adding menu item:', error);
        return null;
    }
}
  
  // Function to add components to the menu_components table
async function addMenuComps(menuId: any, ingredientId: any, amount: any) {
    try {
      const result = await db.result(
        'INSERT INTO menu_components (menu_item, ingredient_item, amount) VALUES ($1, $2, $3)',
        [menuId, ingredientId, amount]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error adding menu components:', error);
      return false;
    }
  }

async function getCategoryID(categoryName: any) {
    try {
        // Query to retrieve the category ID
        const category = await db.one('SELECT id FROM categories WHERE name = $1', [categoryName]);
        return category.id;
    } catch (error) {
        // If the category is not found, throw an error
        throw new Error('Category not found');
    }
}
//add item
app.put('/api/addMenuItem', async (req, res) => {
    const { name, price, selectedIngredients, categoryName, region } = req.body;
    
    const catagoryID = await getCategoryID(categoryName);
    try {
      const menuId = await addItem(name, parseFloat(price), catagoryID, region);
      
      // if 'addItem' returns the inserted menu item's ID
      if (menuId) {
        for (const ingredient of selectedIngredients) {
          const success = await addMenuComps(menuId, ingredient.id, ingredient.quantity);
          if (!success) {
            throw new Error('Ingredient not found');
          }
        }
        res.status(200).json({ success: true, message: 'Item added successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to add the menu item' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

//update price
app.put('/api/changePrice/:id', (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    db.none('UPDATE menu_items SET Price = $1 WHERE Id = $2', [price, id])
      .then(() => {
        res.json({ message: 'Price updated successfully' });
      })
      .catch((error) => {
        console.error('Error updating the price of a menu item:', error);
        res.status(500).json({
          success: false,
          message: 'Error updating the price of a menu item',
        });
      });
});

//update name
app.put('/api/changeName/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.none('UPDATE menu_items SET Name = $1 WHERE Id = $2', [name, id])
      .then(() => {
        res.json({ message: 'Name updated successfully' });
      })
      .catch((error) => {
        console.error('Error updating the name of a menu item:', error);
        res.status(500).json({
          success: false,
          message: 'Error updating the name of a menu item',
        });
      });
});

// Delete a menu item
app.put('/api/hideItem/:name', async(req, res) => {
  const { name } = req.params;
  try {
    // Find the menu item by name
    const menuItem = await db.oneOrNone('SELECT id FROM menu_items WHERE Name = $1', name);

    if (menuItem) {
        const menuID = menuItem.id;

        await db.none('UPDATE menu_items SET is_visible = false WHERE id = $1', menuID);

        res.json({ message: 'Menu item removed successfully' });
    } else {
        res.status(404).json({ message: 'Menu item not found' });
    }
    } catch (error) {
        console.error('Error removing menu item:', error);
        res.status(500).json({ message: 'Error removing menu item' });
    }
});

//bringing back the item
app.put('/api/activateItem/:name', async(req, res) => {
    const { name } = req.params;
    try {
      // Find the menu item by name
      const menuItem = await db.oneOrNone('SELECT id FROM menu_items WHERE Name = $1', name);
  
      if (menuItem) {
          const menuID = menuItem.id;
  
          await db.none('UPDATE menu_items SET is_visible = true WHERE id = $1', menuID);
  
          res.json({ message: 'Menu item brought back successfully' });
      } else {
          res.status(404).json({ message: 'Menu item not found' });
      }
      } catch (error) {
          console.error('Error bringing back menu item:', error);
          res.status(500).json({ message: 'Error bringing back menu item' });
      }
});

app.get('/api/getOrders', async (req: Request, res: Response) => {
    try {
      const { timestampFrom, timestampTo } = req.query;
  
      if (!timestampFrom || !timestampTo) {
        return res.status(400).json({ success: false, message: 'TimestampFrom and TimestampTo are required.' });
      }
  
      const orders = await getOrders(Number(timestampFrom), Number(timestampTo));
      res.json(orders);
    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

app.post('/api/getOrdersInfo', async (req: Request, res: Response) => {
    try {
      const orders = req.body.orders as Tuple<number, number>[]; 
      const ordersInfo = await getOrdersInfo(orders);
      res.json(ordersInfo);
    } catch (error) {   
      console.error('Error getting orders info:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

  // Function to get orders info
async function getOrdersInfo(orders: Tuple<number, number>[]): Promise<{ [key: number]: string[] }> {
    const ordersInfo: { [key: number]: string[] } = {};
    const menuItemNames = await getMenuItems();
  
    const batchSize = 20_000;
  
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, Math.min(orders.length, i + batchSize));
  
      const orderKeys = new Set(batch.map(order => order[0]));
  
      const placeholders = Array.from({ length: orderKeys.size }, (_, index) => `$${index + 1}`).join(',');
  
      const sql = `SELECT order_key, menu_item FROM order_menu_components WHERE order_key IN (${placeholders})`;
  
      try {
        const result = await db.any(sql, Array.from(orderKeys));
        console.log('Query result:', result)
        result.forEach(row => {
          const orderKey = row.order_key;
          const menuItem = row.menu_item;
  
          const foundMenuItem = menuItemNames.find((item: { id: any; }) => item.id === menuItem);

          if (foundMenuItem) {
            const menuItemName = foundMenuItem.name;
        
            ordersInfo[orderKey] = ordersInfo[orderKey] || [];
            ordersInfo[orderKey].push(menuItemName);
          } else {
            console.warn('Skipping undefined or NULL value for menuItem. OrderKey:', orderKey);
          }
        });
      } catch (error) {
        console.error('Error executing SQL query:', error);
        throw error;
      }
    }
  
    return ordersInfo;
  }

app.get('/api/getOrderComponents/:orderKey', async (req, res) => {
    const { orderKey } = req.params;

    try {
        const orderComponents = await db.any('SELECT * FROM order_menu_components WHERE order_key = $1', [orderKey]);

        res.json({ success: true, message: 'Order components retrieved successfully', orderComponents });
    } catch (error) {
        console.error('Error fetching order components:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/getOrderByKey/:orderKey', async (req, res) => {
    const { orderKey } = req.params;

    try {
        const order = await db.oneOrNone('SELECT * FROM order_menu_components WHERE order_key = $1', [orderKey]);

        if (order) {
            res.json({
                success: true,
                order,
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
    } catch (error) {
        console.error('Error retrieving order:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving order',
        });
    }
});

  // helper functions for orders
async function getOrders(timestampFrom: number, timestampTo: number): Promise<Tuple<number, number>[]> {
    const sql = `
      SELECT * 
      FROM orders 
      WHERE timestamp BETWEEN $1 AND $2;
    `;
  
    try {
      const orders = await db.any(sql, [timestampFrom, timestampTo]);
      return orders.map(row => [row.order_key, row.timestamp]);
    } catch (error) {
      console.error('Error executing SQL query:', error);
      throw error;
    }
  }

app.post('/api/updateOrder/:orderKey', async (req: Request, res: Response) => {
    const { orderKey } = req.params;
    try {
        const items = req.body.items as Tuple<number, number>[]; 
        const result = await updateOrder(items,Number(orderKey));
        res.json({ success: result });
    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

async function updateOrder(items: Tuple<number, number>[], targetOrderKey: number): Promise<boolean> {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const sql1 = `
      INSERT INTO orders (order_key, timestamp) 
      VALUES ($1, $2);
    `;
  
    const sql2 = `
      INSERT INTO order_menu_components (order_key, menu_item, count) 
      VALUES ($1, $2, $3);
    `;

    const sql3 = `
      DELETE FROM order_menu_components
      WHERE order_key = $1;
    `;

    const sql4 = `
      DELETE FROM orders
      WHERE order_key = $1;
    `;

  
    try {
      await db.tx(async t => {
        await t.none(sql3, [targetOrderKey]);
        await t.none(sql4, [targetOrderKey]);

        await t.none(sql1, [targetOrderKey, timestamp]);
  
        for (const item of items) {
          await t.none(sql2, [targetOrderKey, item[0], item[1]]);
        }
      });
  
      return true;
    } catch (error) {
      console.error('Error executing SQL queries:', error);
      throw error;
    }
}

app.post('/api/addOrder', async (req: Request, res: Response) => {
    try {
      const items = req.body.items as Tuple<number, number>[]; // Make sure to adjust the type accordingly
      const result = await addOrder(items);
      res.json({ success: result[0], order_key: result[1] });
    } catch (error) {
      console.error('Error adding order:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });
  
  async function addOrder(items: Tuple<number, number>[]): Promise<Tuple<boolean,number>> {
      const timestamp = Math.floor(new Date().getTime() / 1000);
      const sql1 = `
        INSERT INTO orders (order_key, timestamp) 
        VALUES ($1, $2);
      `;
    
      const sql2 = `
        INSERT INTO order_menu_components (order_key, menu_item, count) 
        VALUES ($1, $2, $3);
      `;
    
      const sql3 = `
        SELECT MAX(order_key) AS max_orderKey FROM orders;
      `;
    
      try {
        const maxOrderKeyResult = await db.one(sql3, [], result => result.max_orderkey);
        const maxOrderKey = maxOrderKeyResult + 1;
    
        await db.tx(async t => {
          await t.none(sql1, [maxOrderKey, timestamp]);
    
          for (const item of items) {
            await t.none(sql2, [maxOrderKey, item[0], item[1]]);
          }
        });
    
        return [true,maxOrderKey];
      } catch (error) {
        console.error('Error executing SQL queries:', error);
        throw error;
      }
  }

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../../app/frontend/build/index.html'));
});

app.get('/api/menuItems', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../../app/frontend/build/index.html'));
});

app.post('/addUser', async (req, res) => {
    const { email, permission } = req.body;
    if (!email || !permission) {
      return res.status(400).json ({
        success: false,
        message: 'Email and Permission are required'});
    }
  
    try {
      await db.none('INSERT INTO accounts (email, permission) VALUES($1, $2)', [email, permission]);
      res.json({
        success: true,
        message: 'User added successfully'});
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding user'});
    }
});

app.post('/removeUser', async (req, res) => {
    const { email } = req.body;

    // Check if required data is provided
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required',
        });
    }

    try {
        const existingBatch = await db.oneOrNone('SELECT * FROM accounts WHERE email = $1', email);

        if (!existingBatch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found',
            });
        }

        // Remove the batch
        await db.none('DELETE FROM accounts WHERE email = $1', email);

        res.json({
            success: true,
            message: 'Account removed successfully',
        });
    } catch (error) {
        console.error('Failed to remove account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove account',
        });
    }
});

app.get('/getTotalAmount/:ingredientId', (req, res) => {
    const { ingredientId } = req.params;
  
    db.one('SELECT SUM(amount) AS total_amount FROM batches WHERE ingredient_id = $1', [ingredientId])
      .then((result) => {
        const totalAmount = result.total_amount || 0; // Default to 0 if no value is returned
  
        res.json({ totalAmount });
      })
      .catch((error) => {
        console.error('Error calculating total amount:', error);
        res.status(500).json({ success: false, message: 'Error calculating total amount' });
      });
});

// Deprecated
app.get('/tryLogin/:loginKey', async (req, res) => {
    const loginKey = req.params.loginKey;
    if (!loginKey) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data'});
    }
  
    try {
      const result = await db.oneOrNone('SELECT account_type FROM Accounts WHERE login_key = $1', loginKey);
      if (result) {
        res.json({
            success: true,
            message: 'Login successful',
            accountType: result.account_type });
      } else {
        res.status(404).json({
            success: false,
            message: 'Login failed' });
      }
    } catch (error) {
        console.error('Failed to verify login:', error);
        res.status(500).json({ message: 'Failed to verify login' });
    }
});  

app.post('/addUser', async (req, res) => {
    const { email, permission } = req.body;
    if (!email || !permission) {
      return res.status(400).json ({
        success: false,
        message: 'Email and Permission are required'});
    }
  
    try {
      await db.none('INSERT INTO accounts (email, permission) VALUES($1, $2)', [email, permission]);
      res.json({
        success: true,
        message: 'User added successfully'});
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding user'});
    }
});

app.post('/removeUser', async (req, res) => {
    const { email } = req.body;

    // Check if required data is provided
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required',
        });
    }

    try {
        const existingBatch = await db.oneOrNone('SELECT * FROM accounts WHERE email = $1', email);

        if (!existingBatch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found',
            });
        }

        // Remove the batch
        await db.none('DELETE FROM accounts WHERE email = $1', email);

        res.json({
            success: true,
            message: 'Account removed successfully',
        });
    } catch (error) {
        console.error('Failed to remove account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove account',
        });
    }
});

app.post('/editUser', async (req, res) => {
    const { email, newPermission } = req.body;

    if (!email || newPermission === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Email and new permission are required',
        });
    }

    try {
        const user = await db.oneOrNone('SELECT * FROM accounts WHERE email = $1', email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        await db.none('UPDATE accounts SET permission = $1 WHERE email = $2', [newPermission, email]);
        res.json({
            success: true,
            message: 'User updated successfully',
        });
    } catch (error) {
        console.error('Failed to update user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
        });
    }
});

app.get('/viewUsers', async (req, res) => {
    try {
        const users = await db.any('SELECT * FROM accounts');
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});


app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../../app/frontend/build/index.html'));
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
