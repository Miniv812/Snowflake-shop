let cart = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let loadedProducts = []; // Масив збереження товарів під час завантаження


// function updateUI() {
//     const userBlock = document.getElementById('user-block');
//     const adminPanel = document.getElementById('admin-panel');
//     const cartBtn = document.getElementById('cart-btn');

//     if (currentUser) {
//         userBlock.innerHTML = `
//             <span style="color: white; margin-right: 10px;">👤 ${currentUser.full_name} (${currentUser.role})</span>
//             <button class="btn-auth" onclick="logout()">Вийти</button>
//         `;
//         if (cartBtn) cartBtn.style.display = 'inline-block'; // Показуємо кошик тільки залогіненим
//         if (adminPanel) adminPanel.style.display = (currentUser.role === 'Admin') ? 'block' : 'none';
//     } else {
//         userBlock.innerHTML = `
//             <button class="btn-auth" onclick="showAuthModal()">🔑 Увійти / Реєстрація</button>
//         `;
//         if (cartBtn) cartBtn.style.display = 'none'; // Ховаємо кошик незареєстрованим
//         if (adminPanel) adminPanel.style.display = 'none';
//     }
// }

function updateUI() {
    const userBlock = document.getElementById('user-block');
    const adminPanel = document.getElementById('admin-panel');
    const cartBtn = document.getElementById('cart-btn');

    if (currentUser) {
        userBlock.innerHTML = `
            <span style="color: white; margin-right: 10px;">👤 ${currentUser.full_name} (${currentUser.role})</span>
            <button class="btn-auth" onclick="logout()">Вийти</button>
        `;
        
        // Повністю ховаємо кошик для ролі Admin, показуємо тільки звичайному покупцю (Customer)
        if (cartBtn) {
            cartBtn.style.display = (currentUser.role === 'Admin') ? 'none' : 'inline-block';
        }
        if (adminPanel) {
            adminPanel.style.display = (currentUser.role === 'Admin') ? 'block' : 'none';
        }
    } else {
        userBlock.innerHTML = `
            <button class="btn-auth" onclick="showAuthModal()">🔑 Увійти / Реєстрація</button>
        `;
        if (cartBtn) cartBtn.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
    }
}




// async function loadProducts() {
//     const search = document.getElementById('search-input').value;
//     const tempFilter = document.getElementById('temp-filter').value;
//     const minPrice = document.getElementById('min-price').value;
//     const maxPrice = document.getElementById('max-price').value;
//     const material = document.getElementById('material-input')?.value || '';
//     const size = document.getElementById('size-input')?.value || '';

//     let params = new URLSearchParams();
//     if (search) params.append('search', search);
//     if (tempFilter) params.append('temp_min', tempFilter);
//     if (minPrice) params.append('min_price', minPrice);
//     if (maxPrice) params.append('max_price', maxPrice);
//     if (material) params.append('material', material);
//     if (size) params.append('size', size);

//     const response = await fetch(`/api/v1/catalog/products?${params.toString()}`);
//     loadedProducts = await response.json();

//     const grid = document.getElementById('products-grid');
//     grid.innerHTML = '';

//     if (loadedProducts.length === 0) {
//         grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Товарів за вказаними фільтрами не знайдено.</p>';
//         return;
//     }


//     loadedProducts.forEach(p => {
//         // 1. Перевіряємо наявність на складі
//         const inStock = p.stock_quantity > 0;
//         const buyButtonHtml = inStock 
//             ? `<button onclick="addToCartById(${p.id})">У кошик</button>`
//             : `<button disabled class="btn-disabled">Немає в наявності</button>`;

//         // 2. Додаємо кнопку видалення для Адміністратора
//         const adminDeleteBtnHtml = (currentUser && currentUser.role === 'Admin')
//             ? `<button class="btn-delete" onclick="deleteProductById(${p.id})">🗑️ Видалити товар</button>`
//             : '';

