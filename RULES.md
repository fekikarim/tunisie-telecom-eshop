# PROJECT: TUNISIE TELECOM — FULL-STACK E-COMMERCE PLATFORM

## 1. ROLE & OBJECTIVE

Act as a skilled Full-Stack JavaScript Developer and UI/UX Designer.

Your mission is to **build a complete Tunisie Telecom e-commerce website from scratch**, implementing a simple but fully functional full-stack architecture.

This project represents my previous internship experience at Tunisie Telecom (June–July 2023). The original objective was to develop a professional e-commerce website using React.js, improving the user experience and implementing essential online shopping functionalities.

IMPORTANT:
- Start the entire project from scratch.
- Do not assume an existing implementation.
- Inspect the current working directory and available assets before starting.
- The Tunisie Telecom logo is already available inside the `assets/` folder. Locate it and use the actual logo throughout the application.
- Build a complete, working application, not just a frontend mockup.
- Keep the implementation straightforward, understandable, maintainable, and easy to demonstrate.
- Avoid unnecessary enterprise architecture, complicated patterns, microservices, or overengineering.

The final result should look like a professional telecommunications e-commerce platform.

---

## 2. TECHNOLOGY STACK

Use a simple and reliable JavaScript full-stack architecture.

**Frontend:**
- React.js
- Vite
- React Router
- Axios
- Tailwind CSS or a clean CSS architecture
- Lucide React for icons

**Backend:**
- Node.js
- Express.js
- REST API
- JWT authentication
- bcrypt for password hashing

**Database:**
- SQLite for simple local persistence.

Keep the frontend and backend separated:

```text
tunisie-telecom/
├── frontend/
├── backend/
├── assets/
└── README.md
```

You may adjust the internal structure when necessary, but keep it simple.

Do not introduce TypeScript, Next.js, Docker, Redis, complex state-management libraries, or unnecessary technologies.

---

## 3. DESIGN SYSTEM & UI/UX

Create a visually polished, modern, professional telecommunications shopping experience.

The website should feel like an authentic official Tunisie Telecom digital platform.

### Brand identity

Use the official Tunisie Telecom logo found in `assets/`.

Design around the brand's visual identity:
- Tunisie Telecom blue as the primary color.
- White and very light blue backgrounds.
- Subtle complementary colors.
- Clean typography.
- Consistent spacing and border radiuses.
- Elegant shadows and restrained animations.

Avoid:
- Generic dashboard templates.
- Excessive gradients.
- Neon colors.
- Overloaded layouts.
- Excessive animations.
- Unnecessary glassmorphism.

### Customer-facing website

Create the following pages:

1. **Home Page**
   - Professional navigation bar with Tunisie Telecom logo.
   - Hero section introducing the online store.
   - Featured products.
   - Product categories.
   - Promotional banners.
   - Popular products.
   - Clear shopping calls to action.
   - Professional footer.

2. **Shop Page**
   - Display all available products.
   - Product cards with images, names, descriptions, and prices.
   - Category filtering.
   - Search functionality.
   - Sorting by price.
   - Add-to-cart functionality.

3. **Product Details**
   - Product image.
   - Product name.
   - Description.
   - Price.
   - Stock availability.
   - Quantity selector.
   - Add-to-cart button.

4. **Shopping Cart**
   - Display selected products.
   - Update quantities.
   - Remove products.
   - Calculate subtotal and total.
   - Display an empty-cart state.
   - Proceed to checkout.

5. **Checkout**
   - Customer information form.
   - Delivery address.
   - Order summary.
   - Order confirmation.
   - Simulated payment (no real payment gateway required).

6. **My Orders**
   - Display customer orders.
   - Order reference.
   - Purchased products.
   - Total price.
   - Order status.

7. **Authentication**
   - Login page.
   - Registration page.
   - Logout functionality.

---

## 4. ADMINISTRATOR — PRODUCT MANAGEMENT

This is one of the most important parts of the project.

Implement a simple, functional administrator dashboard.

Administrator credentials:

