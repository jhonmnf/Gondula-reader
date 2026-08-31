# Implementation Plan: Web Scraper for Comercial Simonini

This plan outlines the implementation of a web scraper to retrieve product data from `https://comercialsimonini.com.br/shop/` and integrate it into the Gondola Reader project.

## 1. Requirements Overview
- **Goal**: Fetch all products from the site without a private API.
- **Price Correction**: `Physical Price = Site Price / 1.1`.
- **Tech Stack**: Vercel Functions (Node.js), `cheerio`, Vanilla JS.
- **Site Selectors**:
    - Container: `.fusion-product-content`
    - Title: `h3.product-title a`
    - Price: `span.woocommerce-Price-amount.amount bdi`

## 2. Technical Design

### 2.1 Backend: `api/get-products.js` (New File)
Create a Vercel serverless function that performs the scraping.

**Logic**:
1. **Authentication**: Verify `X-API-Key` header against `process.env.API_SECRET`.
2. **Fetching**: Use `fetch` to get the HTML from `https://comercialsimonini.com.br/shop/`.
3. **Parsing**:
    - Use `cheerio` to load the HTML.
    - Find all elements matching `.fusion-product-content`.
    - For each element:
        - Extract title from `h3.product-title a`.
        - Extract raw price string from `span.woocommerce-Price-amount.amount bdi`.
4. **Price Processing**:
    - Remove all characters except digits and commas.
    - Replace `,` with `.` to create a valid float string.
    - Convert to number.
    - Apply correction: `correctedPrice = sitePrice / 1.1`.
5. **Data Mapping**: Return an array of objects:
    ```javascript
    {
      nome: title,
      preco: correctedPrice,
      codigo: 'SCRAPED' // Placeholder since unique codes aren't in the main list
    }
    ```

### 2.2 Frontend API: `js/api.js` (Modify)
Add a function to call the new scraper endpoint.

**Changes**:
- Add `export async function fetchAllProducts()`:
    - Use `authenticatedFetch('/api/get-products')`.
    - Handle non-OK responses and JSON parsing errors.
    - Return `{ data: products }` or `{ error: message }`.

### 2.3 Frontend UI: `app.js` & `index.html` (Modify)
Integrate the scraping trigger into the user interface.

**Changes**:
- **`index.html`**: Add a button (e.g., `#botao-atualizar`) near the search field to trigger the scrape.
- **`app.js`**:
    - Implement `handleFetchAllProducts()`:
        - Display loading message via `UI.mensagem('Sincronizando produtos da loja...')`.
        - Call `API.fetchAllProducts()`.
        - On success: call `UI.exibirListaProdutos(result.data)` and show success message.
        - On error: show error message via `UI.mensagem(result.error, 'erro')`.
    - Add event listener for `#botao-atualizar`.

## 3. Implementation Details

### Price Parsing Logic
```javascript
function parseAndCorrectPrice(priceStr) {
  // Example: "R$ 495,55" -> "495.55"
  const numericString = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
  const sitePrice = parseFloat(numericString);
  if (isNaN(sitePrice)) return 0;
  return sitePrice / 1.1;
}
```

### File Paths
- **Create**: `api/get-products.js`
- **Modify**: `js/api.js`
- **Modify**: `app.js`
- **Modify**: `index.html`

## 4. Verification Plan

| Step | Action | Expected Result |
|---|---|---|
| 1 | **Backend Test** | Curl `/api/get-products` with `X-API-Key`. Verify JSON array of products with corrected prices. |
| 2 | **Trigger Test** | Click "Atualizar Produtos" button in UI. |
| 3 | **Display Test** | Verify product grid is populated with items from the website. |
| 4 | **Detail Test** | Click a scraped product. Verify it opens in the detail view (using the `codigo: 'SCRAPED'` placeholder). |