//         grid.innerHTML += `
//             <div class="product-card ${!inStock ? 'out-of-stock-card' : ''}">
//                 <div>
//                     <span class="badge">до ${p.temp_min}°C</span>
//                     <h3>${p.name}</h3>
//                     <p style="font-size: 0.85em; color: #666;">${p.description}</p>
//                     <p style="font-size: 0.9em;"><strong>Матеріал:</strong> ${p.material}</p>
//                     <p style="font-size: 0.9em;"><strong>Розміри:</strong> ${p.size_grid}</p>
//                     <p style="font-size: 1em; color: #27ae60;"><strong>${p.price} грн</strong></p>
//                     <p style="font-size: 0.8em; color: ${inStock ? '#888' : '#e74c3c'}; font-weight: ${inStock ? 'normal' : 'bold'};">
//                         ${inStock ? 'В наявності: ' + p.stock_quantity + ' шт.' : 'Залишок: 0 шт.'}
//                     </p>
//                 </div>
//                 <div>
//                     ${buyButtonHtml}
//                     ${adminDeleteBtnHtml}
//                 </div>
//             </div>
//         `;
//     });
// }





// async function loadProducts() {
//     const search = document.getElementById('search-input').value;
//     const tempFilter = document.getElementById('temp-filter').value;
//     const minPrice = document.getElementById('min-price').value;
//     const maxPrice = document.getElementById('max-price').value;
//     const material = document.getElementById('material-input')?.value || '';
//     const size = document.getElementById('size-input')?.value || '';
//     const color = document.getElementById('color-input')?.value || '';

//     let params = new URLSearchParams();
//     if (search) params.append('search', search);
//     if (tempFilter) params.append('temp_min', tempFilter);
//     if (minPrice) params.append('min_price', minPrice);
//     if (maxPrice) params.append('max_price', maxPrice);
//     if (material) params.append('material', material);
//     if (size) params.append('size', size);
//     if (color) params.append('color', color);

//     const response = await fetch(`/api/v1/catalog/products?${params.toString()}`);
//     loadedProducts = await response.json();

//     const grid = document.getElementById('products-grid');
//     grid.innerHTML = '';

//     if (loadedProducts.length === 0) {
//         grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Товарів за вказаними фільтрами не знайдено.</p>';
//         return;
//     }

//     const isAdmin = currentUser && currentUser.role === 'Admin';

//     loadedProducts.forEach(p => {
//         const inStock = p.stock_quantity > 0;
        
//         // Для Адміністратора кнопка "У кошик" НЕ відображається взагалі
//         let buyButtonHtml = '';
//         if (!isAdmin) {
//             buyButtonHtml = inStock 
//                 ? `<button onclick="addToCartById(${p.id})">У кошик</button>`
//                 : `<button disabled class="btn-disabled">Немає в наявності</button>`;
//         }

//         const adminDeleteBtnHtml = isAdmin
//             ? `<button class="btn-delete" onclick="deleteProductById(${p.id})">🗑️ Видалити товар</button>`
//             : '';

//         grid.innerHTML += `
//             <div class="product-card ${!inStock ? 'out-of-stock-card' : ''}">
//                 <div>
//                     <span class="badge">до ${p.temp_min}°C</span>
//                     <h3>${p.name}</h3>
//                     <p style="font-size: 0.85em; color: #666;">${p.description}</p>
//                     <p style="font-size: 0.9em;"><strong>Матеріал:</strong> ${p.material}</p>
//                     <p style="font-size: 0.9em;"><strong>Колір:</strong> ${p.color}</p>
//                     <p style="font-size: 0.9em;"><strong>Розміри:</strong> ${p.size_grid}</p>
//                     <p style="font-size: 1em; color: #27ae60;"><strong>${p.price} грн</strong></p>
//                     <p style="font-size: 0.8em; color: ${inStock ? '#888' : '#e74c3c'}; font-weight: ${inStock ? 'normal' : 'bold'};">
//                         ${inStock ? 'В наявності: ' + p.stock_quantity + ' шт.' : 'Залишок: 0 шт.'}
//                     </p>
//                 </div>
//                 <div>
//                     ${buyButtonHtml}
//                     ${adminDeleteBtnHtml}
//                 </div>
//             </div>
//         `;
//     });
// }