```text
Email: admin@telecom.tn
Password: Admin123!
```

The administrator should have access to:

### Dashboard
- Total products.
- Total orders.
- Total customers.
- Total revenue.
- Recent orders.
- Basic statistics.

### Product Management

The administrator must be able to:

1. View all products.
2. Create a new product.
3. Edit an existing product.
4. Delete a product.
5. Update product prices.
6. Update available stock.
7. Assign products to categories.
8. Upload or provide product images.

The product creation form should include:

- Product name.
- Description.
- Price (TND).
- Category.
- Stock quantity.
- Image URL or image upload.

When the administrator creates a product, it MUST:
- Be saved in the SQLite database.
- Appear immediately in the customer-facing shop.
- Be available for customers to purchase.
- Persist after restarting the backend.

Implement proper form validation and user feedback.

### Order Management

The administrator should also be able to:
- View all customer orders.
- Inspect order details.
- Update order status (Pending, Confirmed, Shipped, Delivered, Cancelled).

Ensure that administrator-only routes and API endpoints are protected.

---

## 5. CUSTOMER — SHOPPING & PURCHASING

Customer test credentials:

```text
Email: user@test.tn
Password: User123!
```

The customer must be able to:

1. Log in.
2. Browse available products.
3. Search and filter products.
4. View product details.
5. Add products to the cart.
6. Modify quantities.
7. Remove products.
8. Complete checkout.
9. Place an order.
10. View their purchase history.

### Order workflow

Implement the following workflow:

```text
Customer Login
      |
      v
Browse Products
      |
      v
Select Product
      |
      v
Add to Cart
      |
      v
Review Cart
      |
      v
Checkout
      |
      v
Confirm Order
      |
      v
Order Saved in Database
      |
      v
Admin Can Manage Order
```

When an order is created:
- Generate a unique order reference.
- Save the customer information.
- Save the purchased products and their prices at purchase time.
- Calculate the total correctly.
- Decrease product stock.
- Prevent purchases exceeding available stock.
- Set the initial order status to `Pending`.

Use a database transaction when creating an order to prevent inconsistent stock and order data.

Simulate payment confirmation. Do not implement real banking or payment integrations.

---

## 6. DATABASE & INITIAL DEMONSTRATION DATA

Create the SQLite database automatically when the backend starts.

Implement database initialization and seed data.

The application must be immediately testable without manually creating products or customers.

### Required initial accounts

Create these accounts automatically:

**Administrator**
- admin@telecom.tn
- Admin123!
- Role: admin

**Customer**
- user@test.tn
- User123!
- Role: customer

Passwords must be hashed using bcrypt.

### Initial products

Populate the database with approximately 12–15 realistic demonstration products.

Use telecommunications-related products, such as:

- Samsung Galaxy smartphones.
- iPhone smartphones.
- Xiaomi smartphones.
- Wi-Fi routers.
- 4G/5G routers.
- Fiber internet equipment.
- Internet connectivity packages.
- Accessories.
- Wireless headphones.
- Smart devices.

Each product should contain:
- Name.
- Description.
- Price in TND.
- Category.
- Stock.
- Image.

Use appropriate product images from reliable image URLs or locally stored assets.

Make sure images render correctly and provide fallback images when necessary.

Create several initial orders if useful for demonstrating the administrator dashboard.

**Important:** Seed data must only be inserted when the database is initially empty. Restarting the backend must never duplicate products or overwrite existing data.

---

## 7. REST API IMPLEMENTATION

Implement a clean and understandable REST API.

Suggested endpoints:

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Products

