/**
 * Screenshot Carousel Handler
 */

(function() {
  'use strict';

  function initCarousel(carousel) {
    const container = carousel.querySelector('.carousel-container');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    const indicators = carousel.querySelectorAll('.indicator');

    let currentSlide = 0;
    const totalSlides = slides.length;

    if (totalSlides <= 1) {
      // Hide controls if only one slide
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      const controls = carousel.querySelector('.carousel-controls');
      if (controls) controls.style.display = 'none';
      return;
    }

    function showSlide(index) {
      // Ensure index is within bounds
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;

      // Update slides with fade transition
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      // Update indicators
      indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
      });

      currentSlide = index;
    }

    // Previous button
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        showSlide(currentSlide - 1);
      });
    }

    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        showSlide(currentSlide + 1);
      });
    }

    // Indicator buttons
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        showSlide(index);
      });
    });

    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showSlide(currentSlide + 1);
      }
    });

    // Make carousel focusable for keyboard navigation
    carousel.setAttribute('tabindex', '0');

    // Auto-play (optional - uncomment to enable)
    // let autoPlayInterval;
    // function startAutoPlay() {
    //   autoPlayInterval = setInterval(() => {
    //     showSlide(currentSlide + 1);
    //   }, 5000);
    // }
    // function stopAutoPlay() {
    //   if (autoPlayInterval) {
    //     clearInterval(autoPlayInterval);
    //   }
    // }
    // startAutoPlay();
    // carousel.addEventListener('mouseenter', stopAutoPlay);
    // carousel.addEventListener('mouseleave', startAutoPlay);
  }

  // Initialize all carousels when DOM is ready
  function init() {
    const carousels = document.querySelectorAll('.screenshot-carousel');
    carousels.forEach(carousel => {
      initCarousel(carousel);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