// async function loadProducts() {
//     const search = document.getElementById('search-input').value;
//     const tempFilter = document.getElementById('temp-filter').value;
//     const minPrice = document.getElementById('min-price').value;
//     const maxPrice = document.getElementById('max-price').value;
//     const material = document.getElementById('material-input')?.value || '';
//     const size = document.getElementById('size-input')?.value || '';
//     const color = document.getElementById('color-input')?.value || '';
//     const minVal = parseInt(document.getElementById('temp-range-min')?.value || 5);
//     const maxVal = parseInt(document.getElementById('temp-range-max')?.value || 40);
//     const tempFrom = -Math.min(minVal, maxVal); // Наприклад, -5
//     const tempTo = -Math.max(minVal, maxVal);   // Наприклад, -40

//     let params = new URLSearchParams();
//     if (search) params.append('search', search);
//     params.append('temp_from', tempFrom);
//     params.append('temp_to', tempTo);
//     if (tempFilter) params.append('temp_min', tempFilter);
//     if (minPrice) params.append('min_price', minPrice);
//     if (maxPrice) params.append('max_price', maxPrice);
//     if (material) params.append('material', material);
//     if (size) params.append('size', size);
//     if (color) params.append('color', color);

//     const response = await fetch(`/api/v1/catalog/products?${params.toString()}`);
//     loadedProducts = await response.json();

//     const grid = document.getElementById('products-grid');
//     grid.innerHTML = '';

//     if (loadedProducts.length === 0) {
//         grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Товарів за вказаними фільтрами не знайдено.</p>';
//         return;
//     }

//     const isAdmin = currentUser && currentUser.role === 'Admin';

//     loadedProducts.forEach(p => {
//         const inStock = p.stock_quantity > 0;
        
//         // Розбиваємо доступні розміри та кольори у списки для селекту
//         const sizes = p.size_grid.split(',').map(s => s.trim());
//         const colors = p.color.split(',').map(c => c.trim());

//         const sizeOptionsHtml = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
//         const colorOptionsHtml = colors.map(c => `<option value="${c}">${c}</option>`).join('');

//         let buyButtonHtml = '';
//         if (!isAdmin) {
//             buyButtonHtml = inStock 
//                 ? `<button onclick="addToCartById(${p.id})">У кошик</button>`
//                 : `<button disabled class="btn-disabled">Немає в наявності</button>`;
//         }

//         const adminDeleteBtnHtml = isAdmin
//             ? `<button class="btn-delete" onclick="deleteProductById(${p.id})">🗑️ Видалити товар</button>`
//             : '';

//         const imageHtml = p.image_url
//             ? `<div class="product-img-wrapper"><img src="${p.image_url}" alt="${p.name}"></div>`
//             : `<div class="product-img-wrapper"><div class="product-img-placeholder"><span>🧥</span><small>Фото товару</small></div></div>`;

//         grid.innerHTML += `
//             <div class="product-card ${!inStock ? 'out-of-stock-card' : ''}">
//                 <div>
//                     <span class="badge">до ${p.temp_min}°C</span>
//                     <h3>${p.name}</h3>
//                     <p style="font-size: 0.85em; color: #666;">${p.description}</p>
//                     <p style="font-size: 0.9em;"><strong>Матеріал:</strong> ${p.material}</p>
                    
//                     ${!isAdmin && inStock ? `
//                         <div style="margin: 8px 0;">
//                             <label style="font-size: 0.8em; font-weight: bold;">Колір:</label>
//                             <select id="color-select-${p.id}" style="width: 100%; padding: 4px; margin-bottom: 5px; border-radius: 4px; border: 1px solid #ccc;">
//                                 ${colorOptionsHtml}
//                             </select>
                            
//                             <label style="font-size: 0.8em; font-weight: bold;">Розмір:</label>
//                             <select id="size-select-${p.id}" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
//                                 ${sizeOptionsHtml}
//                             </select>
//                         </div>
//                     ` : `
//                         <p style="font-size: 0.85em;"><strong>Кольори:</strong> ${p.color}</p>
//                         <p style="font-size: 0.85em;"><strong>Розміри:</strong> ${p.size_grid}</p>
//                     `}