```http
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Categories

```http
GET /api/categories
```

### Cart / Orders

```http
POST /api/orders
GET  /api/orders/my-orders
GET  /api/orders
GET  /api/orders/:id
PUT  /api/orders/:id/status
```

### Dashboard

```http
GET /api/admin/dashboard
```

Apply authentication and role-based authorization where appropriate.

Use proper HTTP status codes and consistent JSON responses.

Validate incoming data on the backend. Never trust frontend validation alone.

---

## 8. SECURITY & CODE QUALITY

Although this is a simple academic internship project, implement basic good development practices:

- Hash passwords with bcrypt.
- Use JWT authentication.
- Protect administrator endpoints.
- Implement role-based access control.
- Validate backend inputs.
- Prevent customers from accessing administrator features.
- Prevent customers from viewing other customers' orders.
- Validate product prices and quantities on the backend.
- Prevent negative stock.
- Calculate order totals on the server.
- Handle API errors properly.
- Keep secrets in environment variables.
- Include a `.env.example`.
- Never expose JWT secrets or credentials in frontend code.

Do not overcomplicate security with unnecessary infrastructure.

---

## 9. RESPONSIVENESS & USER EXPERIENCE

The application must work properly on:

- Desktop computers.
- Laptops.
- Tablets.
- Mobile phones.

Ensure:
- Responsive navigation.
- Responsive product grids.
- Comfortable mobile shopping experience.
- Responsive admin tables or card layouts.
- Consistent loading states.
- Empty states.
- Success and error notifications.
- Confirmation dialogs for destructive actions.
- Clear form validation messages.

Use subtle transitions and polished micro-interactions.

---

## 10. PROJECT EXECUTION & COMPLETION

Do not stop after generating the frontend or basic API.

Implement the entire project and verify the integration between frontend, backend, and database.

### Required execution steps

1. Inspect the working directory and existing assets.
2. Initialize the project from scratch.
3. Install the required dependencies.
4. Implement the backend and database.
5. Implement authentication and authorization.
6. Create the seed data.
7. Implement the complete REST API.
8. Develop the customer-facing React application.
9. Develop the administrator dashboard.
10. Integrate frontend and backend.
11. Test the complete administrator workflow.
12. Test the complete customer purchasing workflow.
13. Fix discovered bugs.
14. Verify that the project runs correctly.

### Essential acceptance tests

**Test 1 — Administrator**
- Log in using admin@telecom.tn.
- Create a new product.
- Verify that it is saved in the database.
- Verify that it appears in the customer shop.
- Edit its price and stock.
- Delete it and verify its removal.

**Test 2 — Customer**
- Log in using user@test.tn.
- Browse the available products.
- Add a product to the cart.
- Change its quantity.
- Complete checkout.
- Confirm that the order is created.
- Verify that the product stock decreases.
- Verify that the order appears in My Orders.

**Test 3 — Admin order management**
- Log in as administrator.
- Find the customer's new order.
- Open its details.
- Update its status.
- Verify that the change is reflected in the customer's order history.

**Test 4 — Persistence**
- Restart the backend.
- Verify that products, accounts, and orders remain available.

Fix any failures before considering the project complete.

---

## 11. README & FINAL DELIVERY

Create a professional `README.md` containing:

- Project overview.
- Features.
- Technologies used.
- Project structure.
- Installation instructions.
- Environment configuration.
- Database initialization.
- How to run the backend.
- How to run the frontend.
- Demo credentials.
- API endpoint overview.

The project should start using straightforward commands, for example:

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

If practical, provide a root-level script to launch both applications simultaneously.

### FINAL REQUIREMENTS

- Deliver a fully implemented project, not a conceptual prototype.
- Keep the architecture simple and understandable.
- Prioritize correct functionality over unnecessary complexity.
- Ensure the administrator can genuinely create and manage products.
- Ensure customers can genuinely purchase products.
- Ensure both workflows communicate through the same backend and database.
- Use the actual Tunisie Telecom logo from the provided assets.
- Maintain a professional, consistent, modern UI/UX.
- Do not leave unfinished pages, fake buttons, placeholder workflows, or nonfunctional forms.
- Do not stop at explanations: actually create the files and implement the application.

**The final objective:** A polished, responsive Tunisie Telecom e-commerce website with a working React.js frontend, Node.js/Express REST API, SQLite database, administrator product management, customer shopping cart, and functional order processing.

Keep it simple, clean, professional, and fully demonstrable.