const menuData = [
    { id: 1, name: "California Roll Tray", price: 8.50, cat: "Food" },
    { id: 2, name: "Salmon Sashimi Tray", price: 10.00, cat: "Food" },
    { id: 3, name: "Tuna, Egg & Mayo Sandwich", price: 6.50, cat: "Food" },
    { id: 4, name: "Greek Chicken Gyro", price: 7.50, cat: "Hot Food" },
    { id: 5, name: "Caesar Pasta Salad", price: 6.50, cat: "Hot Food" },
    { id: 6, name: "Cup Noodles", price: 4.50, cat: "Hot Food" },
    { id: 7, name: "Spicy Cup Noodles", price: 5.00, cat: "Hot Food" },
    { id: 8, name: "Hotdog", price: 5.50, cat: "Hot Food" },
    { id: 9, name: "Caesar Burger", price: 8.50, cat: "Hot Food" },
    { id: 10, name: "Caesar Wrap", price: 8.50, cat: "Hot Food" },
    { id: 11, name: "Cheese Burger", price: 6.50, cat: "Hot Food" },
    { id: 12, name: "Solo", price: 3.50, cat: "Drinks" },
    { id: 13, name: "Pepsi Max", price: 3.50, cat: "Drinks" },
    { id: 14, name: "Sunkist", price: 3.50, cat: "Drinks" },
    { id: 15, name: "Water", price: 2.50, cat: "Drinks" },
    { id: 16, name: "Chocolate Milk", price: 3.50, cat: "Drinks" },
    { id: 17, name: "Strawberry Milk", price: 3.50, cat: "Drinks" },
    { id: 18, name: "Snap BBQ Flavour", price: 3.50, cat: "Snacks" },
    { id: 19, name: "Zooper Dooper", price: 1.00, cat: "Snacks" },
    { id: 20, name: "Frozen Jelly Sticks", price: 0.50, cat: "Snacks" }
];

let usersDB = JSON.parse(localStorage.getItem('cb_users')) || {};
let isSignupMode = false;
let activeCategory = 'Food';
let currentUserEmail = null;
let cartItems = [];
let cartTotal = 0;
let selectedItem = null;
let selectedQty = 1;
let priceMultiplier = 1.0;

/* --- AUTHENTICATION MODAL LOGIC --- */
function openAuthModal(isSignUp) {
    document.getElementById('auth-screen').style.display = 'flex';
    isSignupMode = isSignUp;
    updateAuthModalUI();
}

function closeAuthModal() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-pass').value = '';
    if (document.getElementById('reg-name')) {
        document.getElementById('reg-name').value = '';
    }
}

function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    updateAuthModalUI();
}

function updateAuthModalUI() {
    document.getElementById('auth-title').innerText = isSignupMode ? "Parent Sign Up" : "Sign In";
    document.getElementById('main-auth-btn').innerText = isSignupMode ? "Register Account" : "Sign In";
    document.getElementById('signup-fields').style.display = isSignupMode ? "block" : "none";
    document.getElementById('toggle-auth-btn').innerText = isSignupMode ? "Already have an account? Sign In" : "Or sign up now";
}

// Generic outside click handler for all modal overlays
function handleOutsideModalClick(event, modalId = 'auth-screen') {
    if (event.target === document.getElementById(modalId)) {
        if (modalId === 'auth-screen') closeAuthModal();
        if (modalId === 'payment-modal') closePaymentModal();
    }
}

/* --- CORE LOGIC --- */
document.getElementById('auth-screen').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') { event.preventDefault(); handleAuth(); }
});

function toggleTheme() {
    const isDark = document.getElementById('theme-toggle').checked;
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if(currentUserEmail && usersDB[currentUserEmail]) {
        usersDB[currentUserEmail].darkMode = isDark;
        localStorage.setItem('cb_users', JSON.stringify(usersDB));
    }
}