//                     <p style="font-size: 1em; color: #27ae60;"><strong>${p.price} грн</strong></p>
//                     <p style="font-size: 0.8em; color: ${inStock ? '#888' : '#e74c3c'}; font-weight: ${inStock ? 'normal' : 'bold'};">
//                         ${inStock ? 'В наявності: ' + p.stock_quantity + ' шт.' : 'Залишок: 0 шт.'}
//                     </p>
//                 </div>
//                 <div>
//                     ${buyButtonHtml}
//                     ${adminDeleteBtnHtml}
//                 </div>
//             </div>
//         `;
//     });
// }




async function loadProducts() {
    const search = document.getElementById('search-input')?.value || '';
    const minVal = parseInt(document.getElementById('temp-range-min')?.value || 5);
    const maxVal = parseInt(document.getElementById('temp-range-max')?.value || 40);
    const tempFrom = -Math.min(minVal, maxVal);
    const tempTo = -Math.max(minVal, maxVal);
    const minPrice = document.getElementById('min-price')?.value || '';
    const maxPrice = document.getElementById('max-price')?.value || '';
    const material = document.getElementById('material-input')?.value || '';
    const size = document.getElementById('size-input')?.value || '';
    const color = document.getElementById('color-input')?.value || '';

    let params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('temp_from', tempFrom);
    params.append('temp_to', tempTo);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    if (material) params.append('material', material);
    if (size) params.append('size', size);
    if (color) params.append('color', color);

    const grid = document.getElementById('products-grid');

    try {
        const response = await fetch(`/api/v1/catalog/products?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        loadedProducts = await response.json();
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Не удалось загрузить товары. Проверьте консоль браузера (F12).</p>`;
        return;
    }

    grid.innerHTML = '';

    if (loadedProducts.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Товарів за вказаними фільтрами не знайдено.</p>';
        return;
    }

    const isAdmin = currentUser && currentUser.role === 'Admin';

    loadedProducts.forEach(p => {
        const inStock = p.stock_quantity > 0;
        const sizes = (p.size_grid || 'Universal').split(',').map(s => s.trim());
        const colors = (p.color || 'Чорний').split(',').map(c => c.trim());

        const sizeOptionsHtml = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        const colorOptionsHtml = colors.map(c => `<option value="${c}">${c}</option>`).join('');

        const imageHtml = p.image_url
            ? `<div class="product-img-wrapper"><img src="${p.image_url}" alt="${p.name}"></div>`
            : `<div class="product-img-wrapper"><div class="product-img-placeholder"><span>🧥</span><small>Фото товару</small></div></div>`;

        let buyButtonHtml = '';
        if (!isAdmin) {
            buyButtonHtml = inStock
                ? `<button onclick="addToCartById(${p.id})">У кошик</button>`
                : `<button disabled class="btn-disabled">Немає в наявності</button>`;
        }

        const adminDeleteBtnHtml = isAdmin
            ? 
            `<button class="btn-edit" onclick="openEditModal(${p.id})">✏️ Змінити товар</button>
            <button class="btn-delete" onclick="deleteProductById(${p.id})">🗑️ Видалити товар</button>`
            : '';

        grid.innerHTML += `
            <div class="product-card ${!inStock ? 'out-of-stock-card' : ''}">
                <div>
                    ${imageHtml}
                    <span class="badge">до ${p.temp_min}°C</span>
                    <h3>${p.name}</h3>
                    <p style="font-size: 0.85em; color: #666;">${p.description || ''}</p>
                    <p style="font-size: 0.9em;"><strong>Матеріал:</strong> ${p.material}</p>

                    ${!isAdmin && inStock ? `
                        <div style="margin: 8px 0;">
                            <label style="font-size: 0.8em; font-weight: bold;">Колір:</label>
                            <select id="color-select-${p.id}" style="width: 100%; padding: 4px; margin-bottom: 5px; border-radius: 4px; border: 1px solid #ccc;">
                                ${colorOptionsHtml}
                            </select>
                            <label style="font-size: 0.8em; font-weight: bold;">Розмір:</label>
                            <select id="size-select-${p.id}" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
                                ${sizeOptionsHtml}
                            </select>
                        </div>
                    ` : `
                        <p style="font-size: 0.85em;"><strong>Кольори:</strong> ${p.color}</p>
                        <p style="font-size: 0.85em;"><strong>Розміри:</strong> ${p.size_grid}</p>
                    `}

                    <p style="font-size: 1em; color: #27ae60;"><strong>${p.price} грн</strong></p>
                    <p style="font-size: 0.8em; color: ${inStock ? '#888' : '#e74c3c'}; font-weight: ${inStock ? 'normal' : 'bold'};">
                        ${inStock ? 'В наявності: ' + p.stock_quantity + ' шт.' : 'Залишок: 0 шт.'}
                    </p>
                </div>
                <div>
                    ${buyButtonHtml}
                    ${adminDeleteBtnHtml}
                </div>
            </div>
        `;
    });
}






function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('temp-filter').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    if (document.getElementById('material-input')) document.getElementById('material-input').value = '';
    if (document.getElementById('size-input')) document.getElementById('size-input').value = '';
    if (document.getElementById('color-input')) document.getElementById('color-input').value = '';
    if (document.getElementById('temp-range-min')) document.getElementById('temp-range-min').value = 5;
    if (document.getElementById('temp-range-max')) document.getElementById('temp-range-max').value = 40;
    handleTempSlider();
    loadProducts();
}

