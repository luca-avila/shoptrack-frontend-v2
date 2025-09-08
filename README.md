# ShopTrack Frontend

A simple vanilla JavaScript frontend for the ShopTrack inventory management system.

## Features

- **User Authentication**: Login and registration with session management
- **Product Management**: Full CRUD operations for inventory items
- **Stock Management**: Add, remove, and set stock quantities
- **Transaction History**: View buy/sell transaction history with filtering
- **Responsive Design**: Works on desktop and mobile devices
- **Clean UI**: Simple and minimal design [[memory:7842297]]

## Files Structure

```
shoptrack-frontend-v2/
├── index.html          # Main HTML structure
├── style.css           # CSS styling
├── api.js             # API communication functions
├── auth.js            # Authentication management
├── app.js             # Main application logic
└── README.md          # This file
```

## Getting Started

1. **Start your backend server** (make sure it's running on `http://localhost:5000`)

2. **Open the frontend**:
   - Simply open `index.html` in your web browser
   - Or serve it using a local server (recommended):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve .
     
     # Using PHP
     php -S localhost:8000
     ```

3. **Access the application**:
   - If using a local server: `http://localhost:8000`
   - If opening directly: `file:///path/to/index.html`

## Usage

### Authentication
- **Register**: Create a new account with username, email, and password
- **Login**: Sign in with your credentials
- **Logout**: Sign out from the application

### Product Management
- **Add Product**: Click "Add Product" to create new inventory items
- **Edit Product**: Click "Edit" on any product card to modify details
- **Delete Product**: Click "Delete" to remove products
- **Stock Management**: Use the stock controls to add, remove, or set quantities

### Transaction History
- **View History**: Switch to the "History" tab to see all transactions
- **Filter by Action**: Use the dropdown to filter by "Buy" or "Sell" actions
- **Transaction Details**: See product name, price, quantity, and timestamp

## API Integration

The frontend communicates with your backend using bearer token authentication [[memory:7842300]]. All API calls are handled through the `api.js` file with proper error handling and loading states.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used (arrow functions, async/await, classes)
- No external dependencies required

## Customization

The frontend is built with vanilla JavaScript and can be easily customized:

- **Styling**: Modify `style.css` for different colors, layouts, or themes
- **API Endpoint**: Change `API_BASE_URL` in `api.js` if your backend runs on a different port
- **Features**: Add new functionality by extending the existing classes

## Troubleshooting

- **CORS Issues**: Make sure your backend has CORS enabled for your frontend domain
- **API Errors**: Check browser console for detailed error messages
- **Authentication**: Ensure your backend is running and accessible
- **Network Issues**: Verify the API_BASE_URL matches your backend server

## Development Notes

- The application uses localStorage to persist authentication tokens
- All user input is validated before sending to the API
- Error messages are displayed to users for better UX
- Loading states provide visual feedback during API calls