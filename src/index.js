import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios from 'axios';

const searchForm = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
let currentPage = 1;
const imagesPerPage = 40;
let lightbox;
let endOfResultsShown = false;
let successMessageShown = false;

function toggleLoadMoreButton(show) {
  const loadMoreButton = document.querySelector('.load-more');
  loadMoreButton.style.display = show ? 'block' : 'none';
}

function resetPagination() {
  currentPage = 1;
}

function createInfoItem(label, value) {
  const item = document.createElement('div');
  item.classList.add('info-item');

  const itemLabel = document.createElement('span');
  itemLabel.classList.add('info-label');
  itemLabel.textContent = label;

  const itemValue = document.createElement('span');
  itemValue.classList.add('info-value');
  itemValue.textContent = value;

  item.appendChild(itemLabel);
  item.appendChild(itemValue);

  return item;
}

searchForm.addEventListener('submit', handleSubmit);
window.addEventListener('scroll', handleScroll);

toggleLoadMoreButton(false);

async function handleSubmit(event) {
  event.preventDefault();
  const searchQuery = event.target.elements.searchQuery.value.trim();
  if (searchQuery === '') return;

  clearGallery();
  resetPagination();
  successMessageShown = false;
  endOfResultsShown = false;
  await searchImages(searchQuery);
  toggleLoadMoreButton(false);
}

function handleScroll() {
  const scrollPosition = window.innerHeight + window.scrollY;
  const documentHeight = document.documentElement.offsetHeight;

  if (scrollPosition >= documentHeight - 1000) {
    const searchQuery = searchForm.elements.searchQuery.value.trim();
    handleLoadMore(searchQuery);
  }
}

async function handleLoadMore(searchQuery) {
  if (endOfResultsShown) {
    return;
  }
  await searchImages(searchQuery);
}

async function searchImages(query) {
  const apiKey = '36817404-47f661a18c4ba676724276e01';
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&image_type=photo&orientation=horizontal&safesearch=true&page=${currentPage}&per_page=${imagesPerPage}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.hits.length === 0) {
      if (currentPage === 1) {
        Notiflix.Notify.info(
          'Sorry, there are no images matching your search query. Please try again.'
        );
      } else {
        toggleLoadMoreButton(false);
        if (!endOfResultsShown) {
          Notiflix.Notify.warning(
            "We're sorry, but you've reached the end of search results."
          );
          endOfResultsShown = true;
        }
      }
    } else {
      renderImages(data.hits);
      currentPage++;
      if (currentPage > 1) {
        toggleLoadMoreButton(true);
      }
      if (currentPage > data.totalPages) {
        toggleLoadMoreButton(false);
        if (data.totalHits > 0 && !successMessageShown) {
          Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
          successMessageShown = true;
        }
      }
    }

    if (currentPage === 2 && !successMessageShown) {
      Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
      successMessageShown = true;
    }
  } catch (error) {
    console.log('Error:', error);
    Notiflix.Notify.failure('An error occurred. Please try again later.');
  }
}

function smoothScrollToNextGroup() {
  const cardHeight = gallery.firstElementChild.getBoundingClientRect().height;
  const scrollTo = currentPage * imagesPerPage * cardHeight;

  window.scrollBy({
    top: scrollTo,
    behavior: 'smooth',
  });
}

function clearGallery() {
  gallery.innerHTML = '';
  if (lightbox) {
    lightbox.close();
    lightbox = null;
  }
}

function createPhotoCard(image) {
  const {
    webformatURL,
    largeImageURL,
    tags,
    likes,
    views,
    comments,
    downloads,
  } = image;

  const photoCard = document.createElement('a');
  photoCard.classList.add('photo-card');
  photoCard.href = largeImageURL;

  const img = document.createElement('img');
  img.src = webformatURL;
  img.alt = tags;
  img.loading = 'lazy';

  const info = document.createElement('div');
  info.classList.add('info');

  const likesInfo = createInfoItem('Likes', likes);
  const viewsInfo = createInfoItem('Views', views);
  const commentsInfo = createInfoItem('Comments', comments);
  const downloadsInfo = createInfoItem('Downloads', downloads);

  info.appendChild(likesInfo);
  info.appendChild(viewsInfo);
  info.appendChild(commentsInfo);
  info.appendChild(downloadsInfo);

  photoCard.appendChild(img);
  photoCard.appendChild(info);

  return photoCard;
}

const renderedImages = {};

function renderImages(images) {
  const fragment = document.createDocumentFragment();

  images.forEach(image => {
    if (!renderedImages[image.webformatURL]) {
      const photoCard = createPhotoCard(image);
      if (photoCard) {
        fragment.appendChild(photoCard);
        renderedImages[image.webformatURL] = true;
      }
    }
  });

  gallery.appendChild(fragment);
  refreshLightbox();
  toggleLoadMoreButton(images.length === imagesPerPage);
}

function refreshLightbox() {
  if (lightbox) {
    lightbox.refresh();
  } else {
    lightbox = new SimpleLightbox('.gallery a', {});
  }
}

window.addEventListener('DOMContentLoaded', refreshLightbox);