/* Робота з кошиком */
function addToCart(id, name, price) {
    const existing = cart.find(item => item.product_id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ product_id: id, name, price, selected_size: 'L', quantity: 1 });
    }
    updateCartCount();
    alert(`Товар "${name}" додано до кошика!`);
}

// function updateCartCount() {
//     const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
//     document.getElementById('cart-count').innerText = totalCount;
// }


function updateCartCount() {
    document.getElementById('cart-count').innerText = cart.length;
}


// Нова безпечна функція додавання в кошик за ID
// function addToCartById(id) {
//     if (!currentUser) {
//         alert('Для додавання товарів у кошик необхідно увійти в акаунт!');
//         showAuthModal();
//         return;
//     }
//     const product = loadedProducts.find(p => p.id === id);
//     if (!product) return;

//     const existing = cart.find(item => item.product_id === id);
//     if (existing) {
//         existing.quantity += 1;
//     } else {
//         cart.push({ product_id: product.id, name: product.name, price: product.price, selected_size: 'L', quantity: 1 });
//     }
//     updateCartCount();
//     alert(`Товар "${product.name}" додано до кошика!`);
// }


// function addToCartById(id) {
//     if (currentUser && currentUser.role === 'Admin') {
//         alert('Адміністратор не здійснює покупки з ролі Admin!');
//         return;
//     }
//     if (!currentUser) {
//         alert('Для додавання товарів у кошик необхідно увійти в акаунт!');
//         showAuthModal();
//         return;
//     }
//     const product = loadedProducts.find(p => p.id === id);
//     if (!product) return;

//     const existing = cart.find(item => item.product_id === id);
//     if (existing) {
//         existing.quantity += 1;
//     } else {
//         cart.push({ product_id: product.id, name: product.name, price: product.price, selected_size: 'L', quantity: 1 });
//     }
//     updateCartCount();
//     alert(`Товар "${product.name}" додано до кошика!`);
// }





function addToCartById(id) {
    if (currentUser && currentUser.role === 'Admin') return;
    if (!currentUser) {
        alert('Для додавання товарів у кошик необхідно увійти в акаунт!');
        showAuthModal();
        return;
    }
    const product = loadedProducts.find(p => p.id === id);
    if (!product) return;

    const selectedColor = document.getElementById(`color-select-${id}`)?.value || product.color.split(',')[0].trim();
    const selectedSize = document.getElementById(`size-select-${id}`)?.value || product.size_grid.split(',')[0].trim();

    // Кожен вибір конкретної речі додається окремим позиційним елементом (1 шт.)
    cart.push({
        cart_item_id: Date.now() + Math.random(),
        product_id: product.id,
        name: product.name,
        price: product.price,
        selected_size: selectedSize,
        selected_color: selectedColor
    });

    updateCartCount();
    alert(`Товар "${product.name}" (${selectedColor}, розмір ${selectedSize}) додано до кошика!`);
}


