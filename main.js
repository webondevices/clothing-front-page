const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const FEED_URL = "https://strategy.rawnet.com/application/files/5215/8021/3438/products.json";

let basket = [];
let productsData = [];

const TAX_AMOUNT = 0.2;

const productCardTemplate = data => `
  <li class="product-card">
    <div class="card">
      <div class="product-image">
        <img src="${data.imageSrc}" alt="${data.imageAlt}" />
      </div>
      <span class="product-name">${data.productName}</span>
      <span class="product-price">£${data.productPrice}</span>
      <button type="button" data-sku="${data.sku}" class="product-cta">Add to cart</button>
      <button type="button" data-sku="${data.sku}" class="product-view">Quick view</button>
    </div>
  </li>
`;

const basketItemTemplate = data => `
  <li class="basket-list-item">
    <span class="item-name">${data.productName}</span>
    <span class="item-price">${data.productPrice}</span>
    <span class="item-size">${data.productSize}</span>
  </li>
`;

const getProductData = product => ({
  imageSrc: product.images[0].src,
  imageAlt: product.title,
  productName: product.title,
  productPrice: parseFloat(product.variants[0].price),
  sku: product.id,
  productSize: product.variants[0].option1,
  taxable: product.variants[0].taxable
});

const populateFeed = function (products) {
  const feedContainer = document.querySelector('.products-list');
  feedContainer.innerHTML = "";

  products.forEach(product => {
    const templateData = getProductData(product);
    feedContainer.insertAdjacentHTML('beforeend', productCardTemplate(templateData));
  });
};

const loadFeed = function () {
  return fetch(`${CORS_PROXY}${FEED_URL}`)
    .then(response => response.json())
    .then(data => {
      productsData = data.products;
      return data.products;
    });
};

const updateUI = () => {
  // Update basket counters
  const basketCounters = document.querySelectorAll('[data-basket-content]');
  [...basketCounters].forEach(c => {
    c.setAttribute('data-basket-content', basket.length);
  });

  // Update basket
  const basketContainer = document.querySelector('.basket-list');
  basketContainer.innerHTML = "";
  basket.forEach(product => {
    basketContainer.insertAdjacentHTML('beforeend', basketItemTemplate(product));
  });

  // Update totals
  const totalContainer = document.querySelector('.basket-total-price');
  const basketIndicator = document.querySelector('.basket-indicator');
  const addPrice = (acc, product) => acc + product.productPrice;
  const totalPrice = basket.reduce(addPrice, 0);
  totalContainer.innerHTML = `£${totalPrice.toLocaleString()}`;
  basketIndicator.innerHTML = `£${totalPrice.toLocaleString()}`;

  // Update taxes
  const taxContainer = document.querySelector('.basket-total-tax');
  const addTax = (acc, product) => product.taxable ? acc + product.productPrice * TAX_AMOUNT : acc;
  const totalTax = basket.reduce(addTax, 0);
  taxContainer.innerHTML = `Inc. £${totalTax.toFixed(2).toLocaleString()} in taxes`;
};

const handleAddToBasket = function (event) {
  const { sku } = event.target.dataset;
  const product = productsData.find(p => p.id.toString() === sku);
  basket.push(getProductData(product));
  updateUI();
};

const initalise = function () {

  // Load product feed
  loadFeed().then(products => {

    // Populate product feed
    populateFeed(products);

    // Setup Add to cart event listeners
    const productCTAs = document.querySelectorAll('.product-cta');
    [...productCTAs].forEach(cta => {
      cta.addEventListener('click', handleAddToBasket);
    });
  });
};

window.onload = initalise;