const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const FEED_URL = "https://strategy.rawnet.com/application/files/5215/8021/3438/products.json";

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

const populateFeed = function (products) {
  const feedContainer = document.querySelector('.products-list');
  products.forEach(product => {
    const templateData = {
      imageSrc: product.images[0].src,
      imageAlt: product.title,
      productName: product.title,
      productPrice: product.variants[0].price,
      sku: product.id
    };
    feedContainer.insertAdjacentHTML('beforeend', productCardTemplate(templateData));
  });
};

const loadFeed = function () {
  return fetch(`${CORS_PROXY}${FEED_URL}`)
    .then(response => response.json())
    .then(data => data.products);
};

const initalise = function () {
  loadFeed().then(products => populateFeed(products));
};

window.onload = initalise;