function handleAuth() {
    const email = document.getElementById('auth-email').value.toLowerCase();
    const pass = document.getElementById('auth-pass').value;
    const fullName = document.getElementById('reg-name') ? document.getElementById('reg-name').value : '';
    if (!email || !pass) return alert("Missing info.");

    const isStudent = email.endsWith('@education.nsw.gov.au');
    const isTeacher = email.endsWith('@det.nsw.edu.au');
    const isStaff = email.endsWith('@centralbox.com');

    if (isSignupMode) {
        usersDB[email] = { name: fullName || email.split('@')[0], pass: pass, orders: [], identity: "", defaultPickup: "Recess", darkMode: false, favs: [], payments: [], balance: 0 };
        localStorage.setItem('cb_users', JSON.stringify(usersDB));
        toggleAuthMode();
    } else {
        if (isStudent || isTeacher || isStaff) {
            if (!usersDB[email]) {
                // Enforce default pre-registered accounts password to be CVHS
                usersDB[email] = { name: email.split('@')[0], pass: "CVHS", orders: [], identity: "", defaultPickup: "Recess", darkMode: false, favs: [], payments: [], dailyLimit: 50, balance: 50 };
                localStorage.setItem('cb_users', JSON.stringify(usersDB));
            }
            if (usersDB[email].pass !== pass) {
                if (pass === "CVHS") {
                    usersDB[email].pass = "CVHS"; // Update legacy accounts
                    localStorage.setItem('cb_users', JSON.stringify(usersDB));
                } else {
                    return alert("Incorrect password.");
                }
            }
            const firstName = email.split('@')[0].split('.')[0];
            loginUser(email, firstName.charAt(0).toUpperCase() + firstName.slice(1), isStudent, isTeacher, isStaff);
        } else if (usersDB[email] && usersDB[email].pass === pass) {
            loginUser(email, usersDB[email].name, false, false, false);
        } else { alert("Incorrect password or account not found."); }
    }
}

