// Mobile optimizations for better user experience
class MobileOptimizations {
  constructor() {
    this.isMobile = this.checkIfMobile();
    this.init();
  }

  checkIfMobile() {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  init() {
    if (this.isMobile) {
      this.setupMobileOptimizations();
    }
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
    
    // Listen for window resize
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
  }

  setupMobileOptimizations() {
    // Prevent zoom on double tap
    this.preventDoubleTapZoom();
    
    // Improve scrolling performance
    this.optimizeScrolling();
    
    // Add touch feedback
    this.addTouchFeedback();
    
    // Optimize images for mobile
    this.optimizeImages();
    
    // Improve form inputs
    this.optimizeFormInputs();
  }

  preventDoubleTapZoom() {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  optimizeScrolling() {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
    
    // Add momentum scrolling for iOS
    document.body.style.webkitOverflowScrolling = 'touch';
  }

  addTouchFeedback() {
    // Add touch feedback to interactive elements
    const touchElements = document.querySelectorAll('a, button, .note-item');
    
    touchElements.forEach(element => {
      element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.98)';
        element.style.transition = 'transform 0.1s ease';
      });
      
      element.addEventListener('touchend', () => {
        element.style.transform = 'scale(1)';
      });
      
      element.addEventListener('touchcancel', () => {
        element.style.transform = 'scale(1)';
      });
    });
  }

  optimizeImages() {
    // Lazy load images for better performance
    const images = document.querySelectorAll('img');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => {
        if (img.dataset.src) {
          imageObserver.observe(img);
        }
      });
    }
    
    // Add loading="lazy" to images
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  }

  optimizeFormInputs() {
    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (this.isMobile) {
          input.style.fontSize = '16px';
        }
      });
    });
  }

  handleOrientationChange() {
    // Recalculate layout after orientation change
    setTimeout(() => {
      // Trigger a resize event to update any responsive layouts
      window.dispatchEvent(new Event('resize'));
      
      // Scroll to top to prevent layout issues
      window.scrollTo(0, 0);
    }, 100);
  }

  handleResize() {
    const newIsMobile = this.checkIfMobile();
    
    if (newIsMobile !== this.isMobile) {
      this.isMobile = newIsMobile;
      
      if (this.isMobile) {
        this.setupMobileOptimizations();
      }
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize mobile optimizations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MobileOptimizations();
});

// Additional mobile-specific utilities
const MobileUtils = {
  // Check if device supports touch
  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // Get viewport dimensions
  getViewportSize: () => {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  },
  
  // Check if element is in viewport
  isInViewport: (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
  
  // Smooth scroll to element
  scrollToElement: (element, offset = 0) => {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// Export for use in other scripts
window.MobileUtils = MobileUtils; 