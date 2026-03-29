"use strict";

// --- STATE ---
let allProducts = [];
let cart = [];

// --- DOM ELEMENTS ---
const pageContentHome = document.querySelector("#page-content-home");
const pageContentProducts = document.querySelector("#page-content-products");
const productDetailContainer = document.querySelector("#product-detail");
const cartSummaryContainer = document.querySelector("#cart-summary");
const orderSummaryContainer = document.querySelector("#order-summary");
const cartCountSpan = document.querySelector("#cart-count");
const genderFilter = document.querySelector("#gender-filter");
const cartIcon = document.querySelector(".fa-cart-shopping");
const cartSidebar = document.querySelector("#cart-sidebar");
const cartOverlay = document.querySelector("#cart-overlay");
const closeCartBtn = document.querySelector("#close-cart");
const cartSidebarContent = document.querySelector("#cart-sidebar-content");



// --- FUNCTIONS ---

//Show and hide loading spinner
function showSpinner(container) {
    if(container) container.innerHTML = `<div class="spinner"></div>`;
}

function hideSpinner(container) {
    if (container && container.innerHTML === `<div class="spinner"></div>`) {
        container.innerHTML = "";
    }
}

//Fetch products from API
async function fetchProducts() {
    const url = "https://v2.api.noroff.dev/rainy-days";

    try {
        const response = await fetch(url);
        if(!response.ok)throw new Error(`HTTP error! Status: ${response.status}`);
        const result = await response.json();
        return result.data;

    } catch (error) {
        console.error("Failed to fetch products:", error);
        return null;
    }
}

//Render product cards for home and products page
function renderProductCards(products, container) {
    if (!container) return;
    container.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
            <a href="product-details.html?id=${product.id}" class="product-details-link">
            <img src="${product.image.url}" alt="${product.image.alt || product.title}" class="product-image">
            </a>
            <div class="card-info">
                <h2 class="model-name">${product.title}</h2>
                <p class="card-price">${product.price},-</p>
                <button class="add-to-cart" data-id="${product.id}">+ Add to Cart</button>
            </div>
        `;
        container.appendChild(card);
    });
    attachAddToCartEvents();
}

//Render product details on product details page
function renderProductDetails(product) {
    productDetailContainer.innerHTML = `
            <div class="product-detail-info">
            <img src="${product.image.url}" alt="${product.image.alt || product.title}" class="product-detail-image">
            <h2>${product.title}</h2>
            <p>${product.description}</p>
            <p>${product.price},-</p>
            <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
        </div>
    `;
    attachAddToCartEvents();
}

//Order summary at confirmation page
function renderOrderSummary (order) {
    orderSummaryContainer.innerHTML = `
        <h1>Order completed!</h1>
        <p>We sent you an email confirming the purchase.</p>
        <p>Once it is on the way we will have you notified.</p>
        <p>Our team is happy to have you onboard!</p>
        <div class="confirmation-summary">
            <h2>Order summary</h2>
            ${order.items.map(item => `
                <div>
                    <h3>${item.title}</h3>
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: ${item.price},-</p>
                </div>
            `).join('')}
            <p>Shipping: ${order.shipping},-</p>
            <p>Total: ${order.total + order.shipping},-</p>
        </div>
    `;
}

//Cart summary at checkout page
function renderCartSummary() {
    if(!cartSummaryContainer) return;
    cart = loadCart();

    if (cart.length === 0) {
        cartSummaryContainer.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    let total = 0;
    cartSummaryContainer.innerHTML = "<h2>Order Summary</h2>";

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        cartSummaryContainer.innerHTML += `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image.url}" width="50">
                <span>${item.title}</span>
                <span>${item.quantity}</span>
                <span>${item.price},-</span>
            </div>
        `;
    });

    const shipping = 99;
    const totalCost = total + shipping;
    cartSummaryContainer.innerHTML += `
    <div class="cart-total">
        <p>Shipping: ${shipping},-</p>
        <p>Total: ${totalCost},-</p>
    </div>
    `;
}

//Filter products on products page
function renderFilteredProducts() {
    if (!allProducts.length) return;
    const selectedGender = genderFilter ? genderFilter.value : "all";
    const filtered = filterByGender(allProducts, selectedGender);
    renderProductCards(filtered, pageContentProducts);
}

//Cart logic and sidebar rendering
function renderCartSidebar() {
    if (!cartSidebarContent) return;
    const cart = loadCart();
    if (cart.length === 0) {
        cartSidebarContent.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
        return;
    }
    let total = 0;
    let html = "";
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image.url}" alt="${item.image.alt || item.title}">
                <div style="flex:1">
                    <strong>${item.title}</strong><br>
                    ${item.price},-<br>
                    Qty: ${item.quantity}
                </div>
                <button class="remove-item-btn" data-id="${item.id}">Remove</button>
            </div>
        `;
    });
    const shipping = 99;
    const totalCost = total + shipping;
    html += `
        <div class="cart-total">
            <p>Shipping: ${shipping},-</p>
            <p>Total: ${totalCost},-</p>
            <a href="checkout.html" class="checkout-btn">Proceed to Checkout</a>
        </div>
        `;
    cartSidebarContent.innerHTML = html;
    document.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = btn.dataset.id;
            removeFromCart(id);
            renderCartSidebar();
            updateCartCounter();
        });
    });
}

