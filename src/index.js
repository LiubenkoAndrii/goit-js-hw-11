import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');

loadMoreBtn.remove();

let currentSearchQuery = '';
let page = 1;
const perPage = 40;
let totalHits = 0;
let hits = [];
let isLoading = false;
let isFirstSearch = true;

searchForm.addEventListener('submit', handleSearch);
loadMoreBtn.addEventListener('click', loadMoreImages);
window.addEventListener('scroll', handleScroll);

async function handleSearch(event) {
  event.preventDefault();
  endMessageDisplayed = false;
  gallery.innerHTML = '';
  const searchQuery = event.target.elements.searchQuery.value.trim();
  if (searchQuery === '') {
    Notiflix.Notify.failure('Please enter a search query.');
    return;
  }
  currentSearchQuery = searchQuery;
  page = 1;
  totalHits = 0;
  hits = [];
  isFirstSearch = true;
  loadMoreBtn.classList.remove('hidden');
  window.scrollTo(0, 0);
  await fetchImages();
}

async function fetchImages() {
  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: '36817404-47f661a18c4ba676724276e01',
        q: currentSearchQuery,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        page: page,
        per_page: perPage,
      },
    });
    const { hits: newHits, totalHits: responseTotalHits } = response.data;
    totalHits = responseTotalHits;
    if (newHits.length === 0) {
      loadMoreBtn.classList.add('hidden');
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    if (isFirstSearch) {
      Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
      isFirstSearch = false;
    }
    hits.push(...newHits);
    renderImages(newHits);
    page++;
  } catch (error) {
    console.log('Error:', error);
    Notiflix.Notify.failure('Something went wrong. Please try again later.');
  }
}

function renderImages(images) {
  const galleryMarkup = images
    .map(
      image => `
      <a href="${image.largeImageURL}" class="photo-card">
        <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
        <div class="info">
          <p class="info-item"><b>Likes:</b> ${image.likes}</p>
          <p class="info-item"><b>Views:</b> ${image.views}</p>
          <p class="info-item"><b>Comments:</b> ${image.comments}</p>
          <p class="info-item"><b>Downloads:</b> ${image.downloads}</p>
        </div>
      </a>
    `
    )
    .join('');
  gallery.insertAdjacentHTML('beforeend', galleryMarkup);

  const lightbox = new SimpleLightbox('.gallery a');
  lightbox.refresh();
}

async function loadMoreImages() {
  if (isLoading || page > Math.ceil(totalHits / perPage)) {
    isLoading = true;
    return;
  }

  isLoading = true;

  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: '36817404-47f661a18c4ba676724276e01',
        q: currentSearchQuery,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        page: page,
        per_page: perPage,
      },
    });
    const { hits: newHits, totalHits: responseTotalHits } = response.data;
    totalHits = responseTotalHits;
    if (newHits.length === 0) {
      loadMoreBtn.classList.add('hidden');
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    hits.push(...newHits);
    renderImages(newHits);
    page++;
    isLoading = false;
  } catch (error) {
    console.log('Error:', error);
    isLoading = false;
    Notiflix.Notify.failure('Something went wrong. Please try again later.');
  }
}

let endMessageDisplayed = false;

function handleScroll() {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement;

  if (
    scrollTop + clientHeight >= scrollHeight - 200 &&
    !isLoading &&
    !endMessageDisplayed
  ) {
    loadMoreImages();
  }
  if (page > Math.ceil(totalHits / perPage)) {
    if (hits.length === 0) {
      loadMoreBtn.classList.add('hidden');
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    } else if (!endMessageDisplayed) {
      loadMoreBtn.classList.add('hidden');
      Notiflix.Notify.warning(
        "We're sorry, but you've reached the end of search results."
      );
      endMessageDisplayed = true;
    }
  } else {
    endMessageDisplayed = false;
  }
}