function openCartModal() {
    if (!currentUser) return;
    document.getElementById('checkout-user-name').innerText = currentUser.full_name;
    document.getElementById('checkout-user-email').innerText = currentUser.email;
    renderCartItems();
    document.getElementById('cart-modal').style.display = 'flex';
}


function closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
}

// function renderCartItems() {
//     const container = document.getElementById('cart-items-container');
//     container.innerHTML = '';

//     if (cart.length === 0) {
//         container.innerHTML = '<p style="text-align: center; color: #777;">Кошик порожній</p>';
//         document.getElementById('cart-total-price').innerText = '0';
//         return;
//     }

//     let total = 0;
//     cart.forEach((item, index) => {
//         const itemSum = item.price * item.quantity;
//         total += itemSum;
//         container.innerHTML += `
//             <div class="cart-item-row">
//                 <div>
//                     <strong>${item.name}</strong><br>
//                     <small>${item.price} грн x ${item.quantity} = ${itemSum} грн</small>
//                 </div>
//                 <div>
//                     <button class="cart-qty-btn" onclick="changeQty(${index}, -1)">-</button>
//                     <span style="margin: 0 5px;">${item.quantity}</span>
//                     <button class="cart-qty-btn" onclick="changeQty(${index}, 1)">+</button>
//                     <button style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; margin-left: 10px; cursor: pointer;" onclick="removeFromCart(${index})">🗑️</button>
//                 </div>
//             </div>
//         `;
//     });
//     document.getElementById('cart-total-price').innerText = total.toFixed(2);
// }



function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #777;">Кошик порожній</p>';
        document.getElementById('cart-total-price').innerText = '0';
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        container.innerHTML += `
            <div class="cart-item-row">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>Колір: ${item.selected_color} | Розмір: ${item.selected_size}</small><br>
                    <small style="color: #27ae60; font-weight: bold;">${item.price} грн</small>
                </div>
                <div>
                    <button style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;" onclick="removeFromCart(${index})">🗑️ Видалити</button>
                </div>
            </div>
        `;
    });
    document.getElementById('cart-total-price').innerText = total.toFixed(2);
}



function handleTempSlider() {
    const minSlider = document.getElementById('temp-range-min');
    const maxSlider = document.getElementById('temp-range-max');
    let minVal = parseInt(minSlider.value);
    let maxVal = parseInt(maxSlider.value);

    // Не дозволяємо повзункам перетинатися
    if (minVal > maxVal) {
        [minVal, maxVal] = [maxVal, minVal];
    }

    document.getElementById('temp-from-label').innerText = `-${minVal}°C`;
    document.getElementById('temp-to-label').innerText = `-${maxVal}°C`;

    // Зафарбовуємо активну смужку між повзунками
    const percent1 = ((minVal - 5) / 35) * 100;
    const percent2 = ((maxVal - 5) / 35) * 100;
    const track = document.getElementById('temp-slider-track');
    if (track) {
        track.style.background = `linear-gradient(to right, #e0e0e0 ${percent1}%, #27ae60 ${percent1}%, #27ae60 ${percent2}%, #e0e0e0 ${percent2}%)`;
    }

    loadProducts();
}




function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartCount();
    renderCartItems();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    renderCartItems();
}

// async function submitOrder(event) {
//     event.preventDefault();
//     if (cart.length === 0) {
//         alert('Додайте товари у кошик перед оформленням!');
//         return;
//     }

//     const email = document.getElementById('email').value;
//     const address = document.getElementById('address').value;

//     const payload = {
//         user_email: email,
//         delivery_address: address,
//         items: cart.map(item => ({
//             product_id: item.product_id,
//             quantity: item.quantity,
//             selected_size: item.selected_size
//         }))
//     };

//     const response = await fetch('/api/v1/orders', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//     });

//     const result = await response.json();
//     if (response.ok) {
//         document.getElementById('order-message').innerHTML = `
//             <p style="color: green;"><strong>Успішно!</strong> Замовлення #${result.order_id} оформлено на суму ${result.total_amount} грн.</p>
//         `;
//         cart = [];
//         updateCartCount();
//         renderCartItems();
//         loadProducts(); // Оновлюємо залишки на сторінці
//     } else {
//         document.getElementById('order-message').innerHTML = `
//             <p style="color: red;"><strong>Помилка:</strong> ${result.detail}</p>
//         `;
//     }
// }