function loginUser(email, name, isStudent, isTeacher, isStaff) {
    currentUserEmail = email;
    const fName = name.split(' ')[0];
    document.getElementById('home-greeting').innerHTML = `Hungry,<br>${fName}?`;
    document.getElementById('user-display-name').innerText = usersDB[email].name || name;
    document.getElementById('user-display-email').innerText = email;
    
    priceMultiplier = (isTeacher || isStaff) ? 0.8 : 1.0;

    const isDark = usersDB[email].darkMode || false;
    document.getElementById('theme-toggle').checked = isDark;
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Load Dietary Preferences from LocalStorage
    document.getElementById('pref-veg').checked = usersDB[email].prefVeg || false;
    document.getElementById('pref-halal').checked = usersDB[email].prefHalal || false;
    document.getElementById('pref-nut').checked = usersDB[email].prefNut !== false;

    // Update Balance Display
    const bal = usersDB[email].balance !== undefined ? usersDB[email].balance : (usersDB[email].dailyLimit !== undefined ? usersDB[email].dailyLimit : 42.50);
    document.getElementById('profile-balance-display').innerText = '$' + bal.toFixed(2);

    // Identity Configurations
    const identityLabel = document.getElementById('identity-section-label');
    const identityCard = document.getElementById('identity-section-card');
    const identitySelect = document.getElementById('profile-identity-select');
    
    if (isStaff || (!isStudent && !isTeacher)) {
        identityLabel.style.display = 'none'; identityCard.style.display = 'none';
    } else if (isTeacher) {
        identityLabel.innerText = 'Faculty'; identityLabel.style.display = 'block'; identityCard.style.display = 'flex';
        identitySelect.innerHTML = '<option value="">Select Faculty</option><option value="Math">Math</option><option value="Science">Science</option><option value="English">English</option><option value="PDHPE">PDHPE</option><option value="Home Economics">Home Economics</option><option value="Industrial Arts">Industrial Arts</option><option value="Performing Arts">Performing Arts</option><option value="Literacy">Literacy</option>';
    } else {
        identityLabel.innerText = 'Identity & Class'; identityLabel.style.display = 'block'; identityCard.style.display = 'flex';
        identitySelect.innerHTML = '<option value="">Select Year Group</option><option value="7">Year 7</option><option value="8">Year 8</option><option value="9">Year 9</option><option value="10">Year 10</option><option value="11">Year 11</option><option value="12">Year 12</option>';
    }
    if (usersDB[email].identity) identitySelect.value = usersDB[email].identity;
    if (usersDB[email].defaultPickup) document.getElementById('settings-default-pickup').value = usersDB[email].defaultPickup;

    // Render Secure Payments & Manage Access
    renderPayments();
    const addPaymentBtn = document.getElementById('add-payment-btn');

    const badge = document.getElementById('role-badge');
    const statsBtn = document.getElementById('stats-card-btn');
    statsBtn.style.display = 'none'; 

    // Display Top Up system condition layout context
    const topupSection = document.getElementById('staff-topup-section');
    if (isTeacher || isStaff) {
        topupSection.style.display = 'block';
    } else {
        topupSection.style.display = 'none';
    }

    // RESET DEFAULT NAV TABS & PROFILE VISIBILITY FIRST
    document.getElementById('nav-tab-1').innerHTML = `<span>🏠</span><span style="font-size:0.5rem; font-weight:900;">HOME</span>`;
    document.getElementById('nav-tab-1').setAttribute("onclick", "switchTab('view-home')");
    document.getElementById('nav-tab-2').innerHTML = `<span>🍔</span><span style="font-size:0.5rem; font-weight:900;">MENU</span>`;
    document.getElementById('nav-tab-2').setAttribute("onclick", "switchTab('view-menu')");
    
    document.getElementById('balance-display-container').style.display = 'flex';
    document.getElementById('fav-orders-btn').style.display = 'block';

    if (isStudent) {
        badge.innerText = "STUDENT";
        badge.style.background = "var(--text-main)";
        document.getElementById('standard-grid').style.display = 'grid';
        document.getElementById('parent-grid').style.display = 'none';
        document.getElementById('parental-ctrl-section').style.display = 'none';
        addPaymentBtn.style.display = 'none'; // Lock student payments
    } else if (isTeacher) { 
        badge.innerText = "TEACHER"; 
        badge.style.background = "var(--text-main)";
        document.getElementById('standard-grid').style.display = 'grid';
        document.getElementById('parent-grid').style.display = 'none';
        document.getElementById('parental-ctrl-section').style.display = 'none';
        addPaymentBtn.style.display = 'block';
    } else if (isStaff) { 
        badge.innerText = "STAFF"; badge.style.background = "var(--staff-theme)"; statsBtn.style.display = 'block'; 
        document.getElementById('standard-grid').style.display = 'grid';
        document.getElementById('parent-grid').style.display = 'none';
        document.getElementById('parental-ctrl-section').style.display = 'none';
        addPaymentBtn.style.display = 'block';

        // STAFF SPECIFIC NAV CHANGE
        document.getElementById('nav-tab-1').innerHTML = `<span>📊</span><span style="font-size:0.5rem; font-weight:900;">STATS</span>`;
        document.getElementById('nav-tab-1').setAttribute("onclick", "switchTab('view-stats')");
        calculateLiveStats();
    } else { 
        badge.innerText = "PARENT"; badge.style.background = "var(--parent-theme)";
        document.getElementById('standard-grid').style.display = 'none';
        document.getElementById('parent-grid').style.display = 'grid';
        document.getElementById('parental-ctrl-section').style.display = 'block';
        addPaymentBtn.style.display = 'block';

        // PARENT SPECIFIC NAV CHANGES
        document.getElementById('nav-tab-1').innerHTML = `<span>👀</span><span style="font-size:0.5rem; font-weight:900;">TRACK ORDERS</span>`;
        document.getElementById('nav-tab-1').setAttribute("onclick", "switchTab('view-parent-orders')");
        document.getElementById('nav-tab-2').innerHTML = `<span>💰</span><span style="font-size:0.5rem; font-weight:900;">LIMITS</span>`;
        document.getElementById('nav-tab-2').setAttribute("onclick", "switchTab('view-parent-limits')");
        
        // PARENT SPECIFIC PROFILE CHANGES
        document.getElementById('balance-display-container').style.display = 'none';
        document.getElementById('fav-orders-btn').style.display = 'none';

        loadParentData();
    }

    document.getElementById('landing-screen').style.display = 'none';
    document.getElementById('view-public-menu').style.display = 'none';
    closeAuthModal();
    document.getElementById('app-header').style.display = 'flex';
    switchTab('view-home');
}

