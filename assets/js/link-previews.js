class LinkPreviews {
  constructor(options = {}) {
    this.options = {
      wrapperSelector: 'content',
      transitionDuration: 150,
      showDelay: 100,
      hideDelay: 200,
      ...options
    };
    
    this.cache = new Map();
    this.timers = {
      show: null,
      hide: null
    };
    
    this.createElements();
    this.bindEvents();
  }

  createElements() {
    // Create tooltip wrapper
    this.tooltipWrapper = document.createElement('div');
    this.tooltipWrapper.className = 'tooltip-wrapper';
    this.tooltipWrapper.setAttribute('role', 'tooltip');
    this.tooltipWrapper.setAttribute('aria-hidden', 'true');
    
    // Create tooltip content container
    this.tooltipContent = document.createElement('div');
    this.tooltipContent.className = 'tooltip-content';
    this.tooltipWrapper.appendChild(this.tooltipContent);
    
    // Create hidden iframe for loading content
    this.iframe = document.createElement('iframe');
    this.iframe.className = 'link-preview-iframe';
    this.iframe.setAttribute('aria-hidden', 'true');
    this.iframe.setAttribute('tabindex', '-1');
    
    // Add elements to DOM
    document.body.appendChild(this.tooltipWrapper);
    document.body.appendChild(this.iframe);
  }

  bindEvents() {
    // Use event delegation for better performance
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    
    // Handle tooltip wrapper events
    this.tooltipWrapper.addEventListener('mouseenter', this.handleTooltipEnter.bind(this));
    this.tooltipWrapper.addEventListener('mouseleave', this.handleTooltipLeave.bind(this));
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  handleMouseOver(event) {
    const link = event.target.closest('a');
    if (!this.isInternalLink(link)) return;
    
    this.clearHideTimer();
    this.showTimer = setTimeout(() => {
      this.showPreview(link, event);
    }, this.options.showDelay);
  }

  handleMouseOut(event) {
    const link = event.target.closest('a');
    if (!this.isInternalLink(link)) return;
    
    this.clearShowTimer();
    this.hideTimer = setTimeout(() => {
      this.hidePreview();
    }, this.options.hideDelay);
  }

  handleTouchStart(event) {
    const link = event.target.closest('a');
    if (!this.isInternalLink(link)) return;
    
    // Hide preview on touch to prevent interference
    this.hidePreview();
  }

  handleTooltipEnter() {
    this.clearHideTimer();
  }

  handleTooltipLeave() {
    this.hideTimer = setTimeout(() => {
      this.hidePreview();
    }, this.options.hideDelay);
  }

  handleResize() {
    if (this.tooltipWrapper.classList.contains('visible')) {
      this.hidePreview();
    }
  }

  isInternalLink(link) {
    if (!link) return false;
    
    const containerSelector = this.options.wrapperSelector;
    const container = containerSelector ? document.querySelector(containerSelector) : document.body;
    
    return container.contains(link) && 
           link.host === window.location.host &&
           link.getAttribute('href') &&
           !link.classList.contains('external-link');
  }

  async showPreview(link, event) {
    try {
      const href = link.getAttribute('href');
      const content = await this.loadContent(href);
      
      if (!content) return;
      
      this.tooltipContent.innerHTML = content;
      this.positionTooltip(link, event);
      this.showTooltip();
      
    } catch (error) {
      console.warn('Failed to load link preview:', error);
      this.showErrorPreview(link);
    }
  }

  async loadContent(href) {
    // Check cache first
    if (this.cache.has(href)) {
      return this.cache.get(href);
    }
    
    return new Promise((resolve, reject) => {
      this.iframe.src = href;
      
      const timeout = setTimeout(() => {
        reject(new Error('Preview load timeout'));
      }, 5000);
      
      this.iframe.onload = () => {
        clearTimeout(timeout);
        
        try {
          const doc = this.iframe.contentDocument;
          if (!doc) {
            reject(new Error('Cannot access iframe content'));
            return;
          }
          
          const title = doc.querySelector('h1')?.textContent || 'Untitled';
          const content = doc.querySelector('content')?.innerHTML || 
                         doc.querySelector('main')?.innerHTML || 
                         doc.querySelector('article')?.innerHTML ||
                         '<p>No content available</p>';
          
          const previewContent = `
            <div class="preview-title">${this.sanitizeHTML(title)}</div>
            <div class="preview-content">${this.sanitizeHTML(content)}</div>
          `;
          
          this.cache.set(href, previewContent);
          resolve(previewContent);
          
        } catch (error) {
          reject(error);
        }
      };
      
      this.iframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load preview'));
      };
    });
  }

  showErrorPreview(link) {
    this.tooltipContent.innerHTML = `
      <div class="preview-error">
        <p>Preview not available</p>
        <p><small>Click to visit: ${link.getAttribute('href')}</small></p>
      </div>
    `;
    this.positionTooltip(link);
    this.showTooltip();
  }

  positionTooltip(link, event) {
    const linkRect = link.getBoundingClientRect();
    const tooltipRect = this.tooltipWrapper.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    let left = linkRect.left + (linkRect.width / 2) - (tooltipRect.width / 2);
    let top = linkRect.top + scrollTop - tooltipRect.height - 10;
    
    // Adjust horizontal position if tooltip would go off screen
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }
    
    // Adjust vertical position if tooltip would go off screen
    if (top < scrollTop + 10) {
      top = linkRect.bottom + scrollTop + 10;
    }
    
    this.tooltipWrapper.style.left = `${left}px`;
    this.tooltipWrapper.style.top = `${top}px`;
  }

  showTooltip() {
    this.tooltipWrapper.classList.add('visible');
    this.tooltipWrapper.setAttribute('aria-hidden', 'false');
  }

  hidePreview() {
    this.tooltipWrapper.classList.remove('visible');
    this.tooltipWrapper.setAttribute('aria-hidden', 'true');
    this.clearTimers();
  }

  clearShowTimer() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  clearHideTimer() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  clearTimers() {
    this.clearShowTimer();
    this.clearHideTimer();
  }

  sanitizeHTML(html) {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .substring(0, 500) + (html.length > 500 ? '...' : '');
  }

  destroy() {
    this.clearTimers();
    this.tooltipWrapper.remove();
    this.iframe.remove();
    this.cache.clear();
  }
}

// Initialize link previews when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get wrapper selector from the calling template
  const wrapperSelector = document.querySelector('meta[name="link-preview-wrapper"]')?.content || 'content';
  
  window.linkPreviews = new LinkPreviews({
    wrapperSelector: wrapperSelector
  });
});