// async function submitOrder(event) {
//     event.preventDefault();
//     if (!currentUser) {
//         alert('Будь ласка, увійдіть у систему');
//         return;
//     }
//     if (cart.length === 0) {
//         alert('Додайте товари у кошик перед оформленням!');
//         return;
//     }

//     const address = document.getElementById('address').value;

//     const payload = {
//         user_email: currentUser.email, // Автоматично беремо з профілю
//         delivery_address: address,
//         items: cart.map(item => ({
//             product_id: item.product_id,
//             quantity: item.quantity,
//             selected_size: item.selected_size
//         }))
//     };

//     const response = await fetch('/api/v1/orders', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//     });

//     const result = await response.json();
//     if (response.ok) {
//         document.getElementById('order-message').innerHTML = `
//             <p style="color: green;"><strong>Успішно!</strong> Замовлення #${result.order_id} оформлено на суму ${result.total_amount} грн.</p>
//         `;
//         cart = [];
//         updateCartCount();
//         renderCartItems();
//         loadProducts();
//     } else {
//         document.getElementById('order-message').innerHTML = `
//             <p style="color: red;"><strong>Помилка:</strong> ${result.detail}</p>
//         `;
//     }
// }



async function submitOrder(event) {
    event.preventDefault();
    if (!currentUser) return;
    if (cart.length === 0) {
        alert('Додайте товари у кошик перед оформленням!');
        return;
    }

    const p1 = document.getElementById('phone-1').value.trim();
    const p2 = document.getElementById('phone-2').value.trim();
    const p3 = document.getElementById('phone-3').value.trim();
    const p4 = document.getElementById('phone-4').value.trim();

    if (!/^\d{2}$/.test(p1) || !/^\d{3}$/.test(p2) || !/^\d{2}$/.test(p3) || !/^\d{2}$/.test(p4)) {
        alert('Введіть коректний номер телефону у форматі +380 XX XXX XX XX');
        return;
    }

    const phone = `+380 ${p1} ${p2} ${p3} ${p4}`;
    const address = document.getElementById('address').value;

    const payload = {
        user_email: currentUser.email,
        phone: phone, // Передаємо телефон
        delivery_address: address,
        items: cart.map(item => ({
            product_id: item.product_id,
            selected_size: item.selected_size,
            selected_color: item.selected_color
        }))
    };

    const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok) {
        document.getElementById('order-message').innerHTML = `
            <p style="color: green;"><strong>Успішно!</strong> Замовлення #${result.order_id} оформлено на суму ${result.total_amount} грн.</p>
        `;
        cart = [];
        updateCartCount();
        renderCartItems();
        loadProducts();
    } else {
        document.getElementById('order-message').innerHTML = `
            <p style="color: red;"><strong>Помилка:</strong> ${result.detail}</p>
        `;
    }
}







/* Логіка авторизації */
// async function createProduct(event) {
//     event.preventDefault();
//     const payload = {
//         name: document.getElementById('p-name').value,
//         price: parseFloat(document.getElementById('p-price').value),
//         material: document.getElementById('p-material').value,
//         temp_min: parseInt(document.getElementById('p-temp').value),
//         size_grid: document.getElementById('p-size').value,
//         stock_quantity: parseInt(document.getElementById('p-stock').value),
//         description: document.getElementById('p-desc').value
//     };

//     const response = await fetch('/api/v1/catalog/products', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//     });

//     if (response.ok) {
//         alert('Новий товар успішно додано у докер-базу PostgreSQL!');
//         loadProducts();
//     }
// }




// async function createProduct(event) {
//     event.preventDefault();
//     const payload = {
//         name: document.getElementById('p-name').value,
//         price: parseFloat(document.getElementById('p-price').value),
//         material: document.getElementById('p-material').value,
//         color: document.getElementById('p-color').value,
//         temp_min: parseInt(document.getElementById('p-temp').value),
//         size_grid: document.getElementById('p-size').value,
//         stock_quantity: parseInt(document.getElementById('p-stock').value),
//         description: document.getElementById('p-desc').value
//     };

//     const response = await fetch('/api/v1/catalog/products', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//     });

