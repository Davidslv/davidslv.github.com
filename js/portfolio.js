/**
 * Portfolio Navigation and Animation Handler
 */

(function() {
  'use strict';

  // Configuration
  const ANIMATION_DURATION = 400; // milliseconds
  const PROJECTS = ['dashboard', 'microblog', 'pokedex', 'roguelike', 'manuscript-forge', 'cashew'];
  const DEFAULT_PROJECT = 'dashboard';

  // State
  let currentProject = null;
  let isAnimating = false;

  /**
   * Initialize portfolio functionality
   */
  function init() {
    // Get initial project from URL hash or default
    const hash = window.location.hash.slice(1);
    const initialProject = hash && PROJECTS.includes(hash) ? hash : DEFAULT_PROJECT;

    // Set up navigation links
    setupNavigation();

    // Set up keyboard navigation
    setupKeyboardNavigation();

    // Show initial project
    showProject(initialProject, false);

    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);
  }

  /**
   * Set up navigation link handlers
   */
  function setupNavigation() {
    const navLinks = document.querySelectorAll('.portfolio-nav-link');

    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const project = this.getAttribute('data-project');
        if (project && !isAnimating) {
          showProject(project, true);
        }
      });
    });
  }

  /**
   * Set up keyboard navigation
   */
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
      // Don't interfere with typing in inputs or textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateToAdjacentProject(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateToAdjacentProject(1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        showProject(PROJECTS[0], true);
      } else if (e.key === 'End') {
        e.preventDefault();
        showProject(PROJECTS[PROJECTS.length - 1], true);
      }
    });
  }

  /**
   * Navigate to adjacent project
   */
  function navigateToAdjacentProject(direction) {
    if (isAnimating) return;

    const currentIndex = PROJECTS.indexOf(currentProject);
    if (currentIndex === -1) return;

    let newIndex = currentIndex + direction;
    if (newIndex < 0) {
      newIndex = PROJECTS.length - 1;
    } else if (newIndex >= PROJECTS.length) {
      newIndex = 0;
    }

    showProject(PROJECTS[newIndex], true);
  }

  /**
   * Show a specific project with animation
   */
  function showProject(projectId, animate = true, updateHistory = true) {
    if (!PROJECTS.includes(projectId) || isAnimating) {
      return;
    }

    const projectElement = document.getElementById(projectId);
    if (!projectElement) {
      return;
    }

    // If same project, do nothing
    if (currentProject === projectId) {
      return;
    }

    isAnimating = animate;

    // Get current and new project elements
    const currentElement = currentProject ? document.getElementById(currentProject) : null;
    const newElement = projectElement;

    // Update navigation active state
    updateNavigationState(projectId);

    // Fade out current project
    if (currentElement && animate) {
      currentElement.classList.add('fade-out');

      setTimeout(() => {
        currentElement.style.display = 'none';
        currentElement.classList.remove('fade-out');

        // Fade in new project
        newElement.style.display = 'block';
        newElement.classList.add('fade-in');

        // Focus management for accessibility
        focusProject(newElement);

        setTimeout(() => {
          newElement.classList.remove('fade-in');
          isAnimating = false;
        }, ANIMATION_DURATION);
      }, ANIMATION_DURATION);
    } else {
      // No animation - just show immediately
      if (currentElement) {
        currentElement.style.display = 'none';
      }
      newElement.style.display = 'block';
      focusProject(newElement);
      isAnimating = false;
    }

    // Update current project
    currentProject = projectId;

    // Update URL hash
    if (updateHistory) {
      const newUrl = window.location.pathname + '#' + projectId;
      window.history.pushState({ project: projectId }, '', newUrl);
    }

    // Update page title
    updatePageTitle(projectId);
  }

  /**
   * Update navigation active state
   */
  function updateNavigationState(activeProjectId) {
    const navLinks = document.querySelectorAll('.portfolio-nav-link');
    navLinks.forEach(link => {
      if (link.getAttribute('data-project') === activeProjectId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Focus management for accessibility
   */
  function focusProject(projectElement) {
    // Focus the project title for screen readers
    const title = projectElement.querySelector('.project-title');
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus();
      // Remove tabindex after focus to avoid tab navigation issues
      setTimeout(() => {
        title.removeAttribute('tabindex');
      }, 100);
    }
  }

  /**
   * Update page title
   */
  function updatePageTitle(projectId) {
    const projectElement = document.getElementById(projectId);
    if (projectElement) {
      const titleElement = projectElement.querySelector('.project-title');
      if (titleElement) {
        const projectName = titleElement.textContent;
        document.title = projectName + ' - Portfolio | ' + (document.title.split(' - ')[1] || 'Davidslv');
      }
    }
  }

  /**
   * Handle browser back/forward navigation
   */
  function handlePopState(e) {
    const hash = window.location.hash.slice(1);
    const project = hash && PROJECTS.includes(hash) ? hash : DEFAULT_PROJECT;
    showProject(project, true, false);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

