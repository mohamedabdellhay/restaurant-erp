# Frontend Integration Guide: Payment Gateway

This guide covers how the Frontend interacts with the new unified Payment Gateway architecture (currently supporting Kashier) within the Restaurant ERP context.

## 1. Overview

The flow generally consists of three steps:
1. **Initiate Action:** The frontend creates an entity requiring payment (e.g. a new Subscription or a Restaurant Order). The backend will automatically generate a transaction session and return a **Checkout URL**.
2. **Redirect to Gateway:** The frontend redirects the user/customer to the provided `checkoutUrl`.
3. **Gateway Callback:** After the customer pays, the gateway redirects them back to our Backend `/api/payments/callback/:provider` endpoint. 
4. **Final Redirection:** Our backend verifies the payment, updates the database statuses, and then immediately redirects the customer back to the Frontend's success or failure pages.

---

## 2. Expected API Responses

Any API call that initiates a payment flow (such as `POST /api/subscription/register`) will return a `checkoutUrl`.

### Example (Subscription Registration)

**Endpoint:** `POST /api/subscription/register`

**Response:**
```json
{
  "success": true,
  "data": {
    "restaurant": { "_id": "60d...123", "name": "..." },
    "subscription": { "_id": "60d...456", "status": "pending" },
    "accessToken": "eyJhbG...",
    "checkoutUrl": "https://checkout.kashier.io/?payment=MERCHANT...&hash=..."
  },
  "message": "Registration successful. Please complete payment via the provided URL."
}
```

*Action Required (Frontend):* 
Instead of rendering a success page immediately, grab the `checkoutUrl` from the response and redirect the browser to it.
```javascript
window.location.href = response.data.checkoutUrl;
```

---

## 3. Handling Callbacks

You **do not** need to hit the backend directly after payment. The Payment Gateway (e.g. Kashier) will handle sending the user back.

It flows like this:
Kashier $\rightarrow$ `Backend /api/payments/callback/kashier` $\rightarrow$ Evaluates Status $\rightarrow$ Redirects to **Frontend URL**.

The Backend is explicitly hardcoded to redirect customers back to the frontend on completion:

### Success Page
If the payment succeeds, the user will be redirected to:
`http://localhost:5173/dashboard?payment=success`
*(Note: Production endpoints will swap `localhost` for your deployed domain based on ENV vars)*

**Frontend Required Action:**
Read the `?payment=success` query parameter to display a friendly "Payment Successful" toast or modal to the user on the dashboard.

### Failure Page
If the payment fails or the user cancels, they will be redirected to:
`http://localhost:5173/payment/failed`

**Frontend Required Action:**
Create a route `/payment/failed` in your React/Vue app showing the user that the payment didn't go through and providing a button to retry or contact support.

---

## 4. Future Providers

The system is now agnostic. In the future, if we switch to Stripe or Paymob, the `checkoutUrl` format will change entirely (it will point to Stripe instead of Kashier), but the Frontend logic remains **exactly the same**. 

You will always use `window.location.href = response.data.checkoutUrl;` and you will always await the customer bouncing back to `/dashboard?payment=success` or `/payment/failed`.

---

## 5. Order Payments

For restaurant orders (Dine-in, Takeaway, or Delivery), use the following flow:

**Endpoint:** `GET /api/orders/:id/payment-link`

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.kashier.io/..."
  }
}
```

**Implementation Details:**
1.  First, create the order normally via `POST /api/orders`.
2.  Once you have the `_id` of the order, call the `payment-link` endpoint.
3.  Redirect the customer as usual.
4.  The system will automatically mark the order as `paid` and update its status once the transaction is complete.

---

## 6. Supported Gateways

To dynamically render the settings UI for different providers, use this endpoint to get all supported gateway names in the system.

**Endpoint:** `GET /api/payments/gateways`
**Authentication:** Bearer Token required.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "kashier",
      "logo": "http://localhost:3000/uploads/gateways/kashier-123.png"
    }
  ]
}
```

---

## 7. Uploading Gateway Logos

Administrators can upload a custom logo for each payment provider to be displayed during checkout selection.

**Endpoint:** `POST /api/payments/settings/:provider/logo` (e.g., `/api/payments/settings/kashier/logo`)
**Authentication:** Bearer Token required (**MANAGE_SETTINGS** permission).
**Content-Type:** `multipart/form-data`

**Request Body:**
- `logo`: [File] (max 2MB, jpg/png/webp)

**Response:**
```json
{
  "success": true,
  "message": "kashier logo uploaded successfully",
  "data": {
    "logo": "http://localhost:3000/uploads/gateways/kashier-1711670400000.png"
  }
}
```

---

## 8. Managing Gateway Settings (Admin Dashboard)

Restaurant administrators can now manage their own Kashier credentials through the dashboard. This allows each restaurant to receive funds into their own Kashier account.

### Get Current Settings
**Endpoint:** `GET /api/payments/settings/kashier`
**Authentication:** Bearer Token required.

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "MID-123-456",
    "apiKey": "****789a",
    "iframeSecret": "****bcde",
    "testMode": true
  }
}
```
*Note: Sensitive keys are masked. Only the last 4 characters are shown.*

### Update Settings
**Endpoint:** `POST /api/payments/settings/kashier`
**Authentication:** Bearer Token required.

**Payload:**
```json
{
  "merchantId": "MID-123-456",
  "apiKey": "your_full_api_key_here",
  "iframeSecret": "your_full_iframe_secret_here",
  "testMode": true
}
```
*Action Required (Frontend):* 
Provide a form in the Restaurant Settings panel where the admin can input these values. Once saved, all future orders from this restaurant will use these new credentials.