//     if (response.ok) {
//         alert('Новий товар успішно додано!');
//         loadProducts();
//     }
// }





function compressImageToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 450;
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function createProduct(event) {
    event.preventDefault();
    const fileInput = document.getElementById('p-image');
    let imageBase64 = null;

    if (fileInput && fileInput.files.length > 0) {
        imageBase64 = await compressImageToBase64(fileInput.files[0]);
    }

    const payload = {
        name: document.getElementById('p-name').value,
        price: parseFloat(document.getElementById('p-price').value),
        material: document.getElementById('p-material').value,
        color: document.getElementById('p-color').value,
        temp_min: parseInt(document.getElementById('p-temp').value),
        size_grid: document.getElementById('p-size').value,
        stock_quantity: parseInt(document.getElementById('p-stock').value),
        description: document.getElementById('p-desc').value,
        image_url: imageBase64
    };

    const response = await fetch('/api/v1/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert('Новий товар успішно додано!');
        event.target.reset();
        loadProducts();
    }
}







async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        hideAuthModal();
        updateUI();
    } else {
        document.getElementById('auth-error').innerText = data.detail;
    }
}


// Функція видалення товару
async function deleteProductById(id) {
    if (!confirm('Ви дійсно бажаєте видалити цей товар із докер-бази?')) return;
    
    const response = await fetch(`/api/v1/catalog/products/${id}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        alert('Товар успішно видалено!');
        loadProducts();
    } else {
        alert('Помилка видалення товару');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password })
    });

    if (response.ok) {
        alert('Акаунт створено! Тепер увійдіть.');
        switchTab('login');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUI();
}

function showAuthModal() { document.getElementById('auth-modal').style.display = 'flex'; }
function hideAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }
function switchTab(tab) {
    if (tab === 'login') {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('tab-login-btn').classList.add('active');
        document.getElementById('tab-reg-btn').classList.remove('active');
    } else {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('tab-login-btn').classList.remove('active');
        document.getElementById('tab-reg-btn').classList.add('active');
    }
}



function openEditModal(id) {
    const product = loadedProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('edit-p-id').value = product.id;
    document.getElementById('edit-p-name').value = product.name;
    document.getElementById('edit-p-price').value = product.price;
    document.getElementById('edit-p-stock').value = product.stock_quantity;
    document.getElementById('edit-p-material').value = product.material;
    document.getElementById('edit-p-color').value = product.color;
    document.getElementById('edit-p-temp').value = product.temp_min;
    document.getElementById('edit-p-size').value = product.size_grid;
    document.getElementById('edit-p-desc').value = product.description || '';
    document.getElementById('edit-p-image').value = '';

    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

async function updateProduct(event) {
    event.preventDefault();
    const id = document.getElementById('edit-p-id').value;
    const fileInput = document.getElementById('edit-p-image');
    let imageBase64 = null;

    if (fileInput && fileInput.files.length > 0) {
        imageBase64 = await compressImageToBase64(fileInput.files[0]);
    }

    const payload = {
        name: document.getElementById('edit-p-name').value,
        price: parseFloat(document.getElementById('edit-p-price').value),
        stock_quantity: parseInt(document.getElementById('edit-p-stock').value),
        material: document.getElementById('edit-p-material').value,
        color: document.getElementById('edit-p-color').value,
        temp_min: parseInt(document.getElementById('edit-p-temp').value),
        size_grid: document.getElementById('edit-p-size').value,
        description: document.getElementById('edit-p-desc').value,
        image_url: imageBase64
    };

    const response = await fetch(`/api/v1/catalog/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        alert('Зміни успішно збережено!');
        closeEditModal();
        loadProducts();
    } else {
        alert('Помилка при оновленні товару');
    }
}


function initPhoneInputs() {
    const parts = Array.from(document.querySelectorAll('.phone-part'));
    parts.forEach((input, idx) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '');
            if (input.value.length === input.maxLength && idx < parts.length - 1) {
                parts[idx + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value.length === 0 && idx > 0) {
                parts[idx - 1].focus();
            }
        });
    });
}

initPhoneInputs();



updateUI();
// loadProducts();
handleTempSlider();