function openCartSidebar() {
    if (cartSidebar) 
        cartSidebar.classList.add("open");
    if (cartOverlay) 
        cartOverlay.classList.add("open");
    renderCartSidebar();
}
function closeCartSidebar() {
    if (cartSidebar) cartSidebar.classList.remove("open");
    if (cartOverlay) cartOverlay.classList.remove("open");
}

function loadCart () {
    const stored = localStorage.getItem("cart");
    if (stored) {
        return JSON.parse(stored);
    } else {
        return [];
    }    
}

function saveCart () {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart (product, quantity = 1) {
    cart = loadCart();
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity
        });
    }
    saveCart();
    updateCartCounter();
    openCartSidebar();
}

function removeFromCart(productId) {
    cart = loadCart();
    cart = cart.filter(item => String(item.id) !== String(productId));
    saveCart();
    updateCartCounter();
}

function updateCartCounter () {
    if (cartCountSpan) {
        const count = loadCart().reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.textContent = count;
    }
}

function attachAddToCartEvents() {
    document.querySelectorAll(".add-to-cart").forEach(btn => {
        btn.removeEventListener("click", handleAddToCart);
        btn.addEventListener("click", handleAddToCart);
    });
}

async function handleAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    if (!allProducts.length) {
        allProducts = await fetchProducts();
    }
    const product = allProducts.find(p => String(p.id) === productId);
    if (product) {
        addToCart(product);
    } else {
        console.error("Product not found:", productId);
    }
}

//Checkout form handling 
function attachCheckoutFormEvent() {
    const confirmBtn = document.querySelector(".confirm-btn");
    if (!confirmBtn) return;
    confirmBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const cart = loadCart();
        if (cart.length === 0) {
            alert("Your cart is empty. Please add items before checkout.");
            return;
        }
        const firstName = document.querySelector(`input[placeholder="First Name"]`)?.value;
        if (!firstName) {
            alert("Please fill in your first name.");
            return;
        }
        const order = {
            items: cart,
            shipping: 99,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
        localStorage.setItem("lastOrder", JSON.stringify(order));
        localStorage.removeItem("cart");
        updateCartCounter();
        window.location.href = "confirmation.html";
    });
}

//Filter products on products page
function filterByGender(products, selectedGender) {
    if (selectedGender === "all") return products;
    const genderMap = {
        male: "Male",
        female: "Female"
    };
    const apiGender = genderMap[selectedGender];
    return products.filter(product => product.gender === apiGender);
}


// --- INITIAL LOAD ---
async function initHome() {
    if (!pageContentHome) return;
    showSpinner(pageContentHome);
    allProducts = await fetchProducts();
    hideSpinner(pageContentHome);

    if (allProducts === null) {
        pageContentHome.innerHTML = `<p style="color: red;"> Failed to load products. Please check your internet and try again.</p>`;
        return;
    }
    
    const featured = allProducts.slice(0, 4);
    renderProductCards(featured, pageContentHome);
    updateCartCounter();
}

async function initProducts() {
    if (!pageContentProducts) return;
    showSpinner(pageContentProducts);
    allProducts = await fetchProducts();
    hideSpinner(pageContentProducts);

    if (allProducts === null) {
        pageContentProducts.innerHTML = `<p style="color: red;"> Failed to load products. Please refresh or try again later.</p>`;
        return;
    }
    renderFilteredProducts();
    if (genderFilter) {
        genderFilter.addEventListener("change", () => {
            renderFilteredProducts();
        });
    }
    updateCartCounter();
}

async function initProductDetail() {
    if (!productDetailContainer) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
        productDetailContainer.innerHTML = "<p>Product ID missing.</p>";
        return;
    }
    showSpinner(productDetailContainer);
    allProducts = await fetchProducts();
    hideSpinner(productDetailContainer);

    if (allProducts === null) {
        productDetailContainer.innerHTML = `<p style="color: red;"> Failed to load product details. Please try again.</p>`;
        return;
    }

    const product = allProducts.find(p => p.id == id);
    if (product) {
        renderProductDetails(product);
    } else {
        productDetailContainer.innerHTML = "<p>Product not found.</p>";
    }
    updateCartCounter();
}

function initCart() {
    if (cartIcon) cartIcon.addEventListener("click", openCartSidebar);
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartSidebar);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCartSidebar);
}

async function initCheckout() {
    if (!cartSummaryContainer) return;
    renderCartSummary();
    attachCheckoutFormEvent();
    updateCartCounter();
}

function initConfirmation() {
    if (!orderSummaryContainer) return;
    const order = JSON.parse(localStorage.getItem("lastOrder"));
    if (!order) {
        orderSummaryContainer.innerHTML = "<p>No order found. Please go back to checkout.</p>";
        return;
    }
    renderOrderSummary(order);
}

//Starting the app by initializing the appropriate page based on the DOM elements present
async function startApp() {
    initCart();
    if (pageContentHome) {
        await initHome();
    } else if (pageContentProducts) {
        await initProducts();
    } else if (productDetailContainer) {
        await initProductDetail();
    } else if (cartSummaryContainer) {
        await initCheckout();
    } else if (orderSummaryContainer) {
        initConfirmation();
    }
}
startApp();