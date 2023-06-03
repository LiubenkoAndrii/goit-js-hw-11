import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios from 'axios';

const searchForm = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
const loadMoreButton = document.querySelector('.load-more');
let currentPage = 1;
const imagesPerPage = 40;
let lightbox;
let endOfResultsShown = false;
let successMessageShown = false;

searchForm.addEventListener('submit', handleSubmit);
loadMoreButton.addEventListener('click', handleLoadMore);
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
  window.addEventListener('scroll', handleScroll);
}

async function handleLoadMore() {
  const searchQuery = searchForm.elements.searchQuery.value.trim();
  if (searchQuery === '') return;
  await searchImages(searchQuery);
}


async function searchImages(query) {
  const encodedQuery = encodeURIComponent(query);
  const apiKey = '36817404-47f661a18c4ba676724276e01';
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodedQuery}&image_type=photo&orientation=horizontal&safesearch=true&page=${currentPage}&per_page=${imagesPerPage}`;

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
}

function renderImages(images) {
  images.forEach(image => {
    const photoCard = createPhotoCard(image);
    if (photoCard) {
      gallery.appendChild(photoCard);
    }
  });
  refreshLightbox();
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

function createInfoItem(label, value) {
  const item = document.createElement('div');
  item.classList.add('info-item');

  const itemLabel = document.createElement('span');
  itemLabel.classList.add('label');
  itemLabel.textContent = label;

  const itemValue = document.createElement('span');
  itemValue.classList.add('value');
  itemValue.textContent = value;

  item.appendChild(itemLabel);
  item.appendChild(itemValue);

  return item;
}

function resetPagination() {
  currentPage = 1;
}

function toggleLoadMoreButton(show) {
  loadMoreButton.style.display = show ? 'block' : 'none';
}

function handleScroll(event) {
  const scrollPosition = window.innerHeight + window.scrollY;
  const documentHeight = document.documentElement.offsetHeight;

  if (scrollPosition >= documentHeight - 1000) {
    const searchQuery = searchForm.elements.searchQuery.value;
    handleLoadMore(searchQuery);
  }
}

function refreshLightbox() {
  if (lightbox) {
    lightbox.refresh();
  } else {
    lightbox = new SimpleLightbox('.gallery a', {});
  }
}

window.addEventListener('DOMContentLoaded', refreshLightbox);
