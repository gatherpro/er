// ERGOGAIN Theme JavaScript
// Apple-inspired interactions and animations

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all functionality
  initStickyHeader();
  initProductShowcase();
  initSearchModal();
  initSmoothScrolling();

  console.log('ERGOGAIN theme loaded successfully');
});

function initStickyHeader() {
  const header = document.querySelector('.header-premium');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initProductShowcase() {
  const showcaseItems = document.querySelectorAll('.showcase-item');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    showcaseItems.forEach(item => {
      observer.observe(item);
    });
  }
}

function initSearchModal() {
  const searchModal = document.querySelector('.header__search details');
  if (!searchModal) return;

  const searchInput = searchModal.querySelector('input[type="search"]');

  searchModal.addEventListener('toggle', function() {
    if (this.open && searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && searchModal.open) {
      searchModal.removeAttribute('open');
    }
  });
}

function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Custom Elements
class StickyHeader extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.header = this.querySelector('.header');
    this.onScrollHandler = this.onScroll.bind(this);
    window.addEventListener('scroll', this.onScrollHandler, false);
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScrollHandler);
  }

  onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100) {
      this.classList.add('scrolled');
    } else {
      this.classList.remove('scrolled');
    }
  }
}

class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    if (this.detailsContainer && this.summaryToggle) {
      this.detailsContainer.addEventListener('keyup', (event) =>
        event.code.toUpperCase() === 'ESCAPE' && this.close()
      );
      this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this));
      this.summaryToggle.setAttribute('role', 'button');
    }
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) {
      this.close(false);
    }
  }

  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');
  }

  close(focusToggle = true) {
    this.detailsContainer.removeAttribute('open');
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('overflow-hidden');

    if (focusToggle) {
      this.summaryToggle.focus();
    }
  }
}

// Register custom elements
customElements.define('sticky-header', StickyHeader);
customElements.define('details-modal', DetailsModal);