// --- STATS LOGIC ---
function calculateLiveStats() {
    let totalRevenue = 0;
    let totalOrdersCount = 0;
    const currentDB = JSON.parse(localStorage.getItem('cb_users')) || {};
    
    Object.keys(currentDB).forEach(emailKey => {
        const userObj = currentDB[emailKey];
        if (userObj && userObj.orders && Array.isArray(userObj.orders)) {
            userObj.orders.forEach(order => {
                totalRevenue += parseFloat(order.total || 0);
                totalOrdersCount++;
            });
        }
    });

    const revEl = document.getElementById('live-revenue');
    const ordEl = document.getElementById('live-orders');
    if (revEl) revEl.innerText = `$${totalRevenue.toFixed(2)}`;
    if (ordEl) ordEl.innerText = totalOrdersCount;
}

function switchTab(viewId) {
    if (!currentUserEmail && viewId !== 'view-home' && viewId !== 'view-landing' && viewId !== 'view-public-menu') {
        openAuthModal(false); return;
    }

    const isLanding = (viewId === 'view-landing');
    const isPublicMenu = (viewId === 'view-public-menu');
    document.getElementById('landing-screen').style.display = isLanding ? 'flex' : 'none';
    document.getElementById('view-public-menu').style.display = isPublicMenu ? 'block' : 'none';

    document.getElementById('header-logo').style.opacity = (viewId === 'view-home') ? '0' : '1';
    document.getElementById('header-logo').style.pointerEvents = (viewId === 'view-home') ? 'none' : 'auto';

    document.querySelectorAll('main .view').forEach(v => { v.style.display = 'none'; v.classList.remove('active'); });
    const target = document.getElementById(viewId);
    if (target && !isLanding && !isPublicMenu) {
        target.classList.add('active');
        target.style.display = (viewId === 'view-home') ? 'flex' : 'block';
    }
    
    document.getElementById('bottom-nav').style.display = (!isLanding && !isPublicMenu && viewId !== 'view-home') ? 'flex' : 'none';
    
    if(viewId === 'view-menu') renderMenu();
    if(viewId === 'view-orders') renderOrders();
    if(viewId === 'view-checkout') renderCheckout();
    if(viewId === 'view-favorites') renderFavorites();
    if(viewId === 'view-stats') calculateLiveStats();
    
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if (viewId === 'view-home' || viewId === 'view-stats' || viewId === 'view-parent-orders') {
        document.getElementById('nav-tab-1').classList.add('active');
    }
    if (viewId === 'view-menu' || viewId === 'view-checkout' || viewId === 'view-parent-limits') {
        document.getElementById('nav-tab-2').classList.add('active');
    }
    if (viewId === 'view-account') document.getElementById('nav-tab-3').classList.add('active');
    if (viewId === 'view-settings') document.getElementById('nav-tab-4').classList.add('active');
}

/* --- DISCOVER & STAR FAVORITES --- */
function toggleFav(id) {
    if(!usersDB[currentUserEmail].favs) usersDB[currentUserEmail].favs = [];
    let favs = usersDB[currentUserEmail].favs;
    if (favs.includes(id)) favs = favs.filter(f => f !== id);
    else favs.push(id);
    usersDB[currentUserEmail].favs = favs;
    localStorage.setItem('cb_users', JSON.stringify(usersDB));
    renderMenu();
    if(document.getElementById('view-favorites').classList.contains('active')) renderFavorites();
}

function renderPublicMenuCategorized() {
    const container = document.getElementById('public-menu-categorized-container');
    const categories = [...new Set(menuData.map(item => item.cat))]; 
    container.innerHTML = categories.map(cat => {
        const itemsInCat = menuData.filter(i => i.cat === cat);
        return `
            <div style="margin-bottom: 40px; text-align: left;">
                <h2 style="font-size: 1.8rem; margin-bottom: 20px; color: var(--text-main); border-bottom: 2px solid var(--border); padding-bottom: 10px;">${cat}</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    ${itemsInCat.map(item => `<div class="item-card" style="margin-bottom: 0;"><div><h3 style="margin-bottom:5px;">${item.name}</h3></div><p style="color:var(--accent); font-weight:900; font-size:1.2rem;">$${item.price.toFixed(2)}</p></div>`).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderMenu() {
    const list = document.getElementById('menu-items');
    const userFavs = usersDB[currentUserEmail]?.favs || [];
    list.innerHTML = menuData.filter(i => i.cat === activeCategory).map(i => {
        const finalPrice = i.price * priceMultiplier;
        const isFav = userFavs.includes(i.id);
        return `
        <div class="item-card">
            <div>
                <div style="display:flex; align-items:center; gap: 8px;">
                    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(${i.id})">★</button>
                    <h4 style="margin:0;">${i.name}</h4>
                </div>
                <p style="color:var(--accent); font-weight:900; margin-top:5px; margin-left: 32px;">$${finalPrice.toFixed(2)}</p>
            </div>
            <button class="chip active" onclick="openModal(${i.id})">Add</button>
        </div>
    `}).join('');
}

function renderFavorites() {
    const container = document.getElementById('favorites-container');
    const userFavs = usersDB[currentUserEmail]?.favs || [];
    if (userFavs.length === 0) {
        container.innerHTML = '<div class="item-card" style="justify-content: center;"><p style="color: var(--text-muted);">No starred items found.</p></div>';
        return;
    }
    container.innerHTML = menuData.filter(i => userFavs.includes(i.id)).map(i => {
        const finalPrice = i.price * priceMultiplier;
        return `
        <div class="item-card">
            <div>
                <div style="display:flex; align-items:center; gap: 8px;">
                    <button class="fav-btn active" onclick="toggleFav(${i.id})">★</button>
                    <h4 style="margin:0;">${i.name}</h4>
                </div>
                <p style="color:var(--accent); font-weight:900; margin-top:5px; margin-left: 32px;">$${finalPrice.toFixed(2)}</p>
            </div>
            <button class="chip active" onclick="openModal(${i.id})">Order</button>
        </div>
    `}).join('');
}

function filterCat(cat, el) { activeCategory = cat; document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); el.classList.add('active'); renderMenu(); }

/* --- MODAL & CART CALCULATIONS --- */
function openModal(itemId) {
    selectedItem = menuData.find(i => i.id === itemId);
    selectedQty = 1;
    const finalPrice = selectedItem.price * priceMultiplier;
    document.getElementById('modal-item-name').innerText = selectedItem.name;
    document.getElementById('modal-item-price').innerText = `$${finalPrice.toFixed(2)} each`;
    document.getElementById('modal-qty-display').innerText = selectedQty;
    document.getElementById('qty-modal').style.display = 'flex';
}

function changeQty(amount) { selectedQty += amount; if (selectedQty < 1) selectedQty = 1; document.getElementById('modal-qty-display').innerText = selectedQty; }
function closeModal() { document.getElementById('qty-modal').style.display = 'none'; selectedItem = null; }

function addToCart() {
    const finalPrice = selectedItem.price * priceMultiplier;
    const itemTotal = finalPrice * selectedQty;
    
    // Check available balance before adding to cart
    const currentBalance = usersDB[currentUserEmail]?.balance !== undefined ? usersDB[currentUserEmail].balance : (usersDB[currentUserEmail]?.dailyLimit || 50);
    if (cartTotal + itemTotal > currentBalance) {
        alert(`Cannot add item. This exceeds your available balance of $${currentBalance.toFixed(2)}.`);
        closeModal();
        return;
    }

    cartTotal += itemTotal;
    cartItems.push({ name: selectedItem.name, qty: selectedQty, total: itemTotal });
    document.getElementById('cart-total').innerText = `$${cartTotal.toFixed(2)}`;
    closeModal();
}

/* --- CHECKOUT VIEW SYSTEM --- */
function renderCheckout() {
    const itemsContainer = document.getElementById('checkout-items-container');
    if (cartItems.length === 0) {
        itemsContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Your cart is currently empty.</p>';
    } else {
        itemsContainer.innerHTML = cartItems.map((item, index) => `
            <div class="setting-row" style="background:var(--card-bg); padding:15px; border-radius:12px; border:1px solid var(--border); margin-bottom:10px;">
                <span><span style="font-weight:900; color:var(--accent); margin-right:10px;">${item.qty}x</span> ${item.name}</span>
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="font-weight:bold;">$${item.total.toFixed(2)}</span>
                    <button class="del-btn" onclick="removeCartItem(${index})">X</button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('checkout-total').innerText = `$${cartTotal.toFixed(2)}`;

    const date = new Date();
    const isMonday = date.getDay() === 1;
    const pickupSelect = document.getElementById('checkout-pickup-time');
    pickupSelect.innerHTML = isMonday 
        ? `<option value="Recess 10:20">Recess (10:20 AM)</option><option value="Lunch 1:10">Lunch (1:10 PM)</option>`
        : `<option value="Recess 10:15">Recess (10:15 AM)</option><option value="Lunch 1:25">Lunch (1:25 PM)</option>`;

    const userDefault = usersDB[currentUserEmail]?.defaultPickup || "Recess";
    for (let i = 0; i < pickupSelect.options.length; i++) {
        if (pickupSelect.options[i].value.includes(userDefault)) { pickupSelect.selectedIndex = i; break; }
    }
}

function removeCartItem(index) {
    cartTotal -= cartItems[index].total;
    cartItems.splice(index, 1);
    document.getElementById('cart-total').innerText = `$${cartTotal.toFixed(2)}`;
    renderCheckout();
}

function confirmOrder() {
    if (cartTotal === 0) return alert("Your cart is empty!");
    const notes = document.getElementById('dietary-notes').value;
    const pickupTime = document.getElementById('checkout-pickup-time').value;
    
    if (currentUserEmail && usersDB[currentUserEmail]) {
        // Deduct from Balance securely
        const currentBalance = usersDB[currentUserEmail].balance !== undefined ? usersDB[currentUserEmail].balance : (usersDB[currentUserEmail].dailyLimit || 50);
        if (cartTotal > currentBalance) return alert("Insufficient balance to complete the order.");
        
        usersDB[currentUserEmail].balance = currentBalance - cartTotal;
        
        // Update interface with new balance
        const balEl = document.getElementById('profile-balance-display');
        if(balEl) balEl.innerText = '$' + usersDB[currentUserEmail].balance.toFixed(2);

        if (!usersDB[currentUserEmail].orders) usersDB[currentUserEmail].orders = [];
        usersDB[currentUserEmail].orders.unshift({
            id: Math.floor(Math.random() * 1000000),
            date: new Date().toLocaleDateString(),
            total: cartTotal,
            items: cartItems.length,
            notes: notes || "None",
            pickup: pickupTime,
            cart: [...cartItems]
        });
        localStorage.setItem('cb_users', JSON.stringify(usersDB));
    }
    alert(`Order Confirmed for ${pickupTime}! Payment deducted from your account.`);
    cartTotal = 0; cartItems = [];
    document.getElementById('cart-total').innerText = "$0.00";
    document.getElementById('dietary-notes').value = "";
    switchTab('view-orders');
}

function renderOrders() {
    const container = document.getElementById('orders-container');
    const userOrders = usersDB[currentUserEmail]?.orders || [];
    if (userOrders.length === 0) {
        container.innerHTML = '<div class="item-card" style="justify-content: center;"><p style="color: var(--text-muted);">No past orders found.</p></div>';
        return;
    }
    container.innerHTML = userOrders.map(order => `
        <div class="item-card" style="flex-direction: column; align-items: flex-start;">
            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 8px;">
                <h4 style="margin: 0;">Order #${order.id}</h4>
                <p style="color: var(--text-muted); font-size: 0.8rem; font-weight: bold;">${order.date}</p>
            </div>
            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                <p style="font-size: 0.9rem; color: var(--text-muted);">${order.items} items</p>
                <h4 style="color: var(--accent);">$${order.total.toFixed(2)}</h4>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-main); font-weight: 700;">Pickup: ${order.pickup || 'Unknown'}</p>
        </div>
    `).join('');
}

/* --- PREFERENCES AND PERSISTENCE DATA --- */
function saveProfileIdentity(value) {
    if(currentUserEmail && usersDB[currentUserEmail]) {
        usersDB[currentUserEmail].identity = value; localStorage.setItem('cb_users', JSON.stringify(usersDB));
    }
}
function saveDefaultPickup(value) {
    if(currentUserEmail && usersDB[currentUserEmail]) {
        usersDB[currentUserEmail].defaultPickup = value; localStorage.setItem('cb_users', JSON.stringify(usersDB));
    }
}
function savePreferences() {
    if(currentUserEmail && usersDB[currentUserEmail]) {
        usersDB[currentUserEmail].prefVeg = document.getElementById('pref-veg').checked;
        usersDB[currentUserEmail].prefHalal = document.getElementById('pref-halal').checked;
        usersDB[currentUserEmail].prefNut = document.getElementById('pref-nut').checked;
        localStorage.setItem('cb_users', JSON.stringify(usersDB));
    }
}

/* --- NEW SECURE PAYMENTS SYSTEM --- */
function openPaymentModal() {
    document.getElementById('payment-modal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    document.getElementById('cc-name').value = '';
    document.getElementById('cc-num').value = '';
    document.getElementById('cc-exp').value = '';
    document.getElementById('cc-cvc').value = '';
    document.getElementById('cc-zip').value = '';
}

function saveNewPayment() {
    const name = document.getElementById('cc-name').value;
    const num = document.getElementById('cc-num').value;
    const exp = document.getElementById('cc-exp').value;
    const cvc = document.getElementById('cc-cvc').value;

    if(!name || !num || !exp || !cvc) return alert("Please fill out all required card details securely.");
    if(num.length < 4) return alert("Invalid Card Number.");

    const last4 = num.slice(-4);
    if(!usersDB[currentUserEmail].payments) usersDB[currentUserEmail].payments = [];
    usersDB[currentUserEmail].payments.push(last4);
    localStorage.setItem('cb_users', JSON.stringify(usersDB));
    
    renderPayments();
    closePaymentModal();
}

function renderPayments() {
    const list = document.getElementById('payment-methods-list');
    const methods = usersDB[currentUserEmail]?.payments || [];
    if (!list) return;
    if (methods.length === 0) { list.innerHTML = ''; return; }
    list.innerHTML = methods.map((m, i) => `
        <div class="setting-row" style="margin-top:10px; background:var(--bg-color); padding:10px; border-radius:10px;">
            <span style="font-weight:bold;">💳 Visa ending in ${m}</span>
            <button class="del-btn" onclick="removePayment(${i})">Remove</button>
        </div>
    `).join('');
}

function removePayment(index) {
    usersDB[currentUserEmail].payments.splice(index, 1);
    localStorage.setItem('cb_users', JSON.stringify(usersDB));
    renderPayments();
}

/* --- STAFF & TEACHER CUSTOM WALLET TOP UP ACTION --- */
function executeStaffTopUp() {
    const inputEl = document.getElementById('staff-topup-amount');
    const topupVal = parseFloat(inputEl.value);
    
    if (isNaN(topupVal) || topupVal <= 0) {
        return alert("Please specify a valid numeric funding amount.");
    }
    
    const currentPayments = usersDB[currentUserEmail]?.payments || [];
    if (currentPayments.length === 0) {
        return alert("Access Denied: Please hook a secure payment card to your profile configuration context first.");
    }
    
    const currentBal = usersDB[currentUserEmail].balance !== undefined ? usersDB[currentUserEmail].balance : 50.00;
    usersDB[currentUserEmail].balance = currentBal + topupVal;
    localStorage.setItem('cb_users', JSON.stringify(usersDB));
    
    document.getElementById('profile-balance-display').innerText = '$' + usersDB[currentUserEmail].balance.toFixed(2);
    inputEl.value = '';
    alert(`Successfully added $${topupVal.toFixed(2)} to your School Balance!`);
}

/* --- SECURITY ACTION ROUTINES --- */
function appChangePassword() {
    if (!currentUserEmail || !usersDB[currentUserEmail]) return;
    const currentPassPrompt = prompt("Verification context request. Input current password:");
    if (currentPassPrompt !== usersDB[currentUserEmail].pass) {
        return alert("Security Context Error: Credentials authentication failed verification parameters.");
    }
    const newPass = prompt("Specify new authentication password token entry below:");
    if (!newPass || newPass.trim() === "") {
        return alert("Validation Mismatch: Passwords structural bounds cannot be blank entries.");
    }
    usersDB[currentUserEmail].pass = newPass;
    localStorage.setItem('cb_users', JSON.stringify(usersDB));
    alert("Security parameters committed! Authentication verification token redefined safely.");
}

function appClearPaymentInfo() {
    if (!currentUserEmail || !usersDB[currentUserEmail]) return;
    if (!confirm("Are you sure you want to completely flush all secure credit card tokens attached here?")) return;
    
    usersDB[currentUserEmail].payments = [];
    localStorage.setItem('cb_users', JSON.stringify(usersDB));
    renderPayments();
    alert("Card repositories purged securely from temporary storage bounds.");
}

/* --- PARENT CONTROLS & WALLET LINKING --- */
function loadParentData() {
    const linkedEmail = usersDB[currentUserEmail]?.linkedStudent;
    const limit = usersDB[currentUserEmail]?.setLimit || 15;
    document.getElementById('parent-limit-slider').value = limit;
    updateLimitValue(limit);

    if (linkedEmail) {
        document.getElementById('linked-status').style.display = 'block';
        document.getElementById('linked-email-display').innerText = linkedEmail;
        document.getElementById('link-student-email').value = linkedEmail;
        
        const studentOrders = usersDB[linkedEmail]?.orders || [];
        const trackerContainer = document.getElementById('parent-tracker-container');
        if (studentOrders.length > 0) {
            trackerContainer.innerHTML = studentOrders.map(order => `
                <div class="item-card" style="flex-direction: column; align-items: flex-start;">
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 8px;">
                        <h4 style="margin: 0;">Order #${order.id}</h4><p style="color: var(--text-muted); font-size: 0.8rem; font-weight: bold;">${order.date}</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <p style="font-size: 0.9rem; color: var(--text-muted);">${order.items} items</p><h4 style="color: var(--accent);">$${order.total.toFixed(2)}</h4>
                    </div>
                </div>
            `).join('');
        } else {
            trackerContainer.innerHTML = '<div class="item-card" style="text-align: center; display: block; color: var(--text-muted);">No active orders for this student.</div>';
        }
    }
}

function linkStudentAccount() {
    const email = document.getElementById('link-student-email').value.toLowerCase();
    if (!email.endsWith('@education.nsw.gov.au')) return alert("Access Denied: Only student emails with the suffix '@education.nsw.gov.au' are allowed.");
    
    // Create a profile with default password context "CVHS" if it doesn't exist
    if (!usersDB[email]) {
        usersDB[email] = { name: email.split('@')[0], pass: 'CVHS', orders: [], dailyLimit: 15, balance: 15, favs: [], payments: [] };
    }
    
    usersDB[currentUserEmail].linkedStudent = email;
    localStorage.setItem('cb_users', JSON.stringify(usersDB));
    loadParentData();
    alert("Student account successfully linked!");
}

function updateLimitValue(val) { document.getElementById('limit-value').innerText = `$${val}`; }

function saveParentLimit() {
    const limit = parseInt(document.getElementById('parent-limit-slider').value);
    usersDB[currentUserEmail].setLimit = limit;
    
    const linkedStudent = usersDB[currentUserEmail].linkedStudent;
    if (linkedStudent && usersDB[linkedStudent]) {
        // Apply limit directly to the student's usable wallet balance
        usersDB[linkedStudent].dailyLimit = limit;
        usersDB[linkedStudent].balance = limit; 
    }
    
    localStorage.setItem('cb_users', JSON.stringify(usersDB));
    alert(`Limit set to $${limit} and successfully funded to the student account.`);
}

function initApp() {
    renderPublicMenuCategorized(); 
    switchTab('view-landing'); 
}